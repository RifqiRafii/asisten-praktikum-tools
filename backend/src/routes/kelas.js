import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// GET /api/kelas - Ambil semua kelas (opsional filter ?matakuliah_id=)
router.get('/', async (req, res) => {
  const { matakuliah_id } = req.query;

  try {
    let sql = `
      SELECT k.id, k.matakuliah_id, k.nama_kelas, mk.nama AS matakuliah_nama,
             COUNT(p.id) AS total_praktikan
      FROM kelas k
      JOIN matakuliah mk ON k.matakuliah_id = mk.id
      LEFT JOIN praktikan p ON k.id = p.kelas_id
    `;
    const params = [];

    if (matakuliah_id) {
      sql += ' WHERE k.matakuliah_id = ?';
      params.push(matakuliah_id);
    }

    sql += ' GROUP BY k.id, k.matakuliah_id, k.nama_kelas, mk.nama ORDER BY k.id ASC';

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error GET /api/kelas:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kelas', error: error.message });
  }
});

// POST /api/kelas - Tambah kelas baru pada suatu mata kuliah
router.post('/', async (req, res) => {
  const { matakuliah_id, nama_kelas } = req.body;

  if (!matakuliah_id) {
    return res.status(400).json({ success: false, message: 'Mata kuliah wajib dipilih' });
  }

  if (!nama_kelas || typeof nama_kelas !== 'string' || nama_kelas.trim() === '') {
    return res.status(400).json({ success: false, message: 'Nama kelas wajib diisi (misal: Kelas A, Kelas B)' });
  }

  try {
    const trimmedNamaKelas = nama_kelas.trim();

    // Pastikan matakuliah ada
    const [mkRows] = await pool.query('SELECT nama FROM matakuliah WHERE id = ?', [matakuliah_id]);
    if (mkRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mata kuliah tidak ditemukan' });
    }

    const [result] = await pool.query(
      'INSERT INTO kelas (matakuliah_id, nama_kelas) VALUES (?, ?)',
      [matakuliah_id, trimmedNamaKelas]
    );

    const [newRow] = await pool.query(
      `SELECT k.id, k.matakuliah_id, k.nama_kelas, mk.nama AS matakuliah_nama, 0 AS total_praktikan
       FROM kelas k
       JOIN matakuliah mk ON k.matakuliah_id = mk.id
       WHERE k.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: `Kelas "${trimmedNamaKelas}" berhasil ditambahkan`,
      data: newRow[0],
    });
  } catch (error) {
    console.error('Error POST /api/kelas:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan kelas', error: error.message });
  }
});

// DELETE /api/kelas/:id - Hapus kelas
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM kelas WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });
    }

    res.json({ success: true, message: 'Kelas berhasil dihapus' });
  } catch (error) {
    console.error('Error DELETE /api/kelas/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus kelas', error: error.message });
  }
});

export default router;

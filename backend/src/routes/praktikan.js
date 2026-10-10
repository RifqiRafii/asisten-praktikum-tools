import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// GET /api/praktikan - Ambil daftar praktikan (opsional filter ?kelas_id= atau ?matakuliah_id=)
router.get('/', async (req, res) => {
  const { kelas_id, matakuliah_id } = req.query;

  try {
    let sql = `
      SELECT p.id, p.nim, p.nama, p.kelas_id,
             k.nama_kelas, k.matakuliah_id, mk.nama AS matakuliah_nama
      FROM praktikan p
      LEFT JOIN kelas k ON p.kelas_id = k.id
      LEFT JOIN matakuliah mk ON k.matakuliah_id = mk.id
    `;
    const params = [];
    const conditions = [];

    if (kelas_id) {
      conditions.push('p.kelas_id = ?');
      params.push(kelas_id);
    }

    if (matakuliah_id) {
      conditions.push('k.matakuliah_id = ?');
      params.push(matakuliah_id);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY mk.id ASC, k.nama_kelas ASC, p.nim ASC';

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error GET /api/praktikan:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data praktikan', error: error.message });
  }
});

// POST /api/praktikan - Tambah praktikan baru (dengan kelas_id)
router.post('/', async (req, res) => {
  const { nim, nama, kelas_id } = req.body;

  if (!nim || typeof nim !== 'string' || nim.trim() === '') {
    return res.status(400).json({ success: false, message: 'NIM praktikan wajib diisi' });
  }

  if (!nama || typeof nama !== 'string' || nama.trim() === '') {
    return res.status(400).json({ success: false, message: 'Nama praktikan wajib diisi' });
  }

  if (!kelas_id) {
    return res.status(400).json({ success: false, message: 'Kelas wajib dipilih' });
  }

  try {
    const trimmedNim = nim.trim();
    const trimmedNama = nama.trim();

    // Pastikan kelas ada
    const [kelasRows] = await pool.query('SELECT nama_kelas FROM kelas WHERE id = ?', [kelas_id]);
    if (kelasRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });
    }

    // Cek duplikasi NIM di kelas yang sama
    const [dup] = await pool.query(
      'SELECT id FROM praktikan WHERE nim = ? AND kelas_id = ?',
      [trimmedNim, kelas_id]
    );

    if (dup.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Mahasiswa dengan NIM '${trimmedNim}' sudah terdaftar di ${kelasRows[0].nama_kelas}`,
      });
    }

    const [result] = await pool.query(
      'INSERT INTO praktikan (kelas_id, nim, nama) VALUES (?, ?, ?)',
      [kelas_id, trimmedNim, trimmedNama]
    );

    const [newRow] = await pool.query(
      `SELECT p.id, p.nim, p.nama, p.kelas_id,
              k.nama_kelas, k.matakuliah_id, mk.nama AS matakuliah_nama
       FROM praktikan p
       LEFT JOIN kelas k ON p.kelas_id = k.id
       LEFT JOIN matakuliah mk ON k.matakuliah_id = mk.id
       WHERE p.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Praktikan berhasil ditambahkan',
      data: newRow[0],
    });
  } catch (error) {
    console.error('Error POST /api/praktikan:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan praktikan', error: error.message });
  }
});

// DELETE /api/praktikan/:id - Hapus praktikan
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM praktikan WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Praktikan tidak ditemukan' });
    }

    res.json({ success: true, message: 'Praktikan berhasil dihapus' });
  } catch (error) {
    console.error('Error DELETE /api/praktikan/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus praktikan', error: error.message });
  }
});

export default router;

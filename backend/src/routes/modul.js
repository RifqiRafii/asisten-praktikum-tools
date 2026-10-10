import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// GET /api/modul - Ambil semua modul (opsional filter ?matakuliah_id=)
router.get('/', async (req, res) => {
  const { matakuliah_id } = req.query;

  try {
    let sql = `
      SELECT m.id, m.matakuliah_id, m.judul_modul, mk.nama AS matakuliah_nama
      FROM modul m
      JOIN matakuliah mk ON m.matakuliah_id = mk.id
    `;
    const params = [];

    if (matakuliah_id) {
      sql += ' WHERE m.matakuliah_id = ?';
      params.push(matakuliah_id);
    }

    sql += ' ORDER BY m.id DESC';

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error GET /api/modul:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data modul', error: error.message });
  }
});

// GET /api/modul/:id - Ambil detail 1 modul
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.matakuliah_id, m.judul_modul, mk.nama AS matakuliah_nama
       FROM modul m
       JOIN matakuliah mk ON m.matakuliah_id = mk.id
       WHERE m.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Modul tidak ditemukan' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error GET /api/modul/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil modul', error: error.message });
  }
});

// POST /api/modul - Tambah modul baru
router.post('/', async (req, res) => {
  const { matakuliah_id, judul_modul } = req.body;

  if (!matakuliah_id) {
    return res.status(400).json({ success: false, message: 'Mata kuliah wajib dipilih' });
  }

  if (!judul_modul || typeof judul_modul !== 'string' || judul_modul.trim() === '') {
    return res.status(400).json({ success: false, message: 'Judul modul wajib diisi' });
  }

  try {
    const trimmedJudul = judul_modul.trim();

    // Pastikan matakuliah ada
    const [mkRows] = await pool.query('SELECT nama FROM matakuliah WHERE id = ?', [matakuliah_id]);
    if (mkRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mata kuliah tidak ditemukan' });
    }

    const [result] = await pool.query(
      'INSERT INTO modul (matakuliah_id, judul_modul) VALUES (?, ?)',
      [matakuliah_id, trimmedJudul]
    );

    const [newRow] = await pool.query(
      `SELECT m.id, m.matakuliah_id, m.judul_modul, mk.nama AS matakuliah_nama
       FROM modul m
       JOIN matakuliah mk ON m.matakuliah_id = mk.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Modul berhasil ditambahkan',
      data: newRow[0],
    });
  } catch (error) {
    console.error('Error POST /api/modul:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan modul', error: error.message });
  }
});

// DELETE /api/modul/:id - Hapus modul
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM modul WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Modul tidak ditemukan' });
    }

    res.json({ success: true, message: 'Modul berhasil dihapus' });
  } catch (error) {
    console.error('Error DELETE /api/modul/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus modul', error: error.message });
  }
});

export default router;

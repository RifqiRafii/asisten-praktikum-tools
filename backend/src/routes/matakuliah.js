import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// GET /api/matakuliah - Ambil semua mata kuliah
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM matakuliah ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error GET /api/matakuliah:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data mata kuliah', error: error.message });
  }
});

// POST /api/matakuliah - Tambah mata kuliah baru
router.post('/', async (req, res) => {
  const { nama } = req.body;

  if (!nama || typeof nama !== 'string' || nama.trim() === '') {
    return res.status(400).json({ success: false, message: 'Nama mata kuliah wajib diisi' });
  }

  try {
    const trimmedNama = nama.trim();
    const [result] = await pool.query(
      'INSERT INTO matakuliah (nama) VALUES (?)',
      [trimmedNama]
    );

    const [newRow] = await pool.query('SELECT * FROM matakuliah WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Mata kuliah berhasil ditambahkan',
      data: newRow[0],
    });
  } catch (error) {
    console.error('Error POST /api/matakuliah:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan mata kuliah', error: error.message });
  }
});

// DELETE /api/matakuliah/:id - Hapus mata kuliah
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM matakuliah WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Mata kuliah tidak ditemukan' });
    }

    res.json({ success: true, message: 'Mata kuliah berhasil dihapus' });
  } catch (error) {
    console.error('Error DELETE /api/matakuliah/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus mata kuliah', error: error.message });
  }
});

export default router;

import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// GET /api/praktikan - Ambil semua praktikan
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM praktikan ORDER BY nim ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error GET /api/praktikan:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data praktikan', error: error.message });
  }
});

// POST /api/praktikan - Tambah praktikan baru
router.post('/', async (req, res) => {
  const { nim, nama } = req.body;

  if (!nim || typeof nim !== 'string' || nim.trim() === '') {
    return res.status(400).json({ success: false, message: 'NIM praktikan wajib diisi' });
  }

  if (!nama || typeof nama !== 'string' || nama.trim() === '') {
    return res.status(400).json({ success: false, message: 'Nama praktikan wajib diisi' });
  }

  try {
    const trimmedNim = nim.trim();
    const trimmedNama = nama.trim();

    const [result] = await pool.query(
      'INSERT INTO praktikan (nim, nama) VALUES (?, ?)',
      [trimmedNim, trimmedNama]
    );

    const [newRow] = await pool.query('SELECT * FROM praktikan WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Praktikan berhasil ditambahkan',
      data: newRow[0],
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: `Praktikan dengan NIM '${nim.trim()}' sudah terdaftar` });
    }
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

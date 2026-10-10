import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// Helper untuk memastikan format kriteria penilaian JSON valid
function formatKriteria(kriteria) {
  if (typeof kriteria === 'string') {
    try {
      return JSON.parse(kriteria);
    } catch {
      return [{ aspek: 'Umum', bobot: 100, deskripsi: kriteria }];
    }
  }
  if (Array.isArray(kriteria) || typeof kriteria === 'object') {
    return kriteria;
  }
  return [];
}

// GET /api/rubrik - Ambil semua rubrik (opsional filter ?modul_id=)
router.get('/', async (req, res) => {
  const { modul_id } = req.query;

  try {
    let sql = `
      SELECT r.id, r.modul_id, r.judul_tugas, r.instruksi_soal, r.kriteria_penilaian,
             m.judul_modul, m.matakuliah_id, mk.nama AS matakuliah_nama
      FROM rubrik r
      JOIN modul m ON r.modul_id = m.id
      JOIN matakuliah mk ON m.matakuliah_id = mk.id
    `;
    const params = [];

    if (modul_id) {
      sql += ' WHERE r.modul_id = ?';
      params.push(modul_id);
    }

    sql += ' ORDER BY r.id DESC';

    const [rows] = await pool.query(sql, params);

    // Format parse kriteria_penilaian jika berupa string JSON
    const parsedRows = rows.map((row) => ({
      ...row,
      kriteria_penilaian: typeof row.kriteria_penilaian === 'string'
        ? JSON.parse(row.kriteria_penilaian)
        : row.kriteria_penilaian,
    }));

    res.json({ success: true, data: parsedRows });
  } catch (error) {
    console.error('Error GET /api/rubrik:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data rubrik', error: error.message });
  }
});

// GET /api/rubrik/:id - Ambil detail 1 rubrik
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.modul_id, r.judul_tugas, r.instruksi_soal, r.kriteria_penilaian,
              m.judul_modul, m.matakuliah_id, mk.nama AS matakuliah_nama
       FROM rubrik r
       JOIN modul m ON r.modul_id = m.id
       JOIN matakuliah mk ON m.matakuliah_id = mk.id
       WHERE r.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Rubrik tidak ditemukan' });
    }

    const row = rows[0];
    const parsedRow = {
      ...row,
      kriteria_penilaian: typeof row.kriteria_penilaian === 'string'
        ? JSON.parse(row.kriteria_penilaian)
        : row.kriteria_penilaian,
    };

    res.json({ success: true, data: parsedRow });
  } catch (error) {
    console.error('Error GET /api/rubrik/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil rubrik', error: error.message });
  }
});

// POST /api/rubrik - Tambah rubrik baru
router.post('/', async (req, res) => {
  const { modul_id, judul_tugas, instruksi_soal, kriteria_penilaian } = req.body;

  if (!modul_id) {
    return res.status(400).json({ success: false, message: 'Modul wajib dipilih' });
  }

  if (!judul_tugas || typeof judul_tugas !== 'string' || judul_tugas.trim() === '') {
    return res.status(400).json({ success: false, message: 'Judul tugas wajib diisi' });
  }

  try {
    // Pastikan modul ada
    const [modulRows] = await pool.query('SELECT judul_modul FROM modul WHERE id = ?', [modul_id]);
    if (modulRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Modul tidak ditemukan' });
    }

    const formattedKriteria = formatKriteria(kriteria_penilaian);
    const kriteriaJsonString = JSON.stringify(formattedKriteria);

    const [result] = await pool.query(
      'INSERT INTO rubrik (modul_id, judul_tugas, instruksi_soal, kriteria_penilaian) VALUES (?, ?, ?, ?)',
      [modul_id, judul_tugas.trim(), instruksi_soal || '', kriteriaJsonString]
    );

    const [newRow] = await pool.query(
      `SELECT r.id, r.modul_id, r.judul_tugas, r.instruksi_soal, r.kriteria_penilaian,
              m.judul_modul, m.matakuliah_id, mk.nama AS matakuliah_nama
       FROM rubrik r
       JOIN modul m ON r.modul_id = m.id
       JOIN matakuliah mk ON m.matakuliah_id = mk.id
       WHERE r.id = ?`,
      [result.insertId]
    );

    const row = newRow[0];
    res.status(201).json({
      success: true,
      message: 'Rubrik tugas berhasil ditambahkan',
      data: {
        ...row,
        kriteria_penilaian: typeof row.kriteria_penilaian === 'string'
          ? JSON.parse(row.kriteria_penilaian)
          : row.kriteria_penilaian,
      },
    });
  } catch (error) {
    console.error('Error POST /api/rubrik:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan rubrik', error: error.message });
  }
});

// DELETE /api/rubrik/:id - Hapus rubrik
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM rubrik WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Rubrik tidak ditemukan' });
    }

    res.json({ success: true, message: 'Rubrik berhasil dihapus' });
  } catch (error) {
    console.error('Error DELETE /api/rubrik/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus rubrik', error: error.message });
  }
});

export default router;

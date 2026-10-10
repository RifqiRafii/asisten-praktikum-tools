import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// GET /api/penilaian - Ambil data penilaian (filter opsional)
router.get('/', async (req, res) => {
  const { modul_id, kelas_id, praktikan_id, matakuliah_id } = req.query;

  try {
    let sql = `
      SELECT p.id, p.praktikan_id, p.modul_id, p.nilai_angka, p.catatan_evaluasi, p.created_at,
             pr.nim, pr.nama AS praktikan_nama, pr.kelas_id,
             k.nama_kelas, k.matakuliah_id,
             mk.nama AS matakuliah_nama,
             m.judul_modul
      FROM penilaian p
      JOIN praktikan pr ON p.praktikan_id = pr.id
      LEFT JOIN kelas k ON pr.kelas_id = k.id
      LEFT JOIN matakuliah mk ON k.matakuliah_id = mk.id
      JOIN modul m ON p.modul_id = m.id
    `;
    const params = [];
    const conditions = [];

    if (modul_id) {
      conditions.push('p.modul_id = ?');
      params.push(modul_id);
    }
    if (kelas_id) {
      conditions.push('pr.kelas_id = ?');
      params.push(kelas_id);
    }
    if (praktikan_id) {
      conditions.push('p.praktikan_id = ?');
      params.push(praktikan_id);
    }
    if (matakuliah_id) {
      conditions.push('k.matakuliah_id = ?');
      params.push(matakuliah_id);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY pr.nim ASC, p.id DESC';

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error GET /api/penilaian:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data penilaian', error: error.message });
  }
});

// POST /api/penilaian - Simpan / Perbarui nilai praktikan (Upsert)
router.post('/', async (req, res) => {
  const { praktikan_id, modul_id, nilai_angka, catatan_evaluasi } = req.body;

  if (!praktikan_id) {
    return res.status(400).json({ success: false, message: 'Praktikan wajib dipilih' });
  }

  if (!modul_id) {
    return res.status(400).json({ success: false, message: 'Modul wajib dipilih' });
  }

  const numericNilai = parseFloat(nilai_angka);
  if (isNaN(numericNilai) || numericNilai < 0 || numericNilai > 100) {
    return res.status(400).json({ success: false, message: 'Nilai angka harus berupa angka antara 0 hingga 100' });
  }

  try {
    // Verifikasi bahwa praktikan dan modul valid sebelum simpan
    const [prRows] = await pool.query('SELECT id, nama FROM praktikan WHERE id = ?', [praktikan_id]);
    if (prRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Praktikan tidak ditemukan' });
    }

    const [modRows] = await pool.query('SELECT id, judul_modul FROM modul WHERE id = ?', [modul_id]);
    if (modRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Modul tidak ditemukan' });
    }

    // 1. Cek apakah penilaian untuk praktikan dan modul ini sudah ada
    const [existing] = await pool.query(
      'SELECT id FROM penilaian WHERE praktikan_id = ? AND modul_id = ?',
      [praktikan_id, modul_id]
    );

    let penilaianId;
    let isUpdate = false;

    if (existing.length > 0) {
      // UPDATE data lama
      penilaianId = existing[0].id;
      isUpdate = true;
      await pool.query(
        'UPDATE penilaian SET nilai_angka = ?, catatan_evaluasi = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?',
        [numericNilai, catatan_evaluasi || '', penilaianId]
      );
    } else {
      // INSERT baru
      const [insertRes] = await pool.query(
        'INSERT INTO penilaian (praktikan_id, modul_id, nilai_angka, catatan_evaluasi) VALUES (?, ?, ?, ?)',
        [praktikan_id, modul_id, numericNilai, catatan_evaluasi || '']
      );
      penilaianId = insertRes.insertId;
    }

    // Ambil baris lengkap setelah disimpan
    const [savedRow] = await pool.query(
      `SELECT p.id, p.praktikan_id, p.modul_id, p.nilai_angka, p.catatan_evaluasi, p.created_at,
              pr.nim, pr.nama AS praktikan_nama, pr.kelas_id,
              k.nama_kelas, k.matakuliah_id,
              mk.nama AS matakuliah_nama,
              m.judul_modul
       FROM penilaian p
       JOIN praktikan pr ON p.praktikan_id = pr.id
       LEFT JOIN kelas k ON pr.kelas_id = k.id
       LEFT JOIN matakuliah mk ON k.matakuliah_id = mk.id
       JOIN modul m ON p.modul_id = m.id
       WHERE p.id = ?`,
      [penilaianId]
    );

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'Nilai berhasil diperbarui' : 'Nilai berhasil disimpan',
      data: savedRow[0],
    });
  } catch (error) {
    console.error('Error POST /api/penilaian:', error);
    res.status(500).json({ success: false, message: 'Gagal menyimpan penilaian', error: error.message });
  }
});

// DELETE /api/penilaian/:id - Hapus penilaian
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM penilaian WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data penilaian tidak ditemukan' });
    }

    res.json({ success: true, message: 'Data penilaian berhasil dihapus' });
  } catch (error) {
    console.error('Error DELETE /api/penilaian/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus penilaian', error: error.message });
  }
});

export default router;

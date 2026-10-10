import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// GET /api/rekap - Rekapitulasi nilai matriks per mahasiswa & modul
router.get('/', async (req, res) => {
  const { matakuliah_id, kelas_id } = req.query;

  if (!matakuliah_id) {
    return res.status(400).json({
      success: false,
      message: 'Parameter matakuliah_id diperlukan',
    });
  }

  try {
    // 1. Ambil detail Mata Kuliah
    const [mkRows] = await pool.query('SELECT id, nama FROM matakuliah WHERE id = ?', [matakuliah_id]);
    if (mkRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mata kuliah tidak ditemukan' });
    }
    const matakuliah = mkRows[0];

    // 2. Ambil detail Kelas (jika dipilih)
    let kelas = null;
    if (kelas_id) {
      const [kRows] = await pool.query('SELECT id, nama_kelas, matakuliah_id FROM kelas WHERE id = ?', [kelas_id]);
      if (kRows.length > 0) {
        kelas = kRows[0];
      }
    }

    // 3. Ambil seluruh modul di mata kuliah ini
    const [modulList] = await pool.query(
      'SELECT id, judul_modul FROM modul WHERE matakuliah_id = ? ORDER BY id ASC',
      [matakuliah_id]
    );

    // 4. Ambil daftar praktikan
    let prQuery = `
      SELECT pr.id, pr.nim, pr.nama, pr.kelas_id, k.nama_kelas
      FROM praktikan pr
      JOIN kelas k ON pr.kelas_id = k.id
      WHERE k.matakuliah_id = ?
    `;
    const prParams = [matakuliah_id];

    if (kelas_id) {
      prQuery += ' AND pr.kelas_id = ?';
      prParams.push(kelas_id);
    }

    prQuery += ' ORDER BY k.nama_kelas ASC, pr.nim ASC';
    const [praktikanList] = await pool.query(prQuery, prParams);

    if (praktikanList.length === 0) {
      return res.json({
        success: true,
        data: {
          matakuliah,
          kelas,
          modulList,
          rekapMahasiswa: [],
          statistik: {
            totalPraktikan: 0,
            totalModul: modulList.length,
            rataRataKelas: 0,
            nilaiTertinggi: 0,
            nilaiTerendah: 0,
            persenLulus: 0,
          },
        },
      });
    }

    const praktikanIds = praktikanList.map((p) => p.id);

    // 5. Ambil seluruh penilaian untuk mahasiswa-mahasiswa tersebut
    const [penilaianRows] = await pool.query(
      `SELECT id, praktikan_id, modul_id, nilai_angka, catatan_evaluasi
       FROM penilaian
       WHERE praktikan_id IN (?)`,
      [praktikanIds]
    );

    // Petakan penilaian berdasarkan praktikan_id & modul_id
    const penilaianMap = new Map();
    penilaianRows.forEach((p) => {
      const key = `${p.praktikan_id}_${p.modul_id}`;
      penilaianMap.set(key, {
        id: p.id,
        nilai_angka: parseFloat(p.nilai_angka),
        catatan_evaluasi: p.catatan_evaluasi,
      });
    });

    // 6. Susun matriks rekapitulasi per mahasiswa
    let akumulasiRataRataSemua = 0;
    let countMahasiswaDinilai = 0;
    let maxNilai = 0;
    let minNilai = 100;
    let countLulus = 0;

    const rekapMahasiswa = praktikanList.map((p) => {
      const nilaiPerModul = {};
      let totalNilai = 0;
      let countDinilai = 0;

      modulList.forEach((m) => {
        const item = penilaianMap.get(`${p.id}_${m.id}`);
        if (item) {
          nilaiPerModul[m.id] = item;
          totalNilai += item.nilai_angka;
          countDinilai++;
        } else {
          nilaiPerModul[m.id] = null;
        }
      });

      const rataRata = countDinilai > 0 ? Math.round((totalNilai / countDinilai) * 100) / 100 : 0;

      // Hitung predikat
      let predikat = '-';
      if (countDinilai > 0) {
        if (rataRata >= 85) predikat = 'A';
        else if (rataRata >= 75) predikat = 'B';
        else if (rataRata >= 65) predikat = 'C';
        else if (rataRata >= 50) predikat = 'D';
        else predikat = 'E';
      }

      const status = countDinilai === 0 ? 'Belum Ada Nilai' : rataRata >= 60 ? 'Lulus' : 'Remedial';

      if (countDinilai > 0) {
        akumulasiRataRataSemua += rataRata;
        countMahasiswaDinilai++;
        if (rataRata > maxNilai) maxNilai = rataRata;
        if (rataRata < minNilai) minNilai = rataRata;
        if (rataRata >= 60) countLulus++;
      }

      return {
        id: p.id,
        nim: p.nim,
        nama: p.nama,
        kelas_id: p.kelas_id,
        nama_kelas: p.nama_kelas,
        nilaiPerModul,
        totalModulDinilai: countDinilai,
        rataRata,
        predikat,
        status,
      };
    });

    // 7. Hitung statistik keseluruhan kelas
    const rataRataKelas = countMahasiswaDinilai > 0
      ? Math.round((akumulasiRataRataSemua / countMahasiswaDinilai) * 100) / 100
      : 0;

    const statistik = {
      totalPraktikan: praktikanList.length,
      totalModul: modulList.length,
      mahasiswaDinilai: countMahasiswaDinilai,
      rataRataKelas,
      nilaiTertinggi: countMahasiswaDinilai > 0 ? maxNilai : 0,
      nilaiTerendah: countMahasiswaDinilai > 0 ? minNilai : 0,
      persenLulus: countMahasiswaDinilai > 0
        ? Math.round((countLulus / countMahasiswaDinilai) * 100)
        : 0,
    };

    res.json({
      success: true,
      data: {
        matakuliah,
        kelas,
        modulList,
        rekapMahasiswa,
        statistik,
      },
    });
  } catch (error) {
    console.error('Error GET /api/rekap:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data rekapitulasi',
      error: error.message,
    });
  }
});

export default router;

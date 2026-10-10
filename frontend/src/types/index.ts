export interface MataKuliah {
  id: number;
  nama: string;
}

export interface Kelas {
  id: number;
  matakuliah_id: number;
  nama_kelas: string;
  matakuliah_nama?: string;
  total_praktikan?: number;
}

export interface Praktikan {
  id: number;
  kelas_id: number;
  nim: string;
  nama: string;
  nama_kelas?: string;
  matakuliah_id?: number;
  matakuliah_nama?: string;
}

export interface OpsiKriteria {
  label: string; // 'a', 'b', 'c'
  tingkat: string; // 'Tabel sesuai ketentuan', 'Hanya kolom/baris saja', 'Tidak ada yang benar'
  skor_persen: number; // 100, 50, 0
}

export interface KriteriaItem {
  id?: string;
  aspek: string;
  bobot: number;
  deskripsi?: string;
  opsi?: OpsiKriteria[];
}

export interface Modul {
  id: number;
  matakuliah_id: number;
  judul_modul: string;
  matakuliah_nama?: string;
}

export interface Rubrik {
  id: number;
  modul_id: number;
  judul_tugas: string;
  instruksi_soal: string;
  kriteria_penilaian: KriteriaItem[];
  judul_modul?: string;
  matakuliah_id?: number;
  matakuliah_nama?: string;
}

export interface Penilaian {
  id: number;
  praktikan_id: number;
  modul_id: number;
  nilai_angka: number | string;
  catatan_evaluasi: string;
  created_at?: string;
  nim?: string;
  praktikan_nama?: string;
  kelas_id?: number;
  nama_kelas?: string;
  matakuliah_id?: number;
  matakuliah_nama?: string;
  judul_modul?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

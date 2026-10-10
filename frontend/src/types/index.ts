export interface MataKuliah {
  id: number;
  nama: string;
}

export interface Praktikan {
  id: number;
  nim: string;
  nama: string;
}

export interface KriteriaItem {
  id?: string;
  aspek: string;
  bobot: number;
  deskripsi?: string;
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

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

import type { MataKuliah, Kelas, Praktikan, Modul, Rubrik, Penilaian, RekapData, ApiResponse } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export const api = {
  // DB Status
  async checkDbStatus(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/db-status`);
    return res.json();
  },

  // Mata Kuliah
  async getMataKuliah(): Promise<ApiResponse<MataKuliah[]>> {
    const res = await fetch(`${API_BASE_URL}/matakuliah`);
    return res.json();
  },

  async addMataKuliah(nama: string): Promise<ApiResponse<MataKuliah>> {
    const res = await fetch(`${API_BASE_URL}/matakuliah`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama }),
    });
    return res.json();
  },

  async deleteMataKuliah(id: number): Promise<ApiResponse<null>> {
    const res = await fetch(`${API_BASE_URL}/matakuliah/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Kelas
  async getKelas(matakuliahId?: number): Promise<ApiResponse<Kelas[]>> {
    const url = matakuliahId
      ? `${API_BASE_URL}/kelas?matakuliah_id=${matakuliahId}`
      : `${API_BASE_URL}/kelas`;
    const res = await fetch(url);
    return res.json();
  },

  async addKelas(matakuliahId: number, namaKelas: string): Promise<ApiResponse<Kelas>> {
    const res = await fetch(`${API_BASE_URL}/kelas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matakuliah_id: matakuliahId, nama_kelas: namaKelas }),
    });
    return res.json();
  },

  async deleteKelas(id: number): Promise<ApiResponse<null>> {
    const res = await fetch(`${API_BASE_URL}/kelas/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Praktikan
  async getPraktikan(kelasId?: number, matakuliahId?: number): Promise<ApiResponse<Praktikan[]>> {
    const params = new URLSearchParams();
    if (kelasId) params.append('kelas_id', String(kelasId));
    if (matakuliahId) params.append('matakuliah_id', String(matakuliahId));
    const url = params.toString()
      ? `${API_BASE_URL}/praktikan?${params.toString()}`
      : `${API_BASE_URL}/praktikan`;
    const res = await fetch(url);
    return res.json();
  },

  async addPraktikan(nim: string, nama: string, kelasId: number): Promise<ApiResponse<Praktikan>> {
    const res = await fetch(`${API_BASE_URL}/praktikan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nim, nama, kelas_id: kelasId }),
    });
    return res.json();
  },

  async deletePraktikan(id: number): Promise<ApiResponse<null>> {
    const res = await fetch(`${API_BASE_URL}/praktikan/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Modul
  async getModul(matakuliahId?: number): Promise<ApiResponse<Modul[]>> {
    const url = matakuliahId
      ? `${API_BASE_URL}/modul?matakuliah_id=${matakuliahId}`
      : `${API_BASE_URL}/modul`;
    const res = await fetch(url);
    return res.json();
  },

  async addModul(matakuliahId: number, judulModul: string): Promise<ApiResponse<Modul>> {
    const res = await fetch(`${API_BASE_URL}/modul`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matakuliah_id: matakuliahId, judul_modul: judulModul }),
    });
    return res.json();
  },

  async deleteModul(id: number): Promise<ApiResponse<null>> {
    const res = await fetch(`${API_BASE_URL}/modul/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Rubrik
  async getRubrik(modulId?: number): Promise<ApiResponse<Rubrik[]>> {
    const url = modulId
      ? `${API_BASE_URL}/rubrik?modul_id=${modulId}`
      : `${API_BASE_URL}/rubrik`;
    const res = await fetch(url);
    return res.json();
  },

  async addRubrik(payload: {
    modul_id: number;
    judul_tugas: string;
    instruksi_soal: string;
    kriteria_penilaian: any;
  }): Promise<ApiResponse<Rubrik>> {
    const res = await fetch(`${API_BASE_URL}/rubrik`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async deleteRubrik(id: number): Promise<ApiResponse<null>> {
    const res = await fetch(`${API_BASE_URL}/rubrik/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Penilaian
  async getPenilaian(params?: {
    modul_id?: number;
    kelas_id?: number;
    praktikan_id?: number;
    matakuliah_id?: number;
  }): Promise<ApiResponse<Penilaian[]>> {
    const query = new URLSearchParams();
    if (params?.modul_id) query.append('modul_id', String(params.modul_id));
    if (params?.kelas_id) query.append('kelas_id', String(params.kelas_id));
    if (params?.praktikan_id) query.append('praktikan_id', String(params.praktikan_id));
    if (params?.matakuliah_id) query.append('matakuliah_id', String(params.matakuliah_id));
    const url = query.toString()
      ? `${API_BASE_URL}/penilaian?${query.toString()}`
      : `${API_BASE_URL}/penilaian`;
    const res = await fetch(url);
    return res.json();
  },

  async savePenilaian(payload: {
    praktikan_id: number;
    modul_id: number;
    nilai_angka: number;
    catatan_evaluasi: string;
  }): Promise<ApiResponse<Penilaian>> {
    const res = await fetch(`${API_BASE_URL}/penilaian`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async deletePenilaian(id: number): Promise<ApiResponse<null>> {
    const res = await fetch(`${API_BASE_URL}/penilaian/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Rekapitulasi
  async getRekap(matakuliahId: number, kelasId?: number): Promise<ApiResponse<RekapData>> {
    const query = new URLSearchParams({ matakuliah_id: String(matakuliahId) });
    if (kelasId) query.append('kelas_id', String(kelasId));
    const res = await fetch(`${API_BASE_URL}/rekap?${query.toString()}`);
    return res.json();
  },
};

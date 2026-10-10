import type { MataKuliah, Praktikan, Modul, Rubrik, ApiResponse } from '../types';

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

  // Praktikan
  async getPraktikan(): Promise<ApiResponse<Praktikan[]>> {
    const res = await fetch(`${API_BASE_URL}/praktikan`);
    return res.json();
  },

  async addPraktikan(nim: string, nama: string): Promise<ApiResponse<Praktikan>> {
    const res = await fetch(`${API_BASE_URL}/praktikan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nim, nama }),
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
};

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import type { MataKuliah } from '../types';
import { api } from '../services/api';

interface MataKuliahManagerProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export default function MataKuliahManager({ onNotify }: MataKuliahManagerProps) {
  const [list, setList] = useState<MataKuliah[]>([]);
  const [nama, setNama] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchMataKuliah = async () => {
    setLoading(true);
    try {
      const res = await api.getMataKuliah();
      if (res.success && res.data) {
        setList(res.data);
      }
    } catch {
      onNotify('error', 'Gagal memuat daftar mata kuliah dari server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMataKuliah();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      onNotify('error', 'Nama mata kuliah tidak boleh kosong');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.addMataKuliah(nama.trim());
      if (res.success && res.data) {
        setList((prev) => [res.data!, ...prev]);
        setNama('');
        onNotify('success', `Mata kuliah "${res.data.nama}" berhasil disimpan`);
      } else {
        onNotify('error', res.message || 'Gagal menyimpan mata kuliah');
      }
    } catch {
      onNotify('error', 'Terjadi kesalahan jaringan saat menyimpan mata kuliah');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, namaMatkul: string) => {
    if (!window.confirm(`Hapus mata kuliah "${namaMatkul}"?`)) return;

    setDeletingId(id);
    try {
      const res = await api.deleteMataKuliah(id);
      if (res.success) {
        setList((prev) => prev.filter((item) => item.id !== id));
        onNotify('success', `Mata kuliah "${namaMatkul}" berhasil dihapus`);
      } else {
        onNotify('error', res.message || 'Gagal menghapus mata kuliah');
      }
    } catch {
      onNotify('error', 'Terjadi kesalahan saat menghapus data');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header Card */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 leading-tight flex items-center gap-2">
              Mata Kuliah
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {list.length} Data
              </span>
            </h2>
            <p className="text-xs text-slate-500">Master kurikulum & praktikum aktif</p>
          </div>
        </div>
      </div>

      {/* Form Tambah */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-5 border-b border-slate-200 bg-white">
        <label htmlFor="input-matkul" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
          Tambah Mata Kuliah Baru
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            id="input-matkul"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Pemrograman Web, Algoritma & Struktur Data"
            className="flex-1 h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !nama.trim()}
            className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Tambah Matkul</span>
          </button>
        </div>
      </form>

      {/* Daftar Tabel */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              <th className="py-2.5 px-4 w-16">ID</th>
              <th className="py-2.5 px-4">Nama Mata Kuliah</th>
              <th className="py-2.5 px-4 w-24 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Memuat data mata kuliah...</span>
                  </div>
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <AlertCircle className="w-5 h-5 text-slate-300 mb-1" />
                    <p className="text-xs font-medium text-slate-600">Belum ada mata kuliah tersimpan</p>
                    <p className="text-[11px] text-slate-400">Gunakan form di atas untuk menambahkan data pertama</p>
                  </div>
                </td>
              </tr>
            ) : (
              list.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-xs text-slate-500 font-medium">
                    #{item.id}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">
                    {item.nama}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(item.id, item.nama)}
                      disabled={deletingId === item.id}
                      title="Hapus mata kuliah"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50 cursor-pointer"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

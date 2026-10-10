import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Loader2, AlertCircle, Search } from 'lucide-react';
import type { Praktikan } from '../types';
import { api } from '../services/api';

interface PraktikanManagerProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export default function PraktikanManager({ onNotify }: PraktikanManagerProps) {
  const [list, setList] = useState<Praktikan[]>([]);
  const [nim, setNim] = useState('');
  const [nama, setNama] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchPraktikan = async () => {
    setLoading(true);
    try {
      const res = await api.getPraktikan();
      if (res.success && res.data) {
        setList(res.data);
      }
    } catch {
      onNotify('error', 'Gagal memuat daftar praktikan dari server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPraktikan();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nim.trim() || !nama.trim()) {
      onNotify('error', 'NIM dan Nama praktikan wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.addPraktikan(nim.trim(), nama.trim());
      if (res.success && res.data) {
        setList((prev) => [...prev, res.data!].sort((a, b) => a.nim.localeCompare(b.nim)));
        setNim('');
        setNama('');
        onNotify('success', `Praktikan "${res.data.nama}" (${res.data.nim}) berhasil ditambahkan`);
      } else {
        onNotify('error', res.message || 'Gagal menyimpan praktikan');
      }
    } catch {
      onNotify('error', 'Terjadi kesalahan jaringan saat menyimpan praktikan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, namaPraktikan: string, nimPraktikan: string) => {
    if (!window.confirm(`Hapus praktikan "${namaPraktikan}" (${nimPraktikan})?`)) return;

    setDeletingId(id);
    try {
      const res = await api.deletePraktikan(id);
      if (res.success) {
        setList((prev) => prev.filter((item) => item.id !== id));
        onNotify('success', `Praktikan "${namaPraktikan}" berhasil dihapus`);
      } else {
        onNotify('error', res.message || 'Gagal menghapus praktikan');
      }
    } catch {
      onNotify('error', 'Terjadi kesalahan saat menghapus praktikan');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredList = list.filter(
    (item) =>
      item.nim.toLowerCase().includes(search.toLowerCase()) ||
      item.nama.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header Card */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 leading-tight flex items-center gap-2">
              Praktikan Mahasiswa
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {list.length} Terdaftar
              </span>
            </h2>
            <p className="text-xs text-slate-500">Data mahasiswa untuk penilaian & pencatatan tugas</p>
          </div>
        </div>

        {/* Pencarian Cepat */}
        {list.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari NIM atau Nama..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
            />
          </div>
        )}
      </div>

      {/* Form Tambah */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-5 border-b border-slate-200 bg-white">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
          Tambah Praktikan Baru
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-4">
            <input
              type="text"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="NIM (contoh: 2200018001)"
              className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
              disabled={submitting}
            />
          </div>
          <div className="sm:col-span-5">
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama Lengkap Praktikan"
              className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
              disabled={submitting}
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={submitting || !nim.trim() || !nama.trim()}
              className="w-full h-10 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>Tambah</span>
            </button>
          </div>
        </div>
      </form>

      {/* Daftar Tabel */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              <th className="py-2.5 px-4 w-16">ID</th>
              <th className="py-2.5 px-4 w-40">NIM</th>
              <th className="py-2.5 px-4">Nama Mahasiswa</th>
              <th className="py-2.5 px-4 w-20 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Memuat data praktikan...</span>
                  </div>
                </td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <AlertCircle className="w-5 h-5 text-slate-300 mb-1" />
                    <p className="text-xs font-medium text-slate-600">
                      {search ? `Tidak ada praktikan cocok dengan "${search}"` : 'Belum ada praktikan terdaftar'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {search ? 'Coba ubah kata kunci pencarian' : 'Tambahkan NIM dan Nama melalui form di atas'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-xs text-slate-500 font-medium">
                    #{item.id}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs font-semibold text-emerald-700 bg-emerald-50/40 w-40">
                    {item.nim}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">
                    {item.nama}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(item.id, item.nama, item.nim)}
                      disabled={deletingId === item.id}
                      title="Hapus praktikan"
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

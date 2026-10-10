import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Loader2, AlertCircle, Search, School } from 'lucide-react';
import type { Praktikan, Kelas } from '../types';
import { api } from '../services/api';

interface PraktikanManagerProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export default function PraktikanManager({ onNotify }: PraktikanManagerProps) {
  const [list, setList] = useState<Praktikan[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);

  // Form Input
  const [nim, setNim] = useState('');
  const [nama, setNama] = useState('');
  const [selectedKelasId, setSelectedKelasId] = useState<number | ''>('');

  // Filter State
  const [filterKelasId, setFilterKelasId] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');

  // Loading States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prRes, kelasRes] = await Promise.all([
        api.getPraktikan(),
        api.getKelas(),
      ]);

      if (prRes.success && prRes.data) {
        setList(prRes.data);
      }
      if (kelasRes.success && kelasRes.data) {
        setKelasList(kelasRes.data);
        if (kelasRes.data.length > 0 && selectedKelasId === '') {
          setSelectedKelasId(kelasRes.data[0].id);
        }
      }
    } catch {
      onNotify('error', 'Gagal memuat data praktikan dan kelas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKelasId) {
      onNotify('error', 'Pilih kelas untuk praktikan ini terlebih dahulu');
      return;
    }
    if (!nim.trim() || !nama.trim()) {
      onNotify('error', 'NIM dan Nama praktikan wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.addPraktikan(nim.trim(), nama.trim(), Number(selectedKelasId));
      if (res.success && res.data) {
        setList((prev) => [...prev, res.data!].sort((a, b) => a.nim.localeCompare(b.nim)));
        setNim('');
        setNama('');
        onNotify('success', `Praktikan "${res.data.nama}" berhasil didaftarkan ke ${res.data.nama_kelas || 'Kelas'}`);
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

  // Filter List berdasarkan Kelas & Pencarian
  const filteredList = list.filter((item) => {
    const matchKelas = filterKelasId === 'all' || item.kelas_id === filterKelasId;
    const matchSearch =
      item.nim.toLowerCase().includes(search.toLowerCase()) ||
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      (item.nama_kelas && item.nama_kelas.toLowerCase().includes(search.toLowerCase())) ||
      (item.matakuliah_nama && item.matakuliah_nama.toLowerCase().includes(search.toLowerCase()));
    return matchKelas && matchSearch;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Header Card */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 leading-tight flex items-center gap-2">
              Daftar Praktikan Mahasiswa
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {filteredList.length} Mahasiswa
              </span>
            </h2>
            <p className="text-xs text-slate-500">Mahasiswa terdaftar per kelas praktikum</p>
          </div>
        </div>

        {/* Filter Kelas & Pencarian */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterKelasId}
            onChange={(e) => setFilterKelasId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="h-9 px-2.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="all">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.matakuliah_nama} - {k.nama_kelas}
              </option>
            ))}
          </select>

          <div className="relative w-44">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari NIM/Nama..."
              className="w-full h-9 pl-8 pr-2.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Form Tambah Praktikan Baru */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-5 border-b border-slate-200 bg-white">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
          Tambah Praktikan ke Kelas
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Pilih Kelas */}
          <div className="sm:col-span-4">
            <select
              value={selectedKelasId}
              onChange={(e) => setSelectedKelasId(Number(e.target.value))}
              className="w-full h-10 px-2.5 text-xs font-medium bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-emerald-600"
              disabled={submitting || kelasList.length === 0}
            >
              {kelasList.length === 0 ? (
                <option value="">Belum ada kelas (Buat di Tab Mata Kuliah)</option>
              ) : (
                kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.matakuliah_nama} • {k.nama_kelas}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* NIM */}
          <div className="sm:col-span-3">
            <input
              type="text"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="NIM (misal: 2200018001)"
              className="w-full h-10 px-3 text-xs font-mono bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              disabled={submitting}
            />
          </div>

          {/* Nama */}
          <div className="sm:col-span-3">
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama Lengkap Praktikan"
              className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              disabled={submitting}
            />
          </div>

          {/* Tombol Submit */}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting || !nim.trim() || !nama.trim() || !selectedKelasId}
              className="w-full h-10 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>Tambah</span>
            </button>
          </div>
        </div>
      </form>

      {/* Tabel Praktikan */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              <th className="py-2.5 px-4 w-12">ID</th>
              <th className="py-2.5 px-4 w-36">NIM</th>
              <th className="py-2.5 px-4">Nama Mahasiswa</th>
              <th className="py-2.5 px-4 w-52">Mata Kuliah & Kelas</th>
              <th className="py-2.5 px-4 w-16 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Memuat data praktikan...</span>
                  </div>
                </td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <AlertCircle className="w-5 h-5 text-slate-300 mb-1" />
                    <p className="text-xs font-medium text-slate-600">
                      {search ? `Tidak ada praktikan cocok dengan "${search}"` : 'Belum ada praktikan terdaftar'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Pilih kelas dan masukkan NIM serta Nama pada form di atas
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-xs text-slate-400">
                    #{item.id}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs font-semibold text-emerald-800 bg-emerald-50/40 w-36">
                    {item.nim}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-900 text-xs">
                    {item.nama}
                  </td>
                  <td className="py-2.5 px-4 w-52">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-600 font-medium">
                        {item.matakuliah_nama || 'Umum'}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold flex items-center gap-1">
                        <School className="w-2.5 h-2.5 text-emerald-600" />
                        {item.nama_kelas || 'Kelas A'}
                      </span>
                    </div>
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

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Loader2, AlertCircle, School, ChevronRight } from 'lucide-react';
import type { MataKuliah, Kelas } from '../types';
import { api } from '../services/api';

interface MataKuliahManagerProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export default function MataKuliahManager({ onNotify }: MataKuliahManagerProps) {
  const [matakuliahList, setMatakuliahList] = useState<MataKuliah[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [namaMatkul, setNamaMatkul] = useState('');
  
  // State Input Tambah Kelas per Matkul
  const [activeMatkulId, setActiveMatkulId] = useState<number | null>(null);
  const [newNamaKelas, setNewNamaKelas] = useState('');
  const [addingKelas, setAddingKelas] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submittingMatkul, setSubmittingMatkul] = useState(false);
  const [deletingMatkulId, setDeletingMatkulId] = useState<number | null>(null);
  const [deletingKelasId, setDeletingKelasId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mkRes, kelasRes] = await Promise.all([
        api.getMataKuliah(),
        api.getKelas(),
      ]);

      if (mkRes.success && mkRes.data) {
        setMatakuliahList(mkRes.data);
        if (mkRes.data.length > 0 && activeMatkulId === null) {
          setActiveMatkulId(mkRes.data[0].id);
        }
      }
      if (kelasRes.success && kelasRes.data) {
        setKelasList(kelasRes.data);
      }
    } catch {
      onNotify('error', 'Gagal memuat data mata kuliah dan kelas dari server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMatakuliah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaMatkul.trim()) {
      onNotify('error', 'Nama mata kuliah tidak boleh kosong');
      return;
    }

    setSubmittingMatkul(true);
    try {
      const res = await api.addMataKuliah(namaMatkul.trim());
      if (res.success && res.data) {
        setMatakuliahList((prev) => [res.data!, ...prev]);
        setActiveMatkulId(res.data.id);
        
        // Buat otomatis "Kelas A" sebagai kelas awal yang memudahkan
        const kelasDefault = await api.addKelas(res.data.id, 'Kelas A');
        if (kelasDefault.success && kelasDefault.data) {
          setKelasList((prev) => [...prev, kelasDefault.data!]);
        }

        setNamaMatkul('');
        onNotify('success', `Mata kuliah "${res.data.nama}" (dengan Kelas A) berhasil dibuat`);
      } else {
        onNotify('error', res.message || 'Gagal menyimpan mata kuliah');
      }
    } catch {
      onNotify('error', 'Terjadi kesalahan jaringan saat menyimpan mata kuliah');
    } finally {
      setSubmittingMatkul(false);
    }
  };

  const handleDeleteMatakuliah = async (id: number, nama: string) => {
    if (!window.confirm(`Hapus mata kuliah "${nama}" beserta seluruh kelas dan praktikan di dalamnya?`)) return;

    setDeletingMatkulId(id);
    try {
      const res = await api.deleteMataKuliah(id);
      if (res.success) {
        setMatakuliahList((prev) => prev.filter((item) => item.id !== id));
        setKelasList((prev) => prev.filter((item) => item.matakuliah_id !== id));
        if (activeMatkulId === id) {
          const remaining = matakuliahList.filter((m) => m.id !== id);
          setActiveMatkulId(remaining.length > 0 ? remaining[0].id : null);
        }
        onNotify('success', `Mata kuliah "${nama}" berhasil dihapus`);
      } else {
        onNotify('error', res.message || 'Gagal menghapus mata kuliah');
      }
    } catch {
      onNotify('error', 'Terjadi kesalahan saat menghapus data');
    } finally {
      setDeletingMatkulId(null);
    }
  };

  const handleAddKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatkulId) {
      onNotify('error', 'Pilih mata kuliah terlebih dahulu');
      return;
    }
    if (!newNamaKelas.trim()) {
      onNotify('error', 'Nama kelas tidak boleh kosong (misal: Kelas B)');
      return;
    }

    setAddingKelas(true);
    try {
      const res = await api.addKelas(activeMatkulId, newNamaKelas.trim());
      if (res.success && res.data) {
        setKelasList((prev) => [...prev, res.data!]);
        setNewNamaKelas('');
        onNotify('success', `Kelas "${res.data.nama_kelas}" berhasil ditambahkan`);
      } else {
        onNotify('error', res.message || 'Gagal menambahkan kelas');
      }
    } catch {
      onNotify('error', 'Terjadi kesalahan saat menambahkan kelas');
    } finally {
      setAddingKelas(false);
    }
  };

  const handleDeleteKelas = async (id: number, namaKelas: string) => {
    if (!window.confirm(`Hapus "${namaKelas}"? Praktikan dalam kelas ini juga akan terhapus.`)) return;

    setDeletingKelasId(id);
    try {
      const res = await api.deleteKelas(id);
      if (res.success) {
        setKelasList((prev) => prev.filter((k) => k.id !== id));
        onNotify('success', `Kelas "${namaKelas}" berhasil dihapus`);
      } else {
        onNotify('error', res.message || 'Gagal menghapus kelas');
      }
    } catch {
      onNotify('error', 'Terjadi kesalahan saat menghapus kelas');
    } finally {
      setDeletingKelasId(null);
    }
  };

  const selectedMk = matakuliahList.find((m) => m.id === activeMatkulId);
  const activeKelasForSelectedMk = kelasList.filter((k) => k.matakuliah_id === activeMatkulId);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Header Card */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 leading-tight flex items-center gap-2">
              Mata Kuliah & Kelas
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {matakuliahList.length} Matkul • {kelasList.length} Kelas
              </span>
            </h2>
            <p className="text-xs text-slate-500">Kelola mata kuliah dan kelas yang Anda ajar</p>
          </div>
        </div>
      </div>

      {/* Form Tambah Mata Kuliah */}
      <form onSubmit={handleAddMatakuliah} className="p-4 sm:p-5 border-b border-slate-200 bg-white">
        <label htmlFor="input-matkul" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
          Tambah Mata Kuliah Baru
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            id="input-matkul"
            type="text"
            value={namaMatkul}
            onChange={(e) => setNamaMatkul(e.target.value)}
            placeholder="Contoh: Pemrograman Web, Algoritma Pemrograman"
            className="flex-1 h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
            disabled={submittingMatkul}
          />
          <button
            type="submit"
            disabled={submittingMatkul || !namaMatkul.trim()}
            className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            {submittingMatkul ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Tambah Matkul</span>
          </button>
        </div>
      </form>

      {/* Grid: Daftar Matkul & Panel Kelas Terpilih */}
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        {/* Kolom Kiri: Daftar Mata Kuliah */}
        <div className="md:col-span-6 p-3 sm:p-4 space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block px-1">
            Daftar Mata Kuliah (Pilih untuk Kelola Kelas):
          </span>

          {loading ? (
            <div className="py-8 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span className="text-xs">Memuat mata kuliah...</span>
            </div>
          ) : matakuliahList.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <AlertCircle className="w-5 h-5 text-slate-300 mx-auto mb-1" />
              <p className="text-xs">Belum ada mata kuliah tersimpan</p>
            </div>
          ) : (
            matakuliahList.map((mk) => {
              const isSelected = activeMatkulId === mk.id;
              const countKelas = kelasList.filter((k) => k.matakuliah_id === mk.id).length;

              return (
                <div
                  key={mk.id}
                  onClick={() => setActiveMatkulId(mk.id)}
                  className={`p-3 rounded-md border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-medium text-slate-400">
                      #{mk.id}
                    </span>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 leading-snug">
                        {mk.nama}
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        {countKelas} Kelas Aktif
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMatakuliah(mk.id, mk.nama);
                      }}
                      disabled={deletingMatkulId === mk.id}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                      title="Hapus mata kuliah"
                    >
                      {deletingMatkulId === mk.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-300'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Kolom Kanan: Manajemen Kelas dari Matkul Terpilih */}
        <div className="md:col-span-6 p-4 sm:p-5 bg-slate-50/40 space-y-4">
          {selectedMk ? (
            <>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-900">
                    Kelas di "{selectedMk.nama}"
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {activeKelasForSelectedMk.length} Kelas
                </span>
              </div>

              {/* Form Tambah Kelas */}
              <form onSubmit={handleAddKelas} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newNamaKelas}
                  onChange={(e) => setNewNamaKelas(e.target.value)}
                  placeholder="Nama kelas baru (misal: Kelas B, IF-2A)"
                  className="flex-1 h-9 px-3 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  disabled={addingKelas}
                />
                <button
                  type="submit"
                  disabled={addingKelas || !newNamaKelas.trim()}
                  className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-medium rounded-md transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  {addingKelas ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Tambah Kelas</span>
                </button>
              </form>

              {/* Daftar Kelas Chips / List */}
              <div className="space-y-2">
                {activeKelasForSelectedMk.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    Belum ada kelas untuk mata kuliah ini. Tambahkan kelas di atas.
                  </p>
                ) : (
                  activeKelasForSelectedMk.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-md shadow-2xs hover:border-slate-300 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold text-slate-900 font-mono">
                          {k.nama_kelas}
                        </span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                          {k.total_praktikan || 0} Mahasiswa
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteKelas(k.id, k.nama_kelas)}
                        disabled={deletingKelasId === k.id}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                        title="Hapus kelas ini"
                      >
                        {deletingKelasId === k.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <p className="text-xs">Pilih mata kuliah di sebelah kiri untuk melihat dan menambah kelas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

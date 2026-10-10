import { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  Layers, 
  Trash2, 
  Plus, 
  Loader2, 
  AlertCircle, 
  FileCode, 
  Check, 
  Code, 
  SlidersHorizontal 
} from 'lucide-react';
import type { MataKuliah, Modul, Rubrik, KriteriaItem } from '../types';
import { api } from '../services/api';

interface ModulRubrikManagerProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

const DEFAULT_KRITERIA: KriteriaItem[] = [
  { aspek: 'Kesesuaian Spesifikasi & Fungsionalitas', bobot: 40, deskripsi: 'Fitur utama berjalan sesuai instruksi soal' },
  { aspek: 'Kualitas Kode & Best Practices', bobot: 30, deskripsi: 'Struktur kode rapi, indentasi konsisten, penamaan variabel jelas' },
  { aspek: 'Kreativitas & Validasi Input', bobot: 20, deskripsi: 'Penanganan edge cases dan penyajian antarmuka' },
  { aspek: 'Pemahaman & Wawancara / Demo', bobot: 10, deskripsi: 'Mampu menjelaskan alur logika kode yang dibuat' },
];

export default function ModulRubrikManager({ onNotify }: ModulRubrikManagerProps) {
  // State Data
  const [matakuliahList, setMatakuliahList] = useState<MataKuliah[]>([]);
  const [selectedMatakuliahId, setSelectedMatakuliahId] = useState<number | ''>('');
  const [modulList, setModulList] = useState<Modul[]>([]);
  const [selectedModulId, setSelectedModulId] = useState<number | ''>('');
  const [rubrikList, setRubrikList] = useState<Rubrik[]>([]);

  // State Form Modul
  const [newJudulModul, setNewJudulModul] = useState('');
  const [submittingModul, setSubmittingModul] = useState(false);

  // State Form Rubrik
  const [judulTugas, setJudulTugas] = useState('');
  const [instruksiSoal, setInstruksiSoal] = useState('');
  const [kriteriaMode, setKriteriaMode] = useState<'builder' | 'json'>('builder');
  const [kriteriaItems, setKriteriaItems] = useState<KriteriaItem[]>(DEFAULT_KRITERIA);
  const [kriteriaJsonText, setKriteriaJsonText] = useState(JSON.stringify(DEFAULT_KRITERIA, null, 2));
  const [submittingRubrik, setSubmittingRubrik] = useState(false);

  // Loading States
  const [loadingModul, setLoadingModul] = useState(false);
  const [loadingRubrik, setLoadingRubrik] = useState(false);
  const [deletingModulId, setDeletingModulId] = useState<number | null>(null);
  const [deletingRubrikId, setDeletingRubrikId] = useState<number | null>(null);

  // 1. Muat Mata Kuliah saat mount
  useEffect(() => {
    api.getMataKuliah().then((res) => {
      if (res.success && res.data) {
        setMatakuliahList(res.data);
        if (res.data.length > 0) {
          setSelectedMatakuliahId(res.data[0].id);
        }
      }
    });
  }, []);

  // 2. Muat Modul saat mata kuliah berubah
  useEffect(() => {
    if (!selectedMatakuliahId) {
      setModulList([]);
      setSelectedModulId('');
      return;
    }

    setLoadingModul(true);
    api.getModul(Number(selectedMatakuliahId))
      .then((res) => {
        if (res.success && res.data) {
          setModulList(res.data);
          if (res.data.length > 0) {
            setSelectedModulId(res.data[0].id);
          } else {
            setSelectedModulId('');
          }
        }
      })
      .finally(() => setLoadingModul(false));
  }, [selectedMatakuliahId]);

  // 3. Muat Rubrik saat modul berubah
  useEffect(() => {
    if (!selectedModulId) {
      setRubrikList([]);
      return;
    }

    setLoadingRubrik(true);
    api.getRubrik(Number(selectedModulId))
      .then((res) => {
        if (res.success && res.data) {
          setRubrikList(res.data);
        }
      })
      .finally(() => setLoadingRubrik(false));
  }, [selectedModulId]);

  // Handle Tambah Modul
  const handleAddModul = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatakuliahId) {
      onNotify('error', 'Pilih mata kuliah terlebih dahulu');
      return;
    }
    if (!newJudulModul.trim()) {
      onNotify('error', 'Judul modul tidak boleh kosong');
      return;
    }

    setSubmittingModul(true);
    try {
      const res = await api.addModul(Number(selectedMatakuliahId), newJudulModul.trim());
      if (res.success && res.data) {
        setModulList((prev) => [res.data!, ...prev]);
        setSelectedModulId(res.data.id);
        setNewJudulModul('');
        onNotify('success', `Modul "${res.data.judul_modul}" berhasil dibuat`);
      } else {
        onNotify('error', res.message || 'Gagal membuat modul');
      }
    } catch {
      onNotify('error', 'Kesalahan jaringan saat membuat modul');
    } finally {
      setSubmittingModul(false);
    }
  };

  // Handle Hapus Modul
  const handleDeleteModul = async (id: number, judul: string) => {
    if (!window.confirm(`Hapus modul "${judul}" beserta seluruh rubrik di dalamnya?`)) return;

    setDeletingModulId(id);
    try {
      const res = await api.deleteModul(id);
      if (res.success) {
        const remaining = modulList.filter((m) => m.id !== id);
        setModulList(remaining);
        if (selectedModulId === id) {
          setSelectedModulId(remaining.length > 0 ? remaining[0].id : '');
        }
        onNotify('success', `Modul "${judul}" berhasil dihapus`);
      } else {
        onNotify('error', res.message || 'Gagal menghapus modul');
      }
    } catch {
      onNotify('error', 'Kesalahan saat menghapus modul');
    } finally {
      setDeletingModulId(null);
    }
  };

  // Builder Kriteria Aspek
  const handleAddKriteriaRow = () => {
    const updated = [...kriteriaItems, { aspek: '', bobot: 10, deskripsi: '' }];
    setKriteriaItems(updated);
    setKriteriaJsonText(JSON.stringify(updated, null, 2));
  };

  const handleUpdateKriteriaRow = (index: number, field: keyof KriteriaItem, value: any) => {
    const updated = [...kriteriaItems];
    updated[index] = { ...updated[index], [field]: value };
    setKriteriaItems(updated);
    setKriteriaJsonText(JSON.stringify(updated, null, 2));
  };

  const handleRemoveKriteriaRow = (index: number) => {
    const updated = kriteriaItems.filter((_, i) => i !== index);
    setKriteriaItems(updated);
    setKriteriaJsonText(JSON.stringify(updated, null, 2));
  };

  const handleJsonChange = (text: string) => {
    setKriteriaJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        setKriteriaItems(parsed);
      }
    } catch {
      // Keep typing in JSON mode without crashing
    }
  };

  const totalBobot = kriteriaItems.reduce((acc, curr) => acc + (Number(curr.bobot) || 0), 0);

  // Handle Tambah Rubrik
  const handleAddRubrik = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModulId) {
      onNotify('error', 'Pilih atau buat modul terlebih dahulu');
      return;
    }
    if (!judulTugas.trim()) {
      onNotify('error', 'Judul tugas wajib diisi');
      return;
    }

    let finalKriteria = kriteriaItems;
    if (kriteriaMode === 'json') {
      try {
        finalKriteria = JSON.parse(kriteriaJsonText);
      } catch {
        onNotify('error', 'Format JSON kriteria penilaian tidak valid');
        return;
      }
    }

    setSubmittingRubrik(true);
    try {
      const res = await api.addRubrik({
        modul_id: Number(selectedModulId),
        judul_tugas: judulTugas.trim(),
        instruksi_soal: instruksiSoal.trim(),
        kriteria_penilaian: finalKriteria,
      });

      if (res.success && res.data) {
        setRubrikList((prev) => [res.data!, ...prev]);
        setJudulTugas('');
        setInstruksiSoal('');
        onNotify('success', `Rubrik "${res.data.judul_tugas}" berhasil disimpan`);
      } else {
        onNotify('error', res.message || 'Gagal menyimpan rubrik');
      }
    } catch {
      onNotify('error', 'Kesalahan jaringan saat menyimpan rubrik');
    } finally {
      setSubmittingRubrik(false);
    }
  };

  // Handle Hapus Rubrik
  const handleDeleteRubrik = async (id: number, judul: string) => {
    if (!window.confirm(`Hapus rubrik tugas "${judul}"?`)) return;

    setDeletingRubrikId(id);
    try {
      const res = await api.deleteRubrik(id);
      if (res.success) {
        setRubrikList((prev) => prev.filter((r) => r.id !== id));
        onNotify('success', `Rubrik "${judul}" berhasil dihapus`);
      } else {
        onNotify('error', res.message || 'Gagal menghapus rubrik');
      }
    } catch {
      onNotify('error', 'Kesalahan saat menghapus rubrik');
    } finally {
      setDeletingRubrikId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Selector Mata Kuliah Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <label htmlFor="select-matkul" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Mata Kuliah Aktif
          </label>
          <div className="flex items-center gap-3">
            <select
              id="select-matkul"
              value={selectedMatakuliahId}
              onChange={(e) => setSelectedMatakuliahId(Number(e.target.value))}
              className="h-10 px-3 pr-8 text-sm font-medium bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
            >
              {matakuliahList.length === 0 ? (
                <option value="">Belum ada mata kuliah (Buat di Tab Mata Kuliah)</option>
              ) : (
                matakuliahList.map((mk) => (
                  <option key={mk.id} value={mk.id}>
                    {mk.nama}
                  </option>
                ))
              )}
            </select>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              {loadingModul && <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />}
              <span>{modulList.length} Modul Terkait</span>
            </span>
          </div>
        </div>

        {/* Input Cepat Tambah Modul */}
        <form onSubmit={handleAddModul} className="flex items-center gap-2">
          <input
            type="text"
            value={newJudulModul}
            onChange={(e) => setNewJudulModul(e.target.value)}
            placeholder="Judul modul baru (misal: Modul 1 - HTML)"
            disabled={!selectedMatakuliahId || submittingModul}
            className="h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition min-w-[240px]"
          />
          <button
            type="submit"
            disabled={!selectedMatakuliahId || submittingModul || !newJudulModul.trim()}
            className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md shadow-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            {submittingModul ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Buat Modul</span>
          </button>
        </form>
      </div>

      {/* 2. Modul Selector Tabs */}
      {modulList.length > 0 && (
        <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-2 shrink-0">
            Daftar Modul:
          </span>
          {modulList.map((m) => {
            const isActive = selectedModulId === m.id;
            return (
              <div
                key={m.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition shrink-0 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <button
                  onClick={() => setSelectedModulId(m.id)}
                  className="cursor-pointer"
                >
                  {m.judul_modul}
                </button>
                <button
                  onClick={() => handleDeleteModul(m.id, m.judul_modul)}
                  disabled={deletingModulId === m.id}
                  title="Hapus modul ini"
                  className="text-slate-400 hover:text-red-600 cursor-pointer ml-1"
                >
                  {deletingModulId === m.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Panel Form Rubrik Penilaian */}
      {!selectedModulId ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
          <FolderPlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">Pilih atau Buat Modul Terlebih Dahulu</h3>
          <p className="text-xs text-slate-400 mt-1">
            Rubrik penilaian dikaitkan langsung dengan modul praktikum spesifik.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: Form Input Rubrik */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-600" />
                  Penyusun Rubrik Penilaian
                </h3>
                <p className="text-xs text-slate-500">
                  Untuk: <strong className="text-slate-700">{modulList.find((m) => m.id === selectedModulId)?.judul_modul}</strong>
                </p>
              </div>

              {/* Mode Kriteria Toggle */}
              <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-md border border-slate-300">
                <button
                  type="button"
                  onClick={() => setKriteriaMode('builder')}
                  className={`px-2 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                    kriteriaMode === 'builder'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Builder</span>
                </button>
                <button
                  type="button"
                  onClick={() => setKriteriaMode('json')}
                  className={`px-2 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                    kriteriaMode === 'json'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Code className="w-3 h-3" />
                  <span>JSON Raw</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddRubrik} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Judul Tugas / Praktikum
                </label>
                <input
                  type="text"
                  value={judulTugas}
                  onChange={(e) => setJudulTugas(e.target.value)}
                  placeholder="Contoh: Tugas 1: Layouting CSS Grid & Flexbox"
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                  disabled={submittingRubrik}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Instruksi Soal / Spesifikasi Kode
                </label>
                <textarea
                  rows={4}
                  value={instruksiSoal}
                  onChange={(e) => setInstruksiSoal(e.target.value)}
                  placeholder="Tuliskan petunjuk soal atau spesifikasi teknis yang harus dipenuhi mahasiswa..."
                  className="w-full p-3 text-sm font-mono bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition resize-y"
                  disabled={submittingRubrik}
                />
              </div>

              {/* Kriteria Penilaian */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Kriteria & Bobot Penilaian
                  </label>
                  <span
                    className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
                      totalBobot === 100
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    Total Bobot: {totalBobot}%
                  </span>
                </div>

                {kriteriaMode === 'builder' ? (
                  <div className="space-y-2 border border-slate-200 rounded-md p-3 bg-slate-50/50">
                    {kriteriaItems.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded border border-slate-200">
                        <div className="flex-1 space-y-1.5">
                          <input
                            type="text"
                            value={item.aspek}
                            onChange={(e) => handleUpdateKriteriaRow(idx, 'aspek', e.target.value)}
                            placeholder="Aspek Penilaian (misal: Logika Algoritma)"
                            className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-emerald-600"
                          />
                          <input
                            type="text"
                            value={item.deskripsi || ''}
                            onChange={(e) => handleUpdateKriteriaRow(idx, 'deskripsi', e.target.value)}
                            placeholder="Keterangan singkat / indikator nilai..."
                            className="w-full h-7 px-2 text-[11px] bg-slate-50 border border-slate-200 rounded text-slate-600 focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                        <div className="w-20 shrink-0">
                          <div className="flex items-center border border-slate-300 rounded bg-white h-8 px-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={item.bobot}
                              onChange={(e) => handleUpdateKriteriaRow(idx, 'bobot', Number(e.target.value))}
                              className="w-full text-xs font-mono text-center outline-none"
                            />
                            <span className="text-xs text-slate-400">%</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveKriteriaRow(idx)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded cursor-pointer shrink-0"
                          title="Hapus baris kriteria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddKriteriaRow}
                      className="w-full py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 border border-dashed border-emerald-300 rounded font-medium flex items-center justify-center gap-1 cursor-pointer transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Aspek Kriteria</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={6}
                      value={kriteriaJsonText}
                      onChange={(e) => handleJsonChange(e.target.value)}
                      className="w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-md border border-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Format JSON harus berupa array objek dengan properti <code>aspek</code>, <code>bobot</code>, dan <code>deskripsi</code>.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submittingRubrik || !judulTugas.trim()}
                className="w-full h-10 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submittingRubrik ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Simpan Rubrik Tugas</span>
              </button>
            </form>
          </div>

          {/* Kolom Kanan: Daftar Rubrik Tersimpan */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Rubrik Tugas Tersimpan ({rubrikList.length})
                  </h3>
                </div>
              </div>

              {loadingRubrik ? (
                <div className="py-8 text-center text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span className="text-xs">Memuat daftar rubrik...</span>
                </div>
              ) : rubrikList.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-slate-600">Belum ada rubrik untuk modul ini</p>
                  <p className="text-[11px] text-slate-400">Isi formulir di sebelah kiri untuk menyusun rubrik tugas pertama</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rubrikList.map((rubrik) => {
                    const kriteriaArray = Array.isArray(rubrik.kriteria_penilaian)
                      ? rubrik.kriteria_penilaian
                      : [];

                    return (
                      <div
                        key={rubrik.id}
                        className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-md hover:border-slate-300 transition"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <h4 className="text-xs font-semibold text-slate-900 leading-snug">
                              {rubrik.judul_tugas}
                            </h4>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Modul: {rubrik.judul_modul || 'Modul ' + rubrik.modul_id}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteRubrik(rubrik.id, rubrik.judul_tugas)}
                            disabled={deletingRubrikId === rubrik.id}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                            title="Hapus rubrik ini"
                          >
                            {deletingRubrikId === rubrik.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {rubrik.instruksi_soal && (
                          <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200/80 mb-2 line-clamp-2 font-mono">
                            {rubrik.instruksi_soal}
                          </p>
                        )}

                        {/* Ringkasan Kriteria */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            Komponen Penilaian:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {kriteriaArray.map((item, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono"
                              >
                                <span>{item.aspek}</span>
                                <strong className="text-emerald-700">{item.bobot}%</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

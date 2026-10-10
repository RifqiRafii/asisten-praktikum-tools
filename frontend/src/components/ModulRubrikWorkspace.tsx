import { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  BookOpen, 
  Layers, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  FileCode, 
  FileJson, 
  Save, 
  Wand2, 
  PenTool,
  FolderPlus
} from 'lucide-react';
import type { MataKuliah, Modul, Rubrik, KriteriaItem } from '../types';
import { api } from '../services/api';

interface ModulRubrikWorkspaceProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

const DEFAULT_KRITERIA: KriteriaItem[] = [
  {
    aspek: 'Kesesuaian Spesifikasi & Fungsionalitas',
    bobot: 40,
    deskripsi: 'Fitur utama berjalan sesuai instruksi soal',
    opsi: [
      { label: 'a', tingkat: 'Sesuai seluruh instruksi & ketentuan', skor_persen: 100 },
      { label: 'b', tingkat: 'Hanya sebagian yang benar / kurang lengkap', skor_persen: 50 },
      { label: 'c', tingkat: 'Tidak ada yang benar / tidak dibuat', skor_persen: 0 }
    ]
  },
  {
    aspek: 'Kualitas Kode & Best Practices',
    bobot: 30,
    deskripsi: 'Struktur kode rapi, indentasi konsisten, penamaan variabel jelas',
    opsi: [
      { label: 'a', tingkat: 'Sangat rapi, bersih, dan modular', skor_persen: 100 },
      { label: 'b', tingkat: 'Cukup rapi namun ada pengulangan atau indentasi acak', skor_persen: 50 },
      { label: 'c', tingkat: 'Struktur berantakan dan sulit dibaca', skor_persen: 0 }
    ]
  },
  {
    aspek: 'Kreativitas & Validasi Input',
    bobot: 20,
    deskripsi: 'Penanganan edge cases dan penyajian antarmuka',
    opsi: [
      { label: 'a', tingkat: 'Validasi lengkap dan tampilan intuitif', skor_persen: 100 },
      { label: 'b', tingkat: 'Hanya validasi dasar', skor_persen: 50 },
      { label: 'c', tingkat: 'Tidak ada validasi / tampilan rusak', skor_persen: 0 }
    ]
  },
  {
    aspek: 'Pemahaman & Wawancara / Demo',
    bobot: 10,
    deskripsi: 'Mampu menjelaskan alur logika kode yang dibuat',
    opsi: [
      { label: 'a', tingkat: 'Mampu menjawab dan menjelaskan logika dengan lancar', skor_persen: 100 },
      { label: 'b', tingkat: 'Ragu-ragu atau hanya memahami sebagian', skor_persen: 50 },
      { label: 'c', tingkat: 'Tidak mampu menjelaskan kode sama sekali', skor_persen: 0 }
    ]
  },
];

export default function ModulRubrikWorkspace({ onNotify }: ModulRubrikWorkspaceProps) {
  // Master Data State
  const [matakuliahList, setMatakuliahList] = useState<MataKuliah[]>([]);
  const [selectedMatakuliahId, setSelectedMatakuliahId] = useState<number | ''>('');
  const [modulList, setModulList] = useState<Modul[]>([]);
  const [selectedModulId, setSelectedModulId] = useState<number | ''>('');
  const [rubrikList, setRubrikList] = useState<Rubrik[]>([]);

  // Sub-Tab Switcher: 'ai' (AI Drafter) vs 'manual' (Manual Builder)
  const [activeMethod, setActiveMethod] = useState<'ai' | 'manual'>('ai');

  // Modal / Inline Tambah Modul Baru
  const [showAddModulInput, setShowAddModulInput] = useState(false);
  const [newJudulModul, setNewJudulModul] = useState('');
  const [submittingModul, setSubmittingModul] = useState(false);
  const [deletingModulId, setDeletingModulId] = useState<number | null>(null);

  // --- STATE 1: AI Rubric Drafter ---
  const [judulTugasAI, setJudulTugasAI] = useState('');
  const [targetTingkat, setTargetTingkat] = useState('Mahasiswa Semester Awal (Dasar)');
  const [fokusKriteria, setFokusKriteria] = useState<string[]>([
    'Kesesuaian Spesifikasi & Fungsionalitas',
    'Kualitas & Kerapian Kode',
    'Penanganan Input & Error Handling',
    'Kreativitas / Nilai Tambah'
  ]);
  const [instruksiKhusus, setInstruksiKhusus] = useState('');
  const [copied, setCopied] = useState(false);
  const [jsonResponseFromAI, setJsonResponseFromAI] = useState('');
  const [savingRubrikFromAI, setSavingRubrikFromAI] = useState(false);

  // --- STATE 2: Manual Builder ---
  const [judulTugasManual, setJudulTugasManual] = useState('');
  const [instruksiSoalManual, setInstruksiSoalManual] = useState('');
  const [kriteriaMode, setKriteriaMode] = useState<'builder' | 'json'>('builder');
  const [kriteriaItems, setKriteriaItems] = useState<KriteriaItem[]>(DEFAULT_KRITERIA);
  const [kriteriaJsonText, setKriteriaJsonText] = useState(JSON.stringify(DEFAULT_KRITERIA, null, 2));
  const [submittingManualRubrik, setSubmittingManualRubrik] = useState(false);

  // Loading States
  const [loadingModul, setLoadingModul] = useState(false);
  const [loadingRubrik, setLoadingRubrik] = useState(false);
  const [deletingRubrikId, setDeletingRubrikId] = useState<number | null>(null);

  // 1. Muat Mata Kuliah saat mount
  useEffect(() => {
    api.getMataKuliah().then((res) => {
      if (res.success && res.data) {
        setMatakuliahList(res.data);
        if (res.data.length > 0) setSelectedMatakuliahId(res.data[0].id);
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
  const fetchRubrik = () => {
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
  };

  useEffect(() => {
    fetchRubrik();
  }, [selectedModulId]);

  const selectedMatakuliah = useMemo(
    () => matakuliahList.find((mk) => mk.id === Number(selectedMatakuliahId)),
    [matakuliahList, selectedMatakuliahId]
  );

  const selectedModul = useMemo(
    () => modulList.find((m) => m.id === Number(selectedModulId)),
    [modulList, selectedModulId]
  );

  // Handler Tambah Modul
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
        setShowAddModulInput(false);
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

  // Handler Hapus Modul
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

  // Toggle fokus aspek kriteria AI
  const toggleFokus = (item: string) => {
    setFokusKriteria((prev) =>
      prev.includes(item) ? prev.filter((f) => f !== item) : [...prev, item]
    );
  };

  // Perumusan Prompt AI
  const generatedPrompt = useMemo(() => {
    const matkulNama = selectedMatakuliah ? selectedMatakuliah.nama : '[Pilih Mata Kuliah]';
    const modulJudul = selectedModul ? selectedModul.judul_modul : '[Pilih Modul]';
    const judulTugasStr = judulTugasAI.trim() || 'Tugas Praktikum Modul Terlampir';

    const fokusStr = fokusKriteria.length > 0
      ? fokusKriteria.map((f, i) => `${i + 1}. ${f}`).join('\n')
      : '1. Fungsionalitas & Kesesuaian Instruksi\n2. Kualitas Kode & Best Practices';

    return `Halo! Saya adalah seorang Asisten Praktikum untuk mata kuliah **${matkulNama}** (${targetTingkat}).
Saya telah melampirkan file dokumen/PDF soal tugas praktikum untuk **${modulJudul}** (Judul Tugas: "${judulTugasStr}").

Tolong pelajari file PDF terlampir dan bantu saya merumuskan **Rubrik Penilaian Objektif (Tingkat Pilihan a, b, c)** yang terperinci dan adil bagi mahasiswa praktikan.

### PANDUAN PENYUSUNAN RUBRIK:
1. Analisis seluruh butir instruksi soal teknis yang terdapat pada dokumen PDF tugas.
2. Prioritaskan pembobotan pada fokus aspek berikut:
${fokusStr}
3. Pastikan total akumulasi seluruh bobot bernilai TEPAT 100%.
${instruksiKhusus.trim() ? `4. Catatan Tambahan: ${instruksiKhusus.trim()}\n` : ''}
### FORMAT KELUARAN YANG DIBUTUHKAN:
Tolong berikan jawaban dalam 2 bagian:

**Bagian 1: Tabel Rubrik Penilaian Lengkap**
Tampilkan tabel dengan kolom: No, Aspek Penilaian, Bobot (%), Indikator Opsi a (100%), Opsi b (50%), Opsi c (0%).

**Bagian 2: Raw JSON String (Untuk saya impor langsung ke sistem penilaian klik-klik)**
Berikan blok kode JSON murni yang berisi array objek dengan opsi tingkat pencapaian (a, b, c):
\`\`\`json
[
  {
    "aspek": "Instruksi 1: Layout Tabel 3x3",
    "bobot": 40,
    "deskripsi": "Ketentuan tabel 3 baris x 3 kolom",
    "opsi": [
      { "label": "a", "tingkat": "Tabel sesuai ketentuan (lengkap 3x3)", "skor_persen": 100 },
      { "label": "b", "tingkat": "Hanya kolom atau baris saja yang benar", "skor_persen": 50 },
      { "label": "c", "tingkat": "Tidak ada yang benar / tidak dibuat", "skor_persen": 0 }
    ]
  },
  {
    "aspek": "Instruksi 2: Styling & CSS",
    "bobot": 30,
    "deskripsi": "Pewarnaan dan kerapian border tabel",
    "opsi": [
      { "label": "a", "tingkat": "Styling lengkap dan rapi", "skor_persen": 100 },
      { "label": "b", "tingkat": "Styling sebagian / kurang konsisten", "skor_persen": 50 },
      { "label": "c", "tingkat": "Tidak ada styling sama sekali", "skor_persen": 0 }
    ]
  }
]
\`\`\``;
  }, [
    selectedMatakuliah,
    selectedModul,
    judulTugasAI,
    targetTingkat,
    fokusKriteria,
    instruksiKhusus,
  ]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    onNotify('success', 'Prompt berhasil disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Handler Simpan JSON dari AI
  const handleSaveJsonFromAI = async () => {
    if (!selectedModulId) {
      onNotify('error', 'Pilih modul praktikum terlebih dahulu');
      return;
    }

    if (!jsonResponseFromAI.trim()) {
      onNotify('error', 'Paste blok JSON hasil dari AI terlebih dahulu');
      return;
    }

    let parsedKriteria: any;
    try {
      let cleanJson = jsonResponseFromAI.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      parsedKriteria = JSON.parse(cleanJson);
    } catch {
      onNotify('error', 'Format JSON dari AI tidak valid. Pastikan hanya meng-copy blok array JSON.');
      return;
    }

    if (!Array.isArray(parsedKriteria) || parsedKriteria.length === 0) {
      onNotify('error', 'JSON harus berupa array daftar kriteria penilaian');
      return;
    }

    setSavingRubrikFromAI(true);
    try {
      const res = await api.addRubrik({
        modul_id: Number(selectedModulId),
        judul_tugas: judulTugasAI.trim() || `Rubrik AI - ${selectedModul?.judul_modul || 'Tugas Praktikum'}`,
        instruksi_soal: `Disusun otomatis via AI Drafter untuk dokumen tugas praktikum.`,
        kriteria_penilaian: parsedKriteria,
      });

      if (res.success && res.data) {
        onNotify('success', `Rubrik "${res.data.judul_tugas}" berhasil diimpor & disimpan!`);
        setJsonResponseFromAI('');
        setRubrikList((prev) => [res.data!, ...prev]);
      } else {
        onNotify('error', res.message || 'Gagal menyimpan rubrik');
      }
    } catch {
      onNotify('error', 'Kesalahan jaringan saat menyimpan rubrik');
    } finally {
      setSavingRubrikFromAI(false);
    }
  };

  // Builder Row Handlers
  const handleAddKriteriaRow = () => {
    const updated = [
      ...kriteriaItems,
      {
        aspek: '',
        bobot: 10,
        deskripsi: '',
        opsi: [
          { label: 'a', tingkat: 'Sesuai ketentuan', skor_persen: 100 },
          { label: 'b', tingkat: 'Sebagian benar', skor_persen: 50 },
          { label: 'c', tingkat: 'Tidak sesuai / belum ada', skor_persen: 0 }
        ]
      }
    ];
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
      // Ignore parse error while typing
    }
  };

  const totalBobotManual = kriteriaItems.reduce((acc, curr) => acc + (Number(curr.bobot) || 0), 0);

  // Handler Simpan Rubrik Manual
  const handleAddManualRubrik = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModulId) {
      onNotify('error', 'Pilih atau buat modul terlebih dahulu');
      return;
    }
    if (!judulTugasManual.trim()) {
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

    setSubmittingManualRubrik(true);
    try {
      const res = await api.addRubrik({
        modul_id: Number(selectedModulId),
        judul_tugas: judulTugasManual.trim(),
        instruksi_soal: instruksiSoalManual.trim(),
        kriteria_penilaian: finalKriteria,
      });

      if (res.success && res.data) {
        setRubrikList((prev) => [res.data!, ...prev]);
        setJudulTugasManual('');
        setInstruksiSoalManual('');
        onNotify('success', `Rubrik "${res.data.judul_tugas}" berhasil disimpan`);
      } else {
        onNotify('error', res.message || 'Gagal menyimpan rubrik');
      }
    } catch {
      onNotify('error', 'Kesalahan jaringan saat menyimpan rubrik');
    } finally {
      setSubmittingManualRubrik(false);
    }
  };

  // Handler Hapus Rubrik
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
      {/* 1. Bar Pemilihan Konteks (Mata Kuliah & Modul) + Tambah Modul Cepat */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 max-w-2xl">
          {/* Pilih Mata Kuliah */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-slate-400" />
              Mata Kuliah
            </label>
            <select
              value={selectedMatakuliahId}
              onChange={(e) => setSelectedMatakuliahId(Number(e.target.value))}
              className="w-full h-9 px-2.5 text-xs font-medium bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
            >
              {matakuliahList.map((mk) => (
                <option key={mk.id} value={mk.id}>
                  {mk.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Pilih Modul */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-400" />
                Modul Praktikum
              </label>
              <button
                type="button"
                onClick={() => setShowAddModulInput(!showAddModulInput)}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{showAddModulInput ? 'Batal' : '+ Tambah Modul'}</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={selectedModulId}
                onChange={(e) => setSelectedModulId(Number(e.target.value))}
                disabled={loadingModul || modulList.length === 0}
                className="w-full h-9 px-2.5 text-xs font-medium bg-white border border-slate-300 rounded-md text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
              >
                {loadingModul ? (
                  <option value="">Memuat modul...</option>
                ) : modulList.length === 0 ? (
                  <option value="">Belum ada modul</option>
                ) : (
                  modulList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.judul_modul}
                    </option>
                  ))
                )}
              </select>
              {selectedModul && (
                <button
                  type="button"
                  onClick={() => handleDeleteModul(selectedModul.id, selectedModul.judul_modul)}
                  disabled={deletingModulId === selectedModul.id}
                  className="h-9 px-2.5 text-slate-400 hover:text-red-600 bg-white border border-slate-300 rounded-md hover:bg-red-50 transition cursor-pointer shrink-0"
                  title="Hapus modul ini"
                >
                  {deletingModulId === selectedModul.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info Rubrik Tersimpan */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg self-start md:self-auto shrink-0">
          <FileCode className="w-4 h-4 text-emerald-600" />
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">
              Rubrik di Modul Ini
            </span>
            <span className="text-xs font-mono font-bold text-slate-900">
              {rubrikList.length} Rubrik Tersimpan
            </span>
          </div>
        </div>
      </div>

      {/* Form Tambah Modul Cepat (Inline Collapsible) */}
      {showAddModulInput && (
        <form
          onSubmit={handleAddModul}
          className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
              Judul Modul Baru:
            </label>
            <input
              type="text"
              value={newJudulModul}
              onChange={(e) => setNewJudulModul(e.target.value)}
              placeholder="Contoh: Modul 2 - Form Handling & Validasi PHP"
              className="w-full h-8 px-3 text-xs bg-white border border-emerald-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <button
            type="submit"
            disabled={submittingModul || !newJudulModul.trim()}
            className="h-8 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-end sm:self-auto"
          >
            {submittingModul ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
            <span>Buat Modul</span>
          </button>
        </form>
      )}

      {/* 2. Switcher Metode Pembuatan Rubrik: AI Drafter vs Manual */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Metode Penyusunan Rubrik:
          </span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveMethod('ai')}
              className={`px-3 py-1 text-xs font-semibold rounded transition cursor-pointer flex items-center gap-1.5 ${
                activeMethod === 'ai'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Rubric Drafter (Rekomendasi dari PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMethod('manual')}
              className={`px-3 py-1 text-xs font-semibold rounded transition cursor-pointer flex items-center gap-1.5 ${
                activeMethod === 'manual'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-emerald-600" />
              <span>Susun Manual / JSON Editor</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Dua Kolom (Kiri: Generator/Builder, Kanan: Rubrik Tersimpan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Form Pembuatan Rubrik (Bisa AI atau Manual) */}
        <div className="lg:col-span-7 space-y-4">
          {activeMethod === 'ai' ? (
            /* --- SUB-VIEW AI RUBRIC DRAFTER --- */
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900">
                    Generator Prompt AI (Kirim bersama PDF Tugas)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className={`h-7 px-3 text-xs font-semibold rounded-md shadow-xs transition flex items-center gap-1 cursor-pointer ${
                    copied
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white'
                  }`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Prompt'}</span>
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Judul Tugas & Target Tingkat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Judul Tugas Praktikum:
                    </label>
                    <input
                      type="text"
                      value={judulTugasAI}
                      onChange={(e) => setJudulTugasAI(e.target.value)}
                      placeholder="Contoh: Tugas 1: Layout CSS & Tabel 3x3"
                      className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Target Tingkat Praktikan:
                    </label>
                    <select
                      value={targetTingkat}
                      onChange={(e) => setTargetTingkat(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="Mahasiswa Semester Awal (Dasar)">Semester Awal (Dasar)</option>
                      <option value="Mahasiswa Menengah">Mahasiswa Menengah</option>
                      <option value="Mahasiswa Tingkat Lanjut">Tingkat Lanjut</option>
                    </select>
                  </div>
                </div>

                {/* Pilihan Fokus Aspek */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                    Fokus Aspek Penilaian:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Kesesuaian Spesifikasi & Fungsionalitas',
                      'Kualitas & Kerapian Kode',
                      'Penanganan Input & Error Handling',
                      'Kreativitas / Nilai Tambah',
                      'Dokumentasi & Komentar Kode',
                      'Pemahaman Konsep / Wawancara'
                    ].map((aspek) => {
                      const isSelected = fokusKriteria.includes(aspek);
                      return (
                        <button
                          key={aspek}
                          type="button"
                          onClick={() => toggleFokus(aspek)}
                          className={`px-2 py-0.5 rounded text-[11px] transition cursor-pointer border ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected && '✓ '}
                          {aspek}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Catatan / Instruksi Khusus */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Instruksi Khusus untuk AI (Opsional):
                  </label>
                  <input
                    type="text"
                    value={instruksiKhusus}
                    onChange={(e) => setInstruksiKhusus(e.target.value)}
                    placeholder="Contoh: Tekankan pada penanganan error dan validasi form..."
                    className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Box Prompt Siap Kirim */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Isi Prompt yang Dihasilkan:
                  </span>
                  <pre className="w-full p-3 text-[11px] font-mono bg-slate-900 text-slate-100 rounded-md border border-slate-700 overflow-auto whitespace-pre-wrap leading-relaxed max-h-48">
                    {generatedPrompt}
                  </pre>
                  <p className="text-[10px] text-slate-500 mt-1">
                    💡 Upload file PDF tugas ke ChatGPT/Claude bersama prompt di atas.
                  </p>
                </div>

                {/* Impor Balik JSON dari AI */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <FileJson className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Impor Hasil JSON dari AI ke Database:</span>
                    </label>
                  </div>
                  <textarea
                    rows={5}
                    value={jsonResponseFromAI}
                    onChange={(e) => setJsonResponseFromAI(e.target.value)}
                    placeholder='Paste blok JSON hasil dari ChatGPT/Claude di sini...&#10;[&#10;  {&#10;    "aspek": "Layout Tabel 3x3",&#10;    "bobot": 40,&#10;    "opsi": [&#10;      { "label": "a", "tingkat": "Tabel sesuai ketentuan 3x3", "skor_persen": 100 },&#10;      { "label": "b", "tingkat": "Hanya kolom/baris saja", "skor_persen": 50 },&#10;      { "label": "c", "tingkat": "Tidak ada yang benar", "skor_persen": 0 }&#10;    ]&#10;  }&#10;]'
                    className="w-full p-2.5 text-xs font-mono bg-slate-50 text-slate-900 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />

                  <button
                    type="button"
                    onClick={handleSaveJsonFromAI}
                    disabled={savingRubrikFromAI || !jsonResponseFromAI.trim() || !selectedModulId}
                    className="w-full h-9 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {savingRubrikFromAI ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Simpan Hasil AI ke Rubrik Modul Ini</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* --- SUB-VIEW MANUAL BUILDER --- */
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900">
                    Susun Rubrik Manual
                  </h3>
                </div>

                <div className="flex items-center gap-1 bg-white p-0.5 border border-slate-200 rounded">
                  <button
                    type="button"
                    onClick={() => setKriteriaMode('builder')}
                    className={`px-2 py-0.5 text-[11px] rounded transition cursor-pointer ${
                      kriteriaMode === 'builder'
                        ? 'bg-slate-900 text-white font-medium'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Visual Builder
                  </button>
                  <button
                    type="button"
                    onClick={() => setKriteriaMode('json')}
                    className={`px-2 py-0.5 text-[11px] rounded transition cursor-pointer ${
                      kriteriaMode === 'json'
                        ? 'bg-slate-900 text-white font-medium'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    JSON Raw
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddManualRubrik} className="p-4 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Judul Tugas Praktikum:
                  </label>
                  <input
                    type="text"
                    value={judulTugasManual}
                    onChange={(e) => setJudulTugasManual(e.target.value)}
                    placeholder="Contoh: Tugas 1: Layout Tabel dan Styling"
                    className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Instruksi Soal Singkat:
                  </label>
                  <input
                    type="text"
                    value={instruksiSoalManual}
                    onChange={(e) => setInstruksiSoalManual(e.target.value)}
                    placeholder="Contoh: Buatlah layout tabel 3 baris x 3 kolom dengan warna zebra..."
                    className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Komponen Kriteria */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Komponen Aspek & Bobot:
                    </label>
                    <span className={`text-[11px] font-mono font-bold ${
                      totalBobotManual === 100 ? 'text-emerald-700' : 'text-amber-600'
                    }`}>
                      Total: {totalBobotManual}% {totalBobotManual === 100 ? '✓' : '(Target 100%)'}
                    </span>
                  </div>

                  {kriteriaMode === 'builder' ? (
                    <div className="space-y-2">
                      {kriteriaItems.map((item, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Nama aspek kriteria..."
                            value={item.aspek}
                            onChange={(e) => handleUpdateKriteriaRow(idx, 'aspek', e.target.value)}
                            className="flex-1 h-7 px-2 text-xs bg-white border border-slate-300 rounded"
                          />
                          <div className="w-16 flex items-center bg-white border border-slate-300 rounded px-1.5 h-7">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.bobot}
                              onChange={(e) => handleUpdateKriteriaRow(idx, 'bobot', Number(e.target.value))}
                              className="w-full text-xs font-mono text-center outline-none"
                            />
                            <span className="text-[10px] text-slate-400">%</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveKriteriaRow(idx)}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddKriteriaRow}
                        className="w-full py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 border border-dashed border-emerald-300 rounded font-medium flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Aspek Kriteria</span>
                      </button>
                    </div>
                  ) : (
                    <textarea
                      rows={8}
                      value={kriteriaJsonText}
                      onChange={(e) => handleJsonChange(e.target.value)}
                      className="w-full p-2.5 font-mono text-xs bg-slate-900 text-slate-100 rounded-md border border-slate-700"
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingManualRubrik || !judulTugasManual.trim()}
                  className="w-full h-9 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submittingManualRubrik ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan Rubrik Tugas</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Daftar Seluruh Rubrik Tersimpan di Modul Ini */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900">
                  Rubrik Tersimpan ({rubrikList.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {selectedModul?.judul_modul || 'Modul Aktif'}
              </span>
            </div>

            {loadingRubrik ? (
              <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span className="text-xs">Memuat daftar rubrik...</span>
              </div>
            ) : rubrikList.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-700">Belum Ada Rubrik di Modul Ini</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Gunakan form AI Drafter di sebelah kiri atau susun manual untuk membuat rubrik baru.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {rubrikList.map((rubrik) => {
                  const kriteriaArray = Array.isArray(rubrik.kriteria_penilaian)
                    ? rubrik.kriteria_penilaian
                    : [];

                  return (
                    <div
                      key={rubrik.id}
                      className="p-3 bg-slate-50/80 border border-slate-200 rounded-lg hover:border-slate-300 transition"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {rubrik.judul_tugas}
                          </h4>
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {rubrik.judul_modul || selectedModul?.judul_modul}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteRubrik(rubrik.id, rubrik.judul_tugas)}
                          disabled={deletingRubrikId === rubrik.id}
                          className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
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
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200/80 mb-2 font-mono line-clamp-2">
                          {rubrik.instruksi_soal}
                        </p>
                      )}

                      {/* Komponen Aspek & Opsi Bertingkat */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Komponen Kriteria Penilaian:
                        </span>
                        <div className="space-y-1">
                          {kriteriaArray.map((item, i) => (
                            <div
                              key={i}
                              className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-1.5 rounded font-mono"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900">{item.aspek}</span>
                                <strong className="text-emerald-700 font-bold">{item.bobot}%</strong>
                              </div>
                              {item.opsi && Array.isArray(item.opsi) && item.opsi.length > 0 && (
                                <div className="mt-1 pt-1 border-t border-slate-100 flex flex-wrap gap-1 text-[9px] text-slate-500">
                                  {item.opsi.map((o) => (
                                    <span key={o.label} className="bg-slate-50 px-1 py-0.2 rounded border border-slate-200">
                                      <strong>{o.label.toUpperCase()}</strong>: {o.skor_persen}%
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
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
    </div>
  );
}

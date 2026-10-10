import { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  BookOpen, 
  Layers, 
  FileUp, 
  SlidersHorizontal, 
  ArrowRight, 
  FileJson, 
  Save, 
  Loader2 
} from 'lucide-react';
import type { MataKuliah, Modul, KriteriaItem } from '../types';
import { api } from '../services/api';

interface PromptGeneratorProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export default function PromptGenerator({ onNotify }: PromptGeneratorProps) {
  // Master Data Options
  const [matakuliahList, setMatakuliahList] = useState<MataKuliah[]>([]);
  const [modulList, setModulList] = useState<Modul[]>([]);

  // Form State
  const [selectedMatakuliahId, setSelectedMatakuliahId] = useState<number | ''>('');
  const [selectedModulId, setSelectedModulId] = useState<number | ''>('');
  const [judulTugas, setJudulTugas] = useState('');
  const [targetTingkat, setTargetTingkat] = useState('Mahasiswa Semester Awal (Dasar)');
  
  // Preferensi Fokus Kriteria (Multi-select)
  const [fokusKriteria, setFokusKriteria] = useState<string[]>([
    'Kesesuaian Spesifikasi & Fungsionalitas',
    'Kualitas & Kerapian Kode',
    'Penanganan Input & Error Handling',
    'Kreativitas / Nilai Tambah'
  ]);

  const [instruksiKhusus, setInstruksiKhusus] = useState('');
  const [copied, setCopied] = useState(false);

  // Bagian Import JSON Hasil dari AI
  const [jsonResponseFromAI, setJsonResponseFromAI] = useState('');
  const [savingRubrikFromAI, setSavingRubrikFromAI] = useState(false);

  // 1. Muat Mata Kuliah saat mount
  useEffect(() => {
    api.getMataKuliah().then((res) => {
      if (res.success && res.data) {
        setMatakuliahList(res.data);
        if (res.data.length > 0) setSelectedMatakuliahId(res.data[0].id);
      }
    });
  }, []);

  // 2. Muat Modul saat Mata Kuliah berubah
  useEffect(() => {
    if (!selectedMatakuliahId) {
      setModulList([]);
      setSelectedModulId('');
      return;
    }

    api.getModul(Number(selectedMatakuliahId)).then((res) => {
      if (res.success && res.data) {
        setModulList(res.data);
        if (res.data.length > 0) {
          setSelectedModulId(res.data[0].id);
        } else {
          setSelectedModulId('');
        }
      }
    });
  }, [selectedMatakuliahId]);

  const selectedMatakuliah = useMemo(
    () => matakuliahList.find((mk) => mk.id === Number(selectedMatakuliahId)),
    [matakuliahList, selectedMatakuliahId]
  );

  const selectedModul = useMemo(
    () => modulList.find((m) => m.id === Number(selectedModulId)),
    [modulList, selectedModulId]
  );

  // Toggle pilihan fokus kriteria
  const toggleFokus = (item: string) => {
    setFokusKriteria((prev) =>
      prev.includes(item) ? prev.filter((f) => f !== item) : [...prev, item]
    );
  };

  // Perangkai Prompt Khusus untuk Disertakan Bersama PDF Tugas ke AI
  const generatedPrompt = useMemo(() => {
    const matkulNama = selectedMatakuliah ? selectedMatakuliah.nama : '[Pilih Mata Kuliah]';
    const modulJudul = selectedModul ? selectedModul.judul_modul : '[Pilih Modul]';
    const judulTugasStr = judulTugas.trim() || 'Tugas Praktikum Modul Terlampir';

    const fokusStr = fokusKriteria.length > 0
      ? fokusKriteria.map((f, i) => `${i + 1}. ${f}`).join('\n')
      : '1. Fungsionalitas & Kesesuaian Instruksi\n2. Kualitas Kode & Best Practices';

    return `Halo! Saya adalah seorang Asisten Praktikum untuk mata kuliah **${matkulNama}** (${targetTingkat}).
Saya telah melampirkan file dokumen/PDF soal tugas praktikum untuk **${modulJudul}** (Judul Tugas: "${judulTugasStr}").

Tolong pelajari file PDF terlampir dan bantu saya merumuskan **Rubrik Penilaian Objektif** yang terperinci dan adil bagi mahasiswa praktikan.

### PANDUAN PENYUSUNAN RUBRIK:
1. Analisis seluruh poin spesifikasi soal dan tantangan teknis yang terdapat pada dokumen PDF tugas.
2. Prioritaskan pembobotan pada fokus aspek berikut:
${fokusStr}
3. Pastikan total akumulasi seluruh bobot persentase bernilai TEPAT 100%.
${instruksiKhusus.trim() ? `4. Catatan Tambahan: ${instruksiKhusus.trim()}\n` : ''}
### FORMAT KELUARAN YANG SAYA BUTUHKAN:
Tolong berikan jawaban dalam 2 bagian:

**Bagian 1: Tabel Rubrik Penilaian Lengkap**
Tampilkan tabel dengan kolom:
- No
- Aspek Penilaian
- Bobot (%)
- Indikator Nilai Maksimal
- Kriteria Pengurangan Nilai / Catatan Asisten

**Bagian 2: Raw JSON String (Untuk saya impor langsung ke sistem penilaian klik-klik)**
Berikan blok kode JSON murni yang berisi array objek dengan opsi tingkat penilaian (a, b, c):
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
    "deskripsi": "Pewarnaan dan kerapian border",
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
    judulTugas,
    targetTingkat,
    fokusKriteria,
    instruksiKhusus,
  ]);

  // Fungsi Salin Prompt ke Clipboard
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      onNotify('success', 'Prompt perumusan rubrik berhasil disalin! Silakan kirim bersama PDF tugas ke ChatGPT / Claude.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onNotify('error', 'Gagal menyalin ke clipboard. Silakan salin manual.');
    }
  };

  // Fungsi Simpan Hasil JSON dari AI langsung ke Database Modul
  const handleSaveJsonFromAI = async () => {
    if (!selectedModulId) {
      onNotify('error', 'Pilih modul praktikum terlebih dahulu');
      return;
    }

    if (!jsonResponseFromAI.trim()) {
      onNotify('error', 'Tempelkan blok JSON hasil dari AI terlebih dahulu');
      return;
    }

    // Ekstrak JSON jika pengguna mem-paste bersama markdown backticks ```json ... ```
    let cleanJson = jsonResponseFromAI.trim();
    if (cleanJson.includes('```json')) {
      cleanJson = cleanJson.split('```json')[1].split('```')[0].trim();
    } else if (cleanJson.includes('```')) {
      cleanJson = cleanJson.split('```')[1].split('```')[0].trim();
    }

    let parsedKriteria: KriteriaItem[] = [];
    try {
      parsedKriteria = JSON.parse(cleanJson);
      if (!Array.isArray(parsedKriteria) || parsedKriteria.length === 0) {
        throw new Error('JSON harus berupa array kriteria.');
      }
    } catch (err: any) {
      onNotify('error', `Format JSON tidak valid: ${err.message || 'Periksa kembali JSON dari AI'}`);
      return;
    }

    setSavingRubrikFromAI(true);
    try {
      const tugasName = judulTugas.trim() || `Rubrik Hasil AI - ${selectedModul?.judul_modul || 'Modul'}`;
      const res = await api.addRubrik({
        modul_id: Number(selectedModulId),
        judul_tugas: tugasName,
        instruksi_soal: `Rubrik dirumuskan berdasarkan dokumen tugas PDF untuk ${selectedModul?.judul_modul || 'modul ini'}.`,
        kriteria_penilaian: parsedKriteria,
      });

      if (res.success) {
        onNotify('success', `Rubrik "${tugasName}" dari AI berhasil disimpan ke database modul!`);
        setJsonResponseFromAI('');
      } else {
        onNotify('error', res.message || 'Gagal menyimpan rubrik ke database');
      }
    } catch {
      onNotify('error', 'Terjadi kesalahan jaringan saat menyimpan rubrik');
    } finally {
      setSavingRubrikFromAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Petunjuk Alur Kerja Singkat */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <FileUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-emerald-950 uppercase tracking-wider">
              Alur Kerja Prompt Rubrik Penilaian
            </h3>
            <p className="text-xs text-emerald-800">
              1. Salin prompt di bawah &rarr; 2. Kirim bersama <strong>file PDF tugas</strong> ke ChatGPT/Claude &rarr; 3. AI akan merumuskan rubrik &rarr; 4. Tempel JSON hasilnya ke aplikasi.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Form Parameter Tugas & Modul */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Parameter Modul & Tugas Praktikum
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
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
              {matakuliahList.length === 0 ? (
                <option value="">Belum ada mata kuliah</option>
              ) : (
                matakuliahList.map((mk) => (
                  <option key={mk.id} value={mk.id}>
                    {mk.nama}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Pilih Modul */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-400" />
              Modul Terkait
            </label>
            <select
              value={selectedModulId}
              onChange={(e) => setSelectedModulId(Number(e.target.value))}
              disabled={modulList.length === 0}
              className="w-full h-9 px-2.5 text-xs font-medium bg-white border border-slate-300 rounded-md text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
            >
              {modulList.length === 0 ? (
                <option value="">Belum ada modul (Buat di Tab Rubrik Modul)</option>
              ) : (
                modulList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.judul_modul}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Judul Tugas */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Judul Tugas / Praktikum
            </label>
            <input
              type="text"
              value={judulTugas}
              onChange={(e) => setJudulTugas(e.target.value)}
              placeholder="Contoh: Tugas 1: Layouting CSS Flexbox"
              className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
            />
          </div>
        </div>

        {/* Target Tingkat Mahasiswa */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Tingkat / Target Mahasiswa
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              'Mahasiswa Semester Awal (Dasar)',
              'Mahasiswa Menengah (Intermediate)',
              'Tingkat Lanjut (Advanced & Arsitektur)'
            ].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setTargetTingkat(level)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer border ${
                  targetTingkat === level
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Pilihan Fokus Kriteria Penilaian */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
            Fokus Aspek Penilaian yang Diinginkan
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              'Kesesuaian Spesifikasi & Fungsionalitas',
              'Kualitas & Kerapian Kode',
              'Penanganan Input & Error Handling',
              'Kreativitas / Nilai Tambah',
              'Optimasi & Performa',
              'Dokumentasi & Komentar Kode',
              'Pemahaman Konsep / Wawancara'
            ].map((aspek) => {
              const isSelected = fokusKriteria.includes(aspek);
              return (
                <button
                  key={aspek}
                  type="button"
                  onClick={() => toggleFokus(aspek)}
                  className={`px-2.5 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[10px] ${
                    isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                  }`}>
                    {isSelected && '✓'}
                  </span>
                  <span>{aspek}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Catatan Khusus */}
        <div className="mt-3">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Instruksi Khusus untuk AI (Opsional)
          </label>
          <input
            type="text"
            value={instruksiKhusus}
            onChange={(e) => setInstruksiKhusus(e.target.value)}
            placeholder="Contoh: Berikan perhatian khusus pada validasi form dan respon pesan error"
            className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* 3. Panel Dua Kolom: Prompt Hasil & Impor Balik JSON ke Database */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Prompt Hasil yang Siap Dikirim ke LLM */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-900">
                Prompt Perumus Rubrik (Kirim bersama PDF ke AI)
              </span>
            </div>

            <button
              onClick={handleCopyPrompt}
              className={`h-8 px-3.5 text-xs font-semibold rounded-md shadow-xs transition flex items-center gap-1.5 cursor-pointer ${
                copied
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Prompt'}</span>
            </button>
          </div>

          <div className="p-3.5 flex-1 flex flex-col">
            <pre className="w-full flex-1 p-3.5 text-xs font-mono bg-slate-900 text-slate-100 rounded-md border border-slate-700 overflow-auto whitespace-pre-wrap leading-relaxed max-h-[420px]">
              {generatedPrompt}
            </pre>
            <p className="text-[11px] text-slate-500 mt-2">
              💡 <strong>Langkah Anda:</strong> Buka ChatGPT atau Claude, upload file PDF soal tugas Anda, lalu paste prompt di atas ke chat.
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Impor Hasil JSON dari AI ke Modul */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-900">
                Impor Hasil JSON dari AI ke Database
              </span>
            </div>
          </div>

          <div className="p-3.5 flex-1 flex flex-col space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Setelah AI merespons di ChatGPT/Claude, copy blok <strong>JSON Raw</strong> yang dihasilkan AI, lalu paste di sini untuk langsung menyimpannya sebagai rubrik modul:
            </p>

            <textarea
              rows={9}
              value={jsonResponseFromAI}
              onChange={(e) => setJsonResponseFromAI(e.target.value)}
              placeholder='[&#10;  {&#10;    "aspek": "Layout Tabel 3x3",&#10;    "bobot": 40,&#10;    "opsi": [&#10;      { "label": "a", "tingkat": "Tabel sesuai ketentuan 3x3", "skor_persen": 100 },&#10;      { "label": "b", "tingkat": "Hanya kolom/baris saja yang benar", "skor_persen": 50 },&#10;      { "label": "c", "tingkat": "Tidak ada yang benar", "skor_persen": 0 }&#10;    ]&#10;  }&#10;]'
              className="w-full flex-1 p-3 text-xs font-mono bg-slate-50 text-slate-900 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 resize-y"
            />

            <button
              onClick={handleSaveJsonFromAI}
              disabled={savingRubrikFromAI || !jsonResponseFromAI.trim() || !selectedModulId}
              className="w-full h-10 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {savingRubrikFromAI ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Simpan Hasil AI ke Rubrik Modul Ini</span>
            </button>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200 flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Rubrik yang disimpan di sini akan otomatis muncul di <strong>Tab Rubrik Modul</strong>.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

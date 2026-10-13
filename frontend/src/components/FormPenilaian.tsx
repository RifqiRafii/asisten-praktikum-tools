import { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  User, 
  BookOpen, 
  Layers, 
  School, 
  ChevronRight, 
  Trash2, 
  Loader2, 
  AlertCircle,
  FileText,
  Calculator,
  RotateCcw,
  Save
} from 'lucide-react';
import type { MataKuliah, Kelas, Praktikan, Modul, Rubrik, Penilaian, KriteriaItem, OpsiKriteria } from '../types';
import { api } from '../services/api';

interface FormPenilaianProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export default function FormPenilaian({ onNotify }: FormPenilaianProps) {
  // Master Data State
  const [matakuliahList, setMatakuliahList] = useState<MataKuliah[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [modulList, setModulList] = useState<Modul[]>([]);
  const [rubrikList, setRubrikList] = useState<Rubrik[]>([]);
  const [praktikanList, setPraktikanList] = useState<Praktikan[]>([]);
  const [penilaianList, setPenilaianList] = useState<Penilaian[]>([]);

  // Selection Filter State
  const [selectedMatakuliahId, setSelectedMatakuliahId] = useState<number | ''>('');
  const [selectedKelasId, setSelectedKelasId] = useState<number | ''>('');
  const [selectedModulId, setSelectedModulId] = useState<number | ''>('');
  const [activePraktikanId, setActivePraktikanId] = useState<number | null>(null);

  // Rubrik Selections (Pilihan Klik-Klik per Aspek Kriteria)
  // Format: { [criterionIndex: number]: OpsiKriteria }
  const [selectedPilihanPerKriteria, setSelectedPilihanPerKriteria] = useState<{ [key: number]: OpsiKriteria }>({});
  
  // Custom Override & Catatan
  const [nilaiManual, setNilaiManual] = useState<string>('');
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [catatanTambahan, setCatatanTambahan] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 1. Muat Mata Kuliah saat mount
  useEffect(() => {
    api.getMataKuliah().then((res) => {
      if (res.success && res.data) {
        setMatakuliahList(res.data);
        if (res.data.length > 0) setSelectedMatakuliahId(res.data[0].id);
      }
    });
  }, []);

  // 2. Muat Kelas & Modul saat Mata Kuliah berubah
  useEffect(() => {
    if (!selectedMatakuliahId) {
      setKelasList([]);
      setModulList([]);
      setSelectedKelasId('');
      setSelectedModulId('');
      return;
    }

    const mkId = Number(selectedMatakuliahId);
    Promise.all([api.getKelas(mkId), api.getModul(mkId)]).then(([kRes, mRes]) => {
      if (kRes.success && kRes.data) {
        setKelasList(kRes.data);
        if (kRes.data.length > 0) setSelectedKelasId(kRes.data[0].id);
        else setSelectedKelasId('');
      }
      if (mRes.success && mRes.data) {
        setModulList(mRes.data);
        if (mRes.data.length > 0) setSelectedModulId(mRes.data[0].id);
        else setSelectedModulId('');
      }
    });
  }, [selectedMatakuliahId]);

  // 3. Muat Rubrik saat Modul berubah
  useEffect(() => {
    if (!selectedModulId) {
      setRubrikList([]);
      return;
    }

    api.getRubrik(Number(selectedModulId)).then((res) => {
      if (res.success && res.data) {
        setRubrikList(res.data);
      }
    });
  }, [selectedModulId]);

  // 4. Muat Praktikan saat Kelas berubah
  useEffect(() => {
    if (!selectedKelasId) {
      setPraktikanList([]);
      setActivePraktikanId(null);
      return;
    }

    api.getPraktikan(Number(selectedKelasId)).then((res) => {
      if (res.success && res.data) {
        setPraktikanList(res.data);
        if (res.data.length > 0) {
          setActivePraktikanId(res.data[0].id);
        } else {
          setActivePraktikanId(null);
        }
      }
    });
  }, [selectedKelasId]);

  // 5. Muat Penilaian saat Modul atau Kelas berubah
  const fetchPenilaian = () => {
    if (!selectedModulId || !selectedKelasId) {
      setPenilaianList([]);
      return;
    }

    api.getPenilaian({
      modul_id: Number(selectedModulId),
      kelas_id: Number(selectedKelasId),
    }).then((res) => {
      if (res.success && res.data) {
        setPenilaianList(res.data);
      }
    });
  };

  useEffect(() => {
    fetchPenilaian();
  }, [selectedModulId, selectedKelasId]);

  // Daftar Kriteria dari Rubrik Modul Aktif
  const activeKriteriaList = useMemo<KriteriaItem[]>(() => {
    if (rubrikList.length === 0) return [];
    const rubrik = rubrikList[0];
    if (Array.isArray(rubrik.kriteria_penilaian)) {
      return rubrik.kriteria_penilaian;
    }
    return [];
  }, [rubrikList]);

  // Sinkronisasi data form saat activePraktikanId berganti
  useEffect(() => {
    if (!activePraktikanId || !selectedModulId) {
      setSelectedPilihanPerKriteria({});
      setNilaiManual('');
      setCatatanTambahan('');
      setIsManualOverride(false);
      return;
    }

    const existingGrade = penilaianList.find(
      (p) => p.praktikan_id === activePraktikanId && p.modul_id === Number(selectedModulId)
    );

    if (existingGrade) {
      setNilaiManual(String(existingGrade.nilai_angka));
      setCatatanTambahan(existingGrade.catatan_evaluasi || '');
      setIsManualOverride(true);
    } else {
      setSelectedPilihanPerKriteria({});
      setNilaiManual('');
      setCatatanTambahan('');
      setIsManualOverride(false);
    }
  }, [activePraktikanId, selectedModulId, penilaianList]);

  // Helper mendapatkan opsi (a, b, c) untuk setiap aspek kriteria
  const getOptionsForCriterion = (k: KriteriaItem): OpsiKriteria[] => {
    if (k.opsi && Array.isArray(k.opsi) && k.opsi.length > 0) {
      return k.opsi;
    }
    // Default 3 opsi standar jika belum didefinisikan secara khusus
    return [
      {
        label: 'a',
        tingkat: `${k.aspek} sesuai ketentuan & instruksi`,
        skor_persen: 100,
      },
      {
        label: 'b',
        tingkat: 'Hanya sebagian yang benar / kurang lengkap',
        skor_persen: 50,
      },
      {
        label: 'c',
        tingkat: 'Tidak ada yang benar / tidak dibuat',
        skor_persen: 0,
      },
    ];
  };

  // Kalkulasi Skor Otomatis dari Opsi yang Diklik
  const kalkulasiSkor = useMemo(() => {
    if (activeKriteriaList.length === 0) return 0;

    let total = 0;
    activeKriteriaList.forEach((k, idx) => {
      const selectedOption = selectedPilihanPerKriteria[idx];
      if (selectedOption) {
        const poinAspek = (Number(k.bobot) * Number(selectedOption.skor_persen)) / 100;
        total += poinAspek;
      }
    });

    return Math.min(100, Math.max(0, Math.round(total * 100) / 100));
  }, [activeKriteriaList, selectedPilihanPerKriteria]);

  // Nilai Akhir Efektif (Manual Override atau Otomatis dari Pilihan Rubrik)
  const nilaiAkhirEfektif = useMemo(() => {
    if (isManualOverride && nilaiManual !== '') {
      return parseFloat(nilaiManual) || 0;
    }
    return kalkulasiSkor;
  }, [isManualOverride, nilaiManual, kalkulasiSkor]);

  // Rangkum Evaluasi Berdasarkan Pilihan Rubrik yang Diklik
  const evaluasiTerangkum = useMemo(() => {
    if (activeKriteriaList.length === 0) return catatanTambahan;

    const poinCatatan: string[] = [];
    activeKriteriaList.forEach((k, idx) => {
      const selectedOption = selectedPilihanPerKriteria[idx];
      if (selectedOption) {
        const skorDidapat = (Number(k.bobot) * Number(selectedOption.skor_persen)) / 100;
        poinCatatan.push(
          `• ${k.aspek} [${selectedOption.label.toUpperCase()}]: ${selectedOption.tingkat} (${skorDidapat}/${k.bobot} poin)`
        );
      }
    });

    const header = poinCatatan.length > 0
      ? `Hasil Evaluasi Rubrik:\n${poinCatatan.join('\n')}`
      : '';

    if (catatanTambahan.trim()) {
      return header ? `${header}\n\nCatatan Tambahan:\n${catatanTambahan.trim()}` : catatanTambahan.trim();
    }

    return header;
  }, [activeKriteriaList, selectedPilihanPerKriteria, catatanTambahan]);

  // Praktikan & Penilaian yang sedang dipilih
  const currentPraktikan = useMemo(
    () => praktikanList.find((p) => p.id === activePraktikanId),
    [praktikanList, activePraktikanId]
  );

  const currentGrade = useMemo(
    () => penilaianList.find((p) => p.praktikan_id === activePraktikanId && p.modul_id === Number(selectedModulId)),
    [penilaianList, activePraktikanId, selectedModulId]
  );

  // Hitung Mahasiswa yang sudah dinilai
  const totalGraded = useMemo(() => {
    if (!selectedModulId || praktikanList.length === 0) return 0;
    const gradedIds = new Set(penilaianList.map((p) => p.praktikan_id));
    return praktikanList.filter((p) => gradedIds.has(p.id)).length;
  }, [penilaianList, praktikanList, selectedModulId]);

  // Predikat Nilai Huruf
  const predikatHuruf = useMemo(() => {
    const val = nilaiAkhirEfektif;
    if (val >= 85) return 'A (Sangat Baik)';
    if (val >= 75) return 'B (Baik)';
    if (val >= 65) return 'C (Cukup)';
    if (val >= 50) return 'D (Kurang)';
    return 'E (Tidak Lulus)';
  }, [nilaiAkhirEfektif]);

  // Handler Klik Opsi Kriteria
  const handleSelectOption = (idx: number, opt: OpsiKriteria) => {
    setSelectedPilihanPerKriteria((prev) => ({
      ...prev,
      [idx]: opt,
    }));
    setIsManualOverride(false);
  };

  // Simpan Nilai ke Database
  const handleSave = async (autoNext: boolean = false) => {
    if (!activePraktikanId) {
      onNotify('error', 'Pilih praktikan yang akan dinilai');
      return;
    }
    if (!selectedModulId) {
      onNotify('error', 'Pilih modul praktikum terlebih dahulu');
      return;
    }

    const finalScore = nilaiAkhirEfektif;

    setSubmitting(true);
    try {
      const res = await api.savePenilaian({
        praktikan_id: activePraktikanId,
        modul_id: Number(selectedModulId),
        nilai_angka: finalScore,
        catatan_evaluasi: evaluasiTerangkum,
      });

      if (res.success && res.data) {
        onNotify('success', `Nilai ${currentPraktikan?.nama} (${finalScore}) berhasil disimpan!`);
        
        // Update list penilaian di state lokal
        setPenilaianList((prev) => {
          const filtered = prev.filter((p) => !(p.praktikan_id === activePraktikanId && p.modul_id === Number(selectedModulId)));
          return [...filtered, res.data!];
        });

        // Pindah otomatis ke mahasiswa berikutnya jika autoNext aktif
        if (autoNext) {
          const currentIndex = praktikanList.findIndex((p) => p.id === activePraktikanId);
          if (currentIndex !== -1 && currentIndex + 1 < praktikanList.length) {
            setActivePraktikanId(praktikanList[currentIndex + 1].id);
          } else {
            onNotify('success', 'Seluruh mahasiswa di kelas ini telah selesai dinilai!');
          }
        }
      } else {
        onNotify('error', res.message || 'Gagal menyimpan nilai');
      }
    } catch {
      onNotify('error', 'Terjadi kesalahan saat menyimpan penilaian');
    } finally {
      setSubmitting(false);
    }
  };

  // Hapus Nilai
  const handleDeleteGrade = async (gradeId: number) => {
    if (!window.confirm('Hapus penilaian mahasiswa ini?')) return;

    setDeletingId(gradeId);
    try {
      const res = await api.deletePenilaian(gradeId);
      if (res.success) {
        setPenilaianList((prev) => prev.filter((p) => p.id !== gradeId));
        setSelectedPilihanPerKriteria({});
        setNilaiManual('');
        setCatatanTambahan('');
        setIsManualOverride(false);
        onNotify('success', 'Penilaian berhasil dihapus');
      } else {
        onNotify('error', res.message || 'Gagal menghapus penilaian');
      }
    } catch {
      onNotify('error', 'Kesalahan saat menghapus penilaian');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Bar Konteks Penilaian (Mata Kuliah -> Kelas -> Modul) */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
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

          {/* Pilih Kelas */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <School className="w-3 h-3 text-slate-400" />
              Kelas Praktikum
            </label>
            <select
              value={selectedKelasId}
              onChange={(e) => setSelectedKelasId(Number(e.target.value))}
              disabled={kelasList.length === 0}
              className="w-full h-9 px-2.5 text-xs font-medium bg-white border border-slate-300 rounded-md text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
            >
              {kelasList.length === 0 ? (
                <option value="">Belum ada kelas</option>
              ) : (
                kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kelas} ({k.total_praktikan || 0} Mahasiswa)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Pilih Modul */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-400" />
              Modul yang Dinilai
            </label>
            <select
              value={selectedModulId}
              onChange={(e) => setSelectedModulId(Number(e.target.value))}
              disabled={modulList.length === 0}
              className="w-full h-9 px-2.5 text-xs font-medium bg-white border border-slate-300 rounded-md text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
            >
              {modulList.length === 0 ? (
                <option value="">Belum ada modul</option>
              ) : (
                modulList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.judul_modul}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Progress Nilai Badge */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg self-start md:self-auto shrink-0">
          <Award className="w-4 h-4 text-emerald-600" />
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">
              Progres Evaluasi Kelas
            </span>
            <span className="text-xs font-mono font-bold text-slate-900">
              {totalGraded} / {praktikanList.length} Mahasiswa
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Work Area: Roster Mahasiswa & Matriks Penilaian Klik-Klik */}
      {!selectedKelasId || !selectedModulId ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">Pilih Kelas dan Modul Terlebih Dahulu</h3>
          <p className="text-xs text-slate-400 mt-1">
            Penilaian rubrik memerlukan kelas aktif dan modul praktikum yang dinilai.
          </p>
        </div>
      ) : praktikanList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
          <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">Belum Ada Praktikan di Kelas Ini</h3>
          <p className="text-xs text-slate-400 mt-1">
            Daftarkan mahasiswa ke kelas ini melalui tab <strong>Praktikan</strong>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: Roster Praktikan */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col max-h-[700px]">
            <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">
                Daftar Mahasiswa ({praktikanList.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Pilih Mahasiswa
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {praktikanList.map((p) => {
                const isSelected = activePraktikanId === p.id;
                const grade = penilaianList.find((g) => g.praktikan_id === p.id && g.modul_id === Number(selectedModulId));

                return (
                  <div
                    key={p.id}
                    onClick={() => setActivePraktikanId(p.id)}
                    className={`p-3 transition-colors cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50/80 ring-1 ring-inset ring-emerald-500/25 font-medium'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900">
                          {p.nama}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {p.nim}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {grade ? (
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {grade.nilai_angka}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-slate-400" />
                          Belum Dinilai
                        </span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-600' : 'text-slate-300'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kolom Kanan: Matriks Penilaian Klik-Klik Rubrik */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col">
            {currentPraktikan ? (
              <>
                {/* Header Praktikan Aktif & Kalkulator Nilai */}
                <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {currentPraktikan.nama}
                      </h3>
                      <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold inline-block">
                        {currentPraktikan.nim}
                      </span>
                    </div>
                  </div>

                  {/* Skor Real-Time yang Terkalkulasi */}
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block flex items-center justify-end gap-1">
                        <Calculator className="w-3 h-3 text-emerald-600" />
                        Nilai Akhir
                      </span>
                      <span className="text-2xl font-mono font-black text-emerald-700 leading-tight">
                        {nilaiAkhirEfektif.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-medium">
                        Predikat: <strong>{predikatHuruf}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body: Matriks Kriteria Rubrik (Tinggal Klik-Klik) */}
                <div className="p-4 sm:p-5 space-y-5 flex-1 overflow-y-auto max-h-[500px]">
                  {activeKriteriaList.length === 0 ? (
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-slate-700">Belum Ada Rubrik Khusus di Modul Ini</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Anda dapat menyusun rubrik di tab <strong>Prompt Rubrik AI</strong> atau <strong>Rubrik Modul</strong>, atau masukkan nilai manual di bawah.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                          Klik Pilihan Pencapaian Berdasarkan Rubrik:
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedPilihanPerKriteria({})}
                          className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                          title="Reset pilihan klik"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Pilihan</span>
                        </button>
                      </div>

                      {activeKriteriaList.map((kriteria, idx) => {
                        const options = getOptionsForCriterion(kriteria);
                        const selectedOption = selectedPilihanPerKriteria[idx];

                        return (
                          <div
                            key={idx}
                            className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-lg transition"
                          >
                            {/* Judul Aspek & Bobot */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span>{kriteria.aspek}</span>
                              </span>
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-emerald-700 border border-emerald-200 font-semibold">
                                Bobot: {kriteria.bobot}%
                              </span>
                            </div>

                            {kriteria.deskripsi && (
                              <p className="text-[11px] text-slate-500 mb-2.5 pl-6">
                                {kriteria.deskripsi}
                              </p>
                            )}

                            {/* Opsi Pilihan (Tombol Klik Interaktif - Mendukung 3 s.d 5 Tingkat) */}
                            <div className={`grid gap-2 pl-6 ${
                              options.length === 5
                                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
                                : options.length === 4
                                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                                : 'grid-cols-1 sm:grid-cols-3'
                            }`}>
                              {options.map((opt) => {
                                const isChosen = selectedOption?.label === opt.label;
                                const poinDidapat = (Number(kriteria.bobot) * Number(opt.skor_persen)) / 100;

                                return (
                                  <button
                                    key={opt.label}
                                    type="button"
                                    onClick={() => handleSelectOption(idx, opt)}
                                    className={`p-2.5 text-left rounded-md border text-xs transition cursor-pointer flex flex-col justify-between gap-1.5 min-h-[4.75rem] ${
                                      isChosen
                                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-500/20'
                                        : 'bg-white text-slate-800 border-slate-200 hover:bg-emerald-50/50 hover:border-emerald-300'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className={`font-mono font-bold uppercase text-[11px] ${isChosen ? 'text-emerald-100' : 'text-emerald-700'}`}>
                                        Opsi {opt.label}
                                      </span>
                                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isChosen ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                        +{poinDidapat} ({opt.skor_persen}%)
                                      </span>
                                    </div>
                                    <p className={`text-[11px] leading-snug line-clamp-2 ${isChosen ? 'text-white' : 'text-slate-600'}`}>
                                      {opt.tingkat}
                                    </p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Panel Catatan Evaluasi & Nilai Manual Override (Opsional) */}
                  <div className="pt-2 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Catatan Evaluasi / Ringkasan Naratif
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsManualOverride(!isManualOverride)}
                        className="text-[11px] text-emerald-700 hover:underline cursor-pointer"
                      >
                        {isManualOverride ? 'Kembali ke Skor Otomatis' : 'Kustom Nilai Manual'}
                      </button>
                    </div>

                    {/* Jika Mode Manual Aktif */}
                    {isManualOverride && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-3">
                        <span className="text-xs text-amber-800 font-medium">Override Nilai Angka:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={nilaiManual}
                          onChange={(e) => setNilaiManual(e.target.value)}
                          placeholder="Nilai angka"
                          className="w-24 h-8 px-2 text-xs font-mono font-bold bg-white border border-amber-300 rounded text-slate-900 focus:outline-none"
                        />
                        <span className="text-[11px] text-amber-600">(Nilai ini akan mengesampingkan kalkulasi klik rubrik)</span>
                      </div>
                    )}

                    {/* Textarea Hasil Evaluasi */}
                    <textarea
                      rows={4}
                      value={evaluasiTerangkum}
                      onChange={(e) => setCatatanTambahan(e.target.value)}
                      placeholder="Ulasan penilaian akan otomatis terisi berdasarkan opsi rubrik yang Anda klik di atas, atau ketik feedback tambahan di sini..."
                      className="w-full p-3 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-sans leading-relaxed"
                    />
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                  {currentGrade ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteGrade(currentGrade.id)}
                      disabled={deletingId === currentGrade.id}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Penilaian</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleSave(false)}
                      disabled={submitting}
                      className="flex-1 sm:flex-none h-10 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Simpan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSave(true)}
                      disabled={submitting}
                      className="flex-1 sm:flex-none h-10 px-5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-semibold rounded-md shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Simpan & Mahasiswa Berikutnya &rarr;</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-slate-400 p-6">
                <p className="text-xs">Pilih mahasiswa di daftar sebelah kiri untuk memulai penilaian.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { 
  Download, 
  Search, 
  BookOpen, 
  School, 
  Users, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Info,
  X,
  FileText
} from 'lucide-react';
import type { MataKuliah, Kelas, RekapData, RekapMahasiswa, RekapItemNilai } from '../types';
import { api } from '../services/api';

interface DashboardRekapProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export default function DashboardRekap({ onNotify }: DashboardRekapProps) {
  // State Filter & Master Data
  const [matakuliahList, setMatakuliahList] = useState<MataKuliah[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedMatakuliahId, setSelectedMatakuliahId] = useState<number | ''>('');
  const [selectedKelasId, setSelectedKelasId] = useState<number | ''>('');

  // Search & Filter Lokal
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'lulus' | 'remedial' | 'belum'>('all');

  // Rekap Data State
  const [rekapData, setRekapData] = useState<RekapData | null>(null);
  const [loading, setLoading] = useState(false);

  // Detail Modal Catatan Evaluasi
  const [activeCatatan, setActiveCatatan] = useState<{
    nama: string;
    nim: string;
    modulJudul: string;
    nilai: number;
    catatan: string;
  } | null>(null);

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

  // 2. Muat Kelas saat Mata Kuliah berubah
  useEffect(() => {
    if (!selectedMatakuliahId) {
      setKelasList([]);
      setSelectedKelasId('');
      return;
    }

    api.getKelas(Number(selectedMatakuliahId)).then((res) => {
      if (res.success && res.data) {
        setKelasList(res.data);
        setSelectedKelasId(''); // default: Semua Kelas
      }
    });
  }, [selectedMatakuliahId]);

  // 3. Muat Data Rekapitulasi dari Backend
  const fetchRekap = () => {
    if (!selectedMatakuliahId) {
      setRekapData(null);
      return;
    }

    setLoading(true);
    api.getRekap(
      Number(selectedMatakuliahId),
      selectedKelasId ? Number(selectedKelasId) : undefined
    )
      .then((res) => {
        if (res.success && res.data) {
          setRekapData(res.data);
        } else {
          onNotify('error', res.message || 'Gagal memuat rekapitulasi nilai');
        }
      })
      .catch(() => {
        onNotify('error', 'Terjadi kesalahan saat memuat rekapitulasi');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRekap();
  }, [selectedMatakuliahId, selectedKelasId]);

  // Filter daftar mahasiswa berdasarkan pencarian & filter status
  const filteredMahasiswa = useMemo(() => {
    if (!rekapData) return [];
    return rekapData.rekapMahasiswa.filter((m) => {
      const matchSearch =
        m.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.nama_kelas.toLowerCase().includes(searchQuery.toLowerCase());

      let matchStatus = true;
      if (filterStatus === 'lulus') matchStatus = m.status === 'Lulus';
      else if (filterStatus === 'remedial') matchStatus = m.status === 'Remedial';
      else if (filterStatus === 'belum') matchStatus = m.status === 'Belum Ada Nilai';

      return matchSearch && matchStatus;
    });
  }, [rekapData, searchQuery, filterStatus]);

  // Export to CSV Functionality
  const handleExportCSV = () => {
    if (!rekapData || rekapData.rekapMahasiswa.length === 0) {
      onNotify('error', 'Tidak ada data nilai untuk diekspor');
      return;
    }

    const { matakuliah, kelas, modulList, rekapMahasiswa } = rekapData;

    // Header Kolom CSV
    const headers = [
      'No',
      'NIM',
      'Nama Mahasiswa',
      'Kelas',
      ...modulList.map((m) => `"${m.judul_modul.replace(/"/g, '""')}"`),
      'Rata-rata',
      'Predikat',
      'Status Kelulusan'
    ];

    // Baris-baris Data CSV
    const rows = rekapMahasiswa.map((m: RekapMahasiswa, idx: number) => {
      const modulScores = modulList.map((mod) => {
        const item: RekapItemNilai | null = m.nilaiPerModul[mod.id];
        return item ? item.nilai_angka : '-';
      });

      return [
        idx + 1,
        `'${m.nim}`, // Menggunakan petik agar Excel tidak memotong angka 0 di depan NIM
        `"${m.nama.replace(/"/g, '""')}"`,
        `"${m.nama_kelas.replace(/"/g, '""')}"`,
        ...modulScores,
        m.rataRata,
        `"${m.predikat}"`,
        `"${m.status}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().split('T')[0];
    const kelasStr = kelas ? `_${kelas.nama_kelas.replace(/\s+/g, '_')}` : '_Semua_Kelas';
    const matkulStr = matakuliah.nama.replace(/\s+/g, '_');
    const filename = `Rekap_Nilai_${matkulStr}${kelasStr}_${dateStr}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onNotify('success', `File "${filename}" berhasil diunduh!`);
  };

  // Helper Warna Badge Nilai
  const getScoreBadge = (score: number | null | undefined, m: RekapMahasiswa, modulJudul: string, catatan?: string) => {
    if (score === null || score === undefined) {
      return (
        <span className="text-slate-300 font-mono text-xs text-center block">-</span>
      );
    }

    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
    if (score >= 85) badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
    else if (score >= 75) badgeClass = 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100';
    else if (score >= 65) badgeClass = 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100';
    else badgeClass = 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100';

    return (
      <button
        type="button"
        onClick={() => {
          if (catatan) {
            setActiveCatatan({
              nama: m.nama,
              nim: m.nim,
              modulJudul,
              nilai: score,
              catatan,
            });
          }
        }}
        className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border transition cursor-pointer flex items-center justify-center gap-1 mx-auto ${badgeClass} ${catatan ? 'hover:scale-105' : ''}`}
        title={catatan ? 'Klik untuk melihat catatan evaluasi' : `Nilai: ${score}`}
      >
        <span>{score}</span>
        {catatan && <FileText className="w-2.5 h-2.5 opacity-60" />}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Bar Filter Mata Kuliah & Kelas */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 max-w-xl">
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
              Filter Kelas
            </label>
            <select
              value={selectedKelasId}
              onChange={(e) => setSelectedKelasId(e.target.value ? Number(e.target.value) : '')}
              className="w-full h-9 px-2.5 text-xs font-medium bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
            >
              <option value="">Semua Kelas ({kelasList.length} Kelas)</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas} ({k.total_praktikan || 0} Mahasiswa)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons: Refresh & Export to CSV */}
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={fetchRekap}
            disabled={loading}
            className="h-9 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Muat ulang data rekap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!rekapData || rekapData.rekapMahasiswa.length === 0}
            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-semibold rounded-md shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Kartu Statistik Ringkasan Kelas */}
      {rekapData?.statistik && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Praktikan */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500">Total Mahasiswa</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-slate-900">
              {rekapData.statistik.totalPraktikan}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {rekapData.statistik.mahasiswaDinilai} mahasiswa telah memiliki nilai
            </span>
          </div>

          {/* Rata-Rata Kelas */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500">Rata-Rata Kelas</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-700">
              {rekapData.statistik.rataRataKelas.toFixed(1)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Dari {rekapData.statistik.totalModul} modul aktif
            </span>
          </div>

          {/* Nilai Tertinggi / Terendah */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500">Rentang Nilai</span>
              <Award className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-slate-900">
              {rekapData.statistik.nilaiTertinggi}{' '}
              <span className="text-xs font-normal text-slate-400">/ {rekapData.statistik.nilaiTerendah}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Tertinggi / Terendah
            </span>
          </div>

          {/* Persentase Kelulusan */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500">Tingkat Kelulusan</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-700">
              {rekapData.statistik.persenLulus}%
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Nilai kelulusan &ge; 60 poin
            </span>
          </div>
        </div>
      )}

      {/* 3. Panel Matriks Rekapitulasi Tabel */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari NIM, Nama, atau Kelas..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition"
            />
          </div>

          {/* Filter Status Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
            <span className="text-[11px] text-slate-500 mr-1 hidden sm:inline">Status:</span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'lulus', label: 'Lulus' },
              { id: 'remedial', label: 'Remedial' },
              { id: 'belum', label: 'Belum Dinilai' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilterStatus(st.id as any)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer border ${
                  filterStatus === st.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabel Rekapitulasi Matriks */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs">Memuat rekapitulasi nilai praktikum...</span>
          </div>
        ) : !rekapData || rekapData.rekapMahasiswa.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">Belum Ada Mahasiswa Terdaftar</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Daftarkan mahasiswa pada tab <strong>Praktikan</strong> untuk melihat rekapitulasi.
            </p>
          </div>
        ) : filteredMahasiswa.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Search className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-700">Tidak Ada Mahasiswa yang Cocok</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Coba sesuaikan kata kunci pencarian atau ubah filter status di atas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3 w-28">NIM</th>
                  <th className="py-3 px-4 min-w-[160px]">Nama Mahasiswa</th>
                  <th className="py-3 px-3 w-24">Kelas</th>
                  
                  {/* Kolom Dinamis Setiap Modul */}
                  {rekapData.modulList.map((m) => (
                    <th key={m.id} className="py-3 px-2 text-center min-w-[90px] border-l border-slate-100">
                      <span className="line-clamp-1" title={m.judul_modul}>
                        {m.judul_modul}
                      </span>
                    </th>
                  ))}

                  <th className="py-3 px-3 text-center w-20 border-l border-slate-200 font-bold text-slate-900">
                    Rata-rata
                  </th>
                  <th className="py-3 px-2 text-center w-16">Predikat</th>
                  <th className="py-3 px-3 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMahasiswa.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                      {m.nim}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {m.nama}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                        {m.nama_kelas}
                      </span>
                    </td>

                    {/* Nilai per Modul */}
                    {rekapData.modulList.map((mod) => {
                      const item = m.nilaiPerModul[mod.id];
                      return (
                        <td key={mod.id} className="py-2.5 px-2 text-center border-l border-slate-100">
                          {getScoreBadge(item?.nilai_angka, m, mod.judul_modul, item?.catatan_evaluasi)}
                        </td>
                      );
                    })}

                    {/* Rata-Rata */}
                    <td className="py-2.5 px-3 text-center border-l border-slate-200 font-mono font-bold text-slate-900 bg-slate-50/40">
                      {m.rataRata > 0 ? m.rataRata.toFixed(1) : '-'}
                    </td>

                    {/* Predikat */}
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700">
                      {m.predikat !== '-' ? (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          m.predikat === 'A' ? 'bg-emerald-100 text-emerald-800' :
                          m.predikat === 'B' ? 'bg-sky-100 text-sky-800' :
                          m.predikat === 'C' ? 'bg-amber-100 text-amber-800' :
                          m.predikat === 'D' ? 'bg-orange-100 text-orange-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {m.predikat}
                        </span>
                      ) : '-'}
                    </td>

                    {/* Status Kelulusan */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-block ${
                        m.status === 'Lulus'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : m.status === 'Remedial'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Info Rekap */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Klik pada chip nilai bernomor untuk membaca rincian catatan evaluasi mahasiswa.</span>
          </div>
          <span className="font-mono text-slate-600">
            Menampilkan {filteredMahasiswa.length} dari {rekapData?.rekapMahasiswa.length || 0} mahasiswa
          </span>
        </div>
      </div>

      {/* Modal Drawer: Detail Catatan Evaluasi Mahasiswa */}
      {activeCatatan && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Detail Evaluasi Modul
                </h4>
                <p className="text-xs text-slate-700 font-medium mt-0.5">
                  {activeCatatan.nama} <span className="font-mono text-slate-500">({activeCatatan.nim})</span>
                </p>
                <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                  {activeCatatan.modulJudul} &bull; Nilai: {activeCatatan.nilai}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveCatatan(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded p-3.5 max-h-72 overflow-y-auto">
              <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                {activeCatatan.catatan || 'Tidak ada catatan evaluasi khusus.'}
              </pre>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveCatatan(null)}
                className="h-8 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

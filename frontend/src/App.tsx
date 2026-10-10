import { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Layers, 
  FileCode, 
  Award, 
  FileSpreadsheet,
  Menu,
  ChevronRight,
  Database
} from 'lucide-react';
import MataKuliahManager from './components/MataKuliahManager';
import PraktikanManager from './components/PraktikanManager';
import ModulRubrikWorkspace from './components/ModulRubrikWorkspace';
import FormPenilaian from './components/FormPenilaian';
import DashboardRekap from './components/DashboardRekap';
import { api } from './services/api';

type TabType = 'rekap' | 'penilaian' | 'rubrik' | 'matakuliah' | 'praktikan' | 'all';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('rekap');
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Periksa status server backend
    api.checkDbStatus()
      .then((res) => {
        setServerOnline(res.success === true);
      })
      .catch(() => {
        setServerOnline(false);
      });
  }, []);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Navigasi Item
  const navItems = [
    {
      group: 'PENILAIAN & EVALUASI',
      items: [
        {
          id: 'rekap' as TabType,
          label: 'Rekapitulasi & Export',
          desc: 'Matriks nilai & download CSV',
          icon: FileSpreadsheet,
        },
        {
          id: 'penilaian' as TabType,
          label: 'Form Penilaian',
          desc: 'Klik opsi rubrik bertingkat',
          icon: Award,
        },
        {
          id: 'rubrik' as TabType,
          label: 'Modul & Rubrik Penilaian',
          desc: 'AI Drafter PDF + Kelola Rubrik',
          icon: FileCode,
        },
      ],
    },
    {
      group: 'DATA MASTER',
      items: [
        {
          id: 'matakuliah' as TabType,
          label: 'Mata Kuliah & Kelas',
          desc: 'Kelola matkul dan multi-kelas',
          icon: BookOpen,
        },
        {
          id: 'praktikan' as TabType,
          label: 'Daftar Praktikan',
          desc: 'Data mahasiswa per kelas',
          icon: Users,
        },
        {
          id: 'all' as TabType,
          label: 'Master Berdampingan',
          desc: 'Split view matkul & mahasiswa',
          icon: Layers,
        },
      ],
    },
  ];

  // Judul Halaman Aktif
  const activeTitle = {
    rekap: { title: 'Dashboard Rekapitulasi Nilai', desc: 'Rekapitulasi nilai mahasiswa per modul dan ekspor data ke format CSV Excel' },
    penilaian: { title: 'Form Penilaian Praktikan', desc: 'Evaluasi hasil tugas mahasiswa praktikum berbasis klik opsi rubrik bertingkat' },
    rubrik: { title: 'Modul & Rubrik Penilaian', desc: 'Penyusunan rubrik objektif via AI dari dokumen PDF tugas dan manajemen modul laboratorium' },
    matakuliah: { title: 'Manajemen Mata Kuliah & Kelas', desc: 'Pengaturan mata kuliah dan pembagian kelas praktikum laboratorium' },
    praktikan: { title: 'Daftar Mahasiswa Praktikan', desc: 'Pendaftaran dan pengelolaan mahasiswa per kelas praktikum' },
    all: { title: 'Data Master Berdampingan', desc: 'Pengelolaan mata kuliah, kelas, dan data praktikan secara berdampingan' },
  }[activeTab];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs font-medium leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Backdrop Mobile Sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-2xs transition-opacity"
        />
      )}

      {/* 1. SIDEBAR NAVIGATION */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-tight">
                Asisten Praktikum
              </h1>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                Laboratorium Tools
              </span>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-700 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navItems.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                {group.group}
              </span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between group ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <span className="block truncate leading-tight">
                          {item.label}
                        </span>
                        <span className={`text-[10px] font-normal truncate block mt-0.5 ${
                          isActive ? 'text-emerald-700' : 'text-slate-400'
                        }`}>
                          {item.desc}
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer: Database Connection Pill */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/70">
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  serverOnline === true
                    ? 'bg-emerald-500 animate-pulse'
                    : serverOnline === false
                    ? 'bg-red-500'
                    : 'bg-slate-400'
                }`}
              />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block leading-none">
                  MySQL Database
                </span>
                <span className="text-[11px] font-mono text-slate-700 font-semibold leading-tight">
                  {serverOnline ? 'asisten_praktikum_db' : 'Terputus'}
                </span>
              </div>
            </div>
            <Database className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen lg:pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {activeTitle.title}
              </h2>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {activeTitle.desc}
              </p>
            </div>
          </div>

          {/* Quick System Badge */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold hidden md:inline-block">
              Port: 5000 &bull; Laragon
            </span>
          </div>
        </header>

        {/* Main Work Surface */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'rekap' && (
            <div>
              <DashboardRekap onNotify={addToast} />
            </div>
          )}

          {activeTab === 'penilaian' && (
            <div>
              <FormPenilaian onNotify={addToast} />
            </div>
          )}

          {activeTab === 'rubrik' && (
            <div>
              <ModulRubrikWorkspace onNotify={addToast} />
            </div>
          )}

          {activeTab === 'matakuliah' && (
            <div className="max-w-4xl mx-auto">
              <MataKuliahManager onNotify={addToast} />
            </div>
          )}

          {activeTab === 'praktikan' && (
            <div className="max-w-4xl mx-auto">
              <PraktikanManager onNotify={addToast} />
            </div>
          )}

          {activeTab === 'all' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5">
                <MataKuliahManager onNotify={addToast} />
              </div>
              <div className="lg:col-span-7">
                <PraktikanManager onNotify={addToast} />
              </div>
            </div>
          )}
        </main>

        {/* Minimalist Footer */}
        <footer className="bg-white border-t border-slate-200 py-3 mt-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-1.5">
            <span>Asisten Praktikum Tools &bull; Clinical Precision Minimalist</span>
            <span className="text-[11px] text-slate-400">
              Sistem Penilaian, Manajemen Modul, & Master Kelas Laboratorium
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

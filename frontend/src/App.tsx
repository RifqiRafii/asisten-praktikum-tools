import { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Server, 
  Layers,
  FileCode,
  Sparkles,
  Award
} from 'lucide-react';
import MataKuliahManager from './components/MataKuliahManager';
import PraktikanManager from './components/PraktikanManager';
import ModulRubrikManager from './components/ModulRubrikManager';
import PromptGenerator from './components/PromptGenerator';
import FormPenilaian from './components/FormPenilaian';
import { api } from './services/api';

type TabType = 'penilaian' | 'prompt' | 'rubrik' | 'all' | 'matakuliah' | 'praktikan';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('penilaian');
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
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

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-base tracking-tight">
                  Asisten Praktikum Tools
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                  Tahap 5: Form Penilaian
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Sistem Penilaian Praktikum, Form Evaluasi, & Master Kelas Laboratorium
              </p>
            </div>
          </div>

          {/* Backend Connection Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                serverOnline === true
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : serverOnline === false
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  serverOnline === true
                    ? 'bg-emerald-500 animate-pulse'
                    : serverOnline === false
                    ? 'bg-red-500'
                    : 'bg-slate-400'
                }`}
              />
              <Server className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {serverOnline === true
                  ? 'MySQL API Aktif'
                  : serverOnline === false
                  ? 'Server Terputus'
                  : 'Menghubungkan...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 flex-wrap">
            <button
              onClick={() => setActiveTab('penilaian')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'penilaian'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Form Penilaian & Evaluasi</span>
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'prompt'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Prompt Rubrik AI</span>
            </button>
            <button
              onClick={() => setActiveTab('rubrik')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rubrik'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>Rubrik Modul</span>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Data Master (Berdampingan)</span>
            </button>
            <button
              onClick={() => setActiveTab('matakuliah')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'matakuliah'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mata Kuliah & Kelas</span>
            </button>
            <button
              onClick={() => setActiveTab('praktikan')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'praktikan'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Praktikan</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 hidden sm:inline">
            MySQL DB: <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 font-mono">asisten_praktikum_db</code>
          </span>
        </div>

        {/* Content Area */}
        {activeTab === 'penilaian' && (
          <div>
            <FormPenilaian onNotify={addToast} />
          </div>
        )}

        {activeTab === 'prompt' && (
          <div>
            <PromptGenerator onNotify={addToast} />
          </div>
        )}

        {activeTab === 'rubrik' && (
          <div>
            <ModulRubrikManager onNotify={addToast} />
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

        {activeTab === 'matakuliah' && (
          <div className="max-w-3xl mx-auto">
            <MataKuliahManager onNotify={addToast} />
          </div>
        )}

        {activeTab === 'praktikan' && (
          <div className="max-w-4xl mx-auto">
            <PraktikanManager onNotify={addToast} />
          </div>
        )}
      </main>

      {/* Minimalist Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Clinical Precision Minimalist Design • Asisten Praktikum Tools</span>
          <span className="text-slate-400">Tahap 5: Form Penilaian & Evaluasi Selesai Diimplementasikan</span>
        </div>
      </footer>
    </div>
  );
}

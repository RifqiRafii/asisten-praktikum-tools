import { useState } from 'react'
import { GraduationCap, CheckCircle2, Terminal, Code2, Database, Sparkles, Layers } from 'lucide-react'

export default function App() {
  const [clickCount, setClickCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 antialiased">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Asisten Praktikum Tools
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Tahap 1: Frontend Aktif
              </span>
            </h1>
            <p className="text-sm text-slate-400">
              Tool pembantu penilaian & live-coding asisten praktikum
            </p>
          </div>
        </div>

        {/* Feature Stack Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 flex flex-col items-center text-center">
            <Code2 className="w-5 h-5 text-sky-400 mb-1" />
            <span className="text-xs font-semibold text-slate-200">React + TS</span>
            <span className="text-[10px] text-slate-400">Vite Bundle</span>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 flex flex-col items-center text-center">
            <Sparkles className="w-5 h-5 text-teal-400 mb-1" />
            <span className="text-xs font-semibold text-slate-200">Tailwind CSS</span>
            <span className="text-[10px] text-slate-400">Modern Styling</span>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 flex flex-col items-center text-center">
            <Layers className="w-5 h-5 text-indigo-400 mb-1" />
            <span className="text-xs font-semibold text-slate-200">Lucide Icons</span>
            <span className="text-[10px] text-slate-400">Clean UI</span>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 flex flex-col items-center text-center">
            <Database className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-xs font-semibold text-slate-200">MySQL Setup</span>
            <span className="text-[10px] text-slate-400">Langkah Berikutnya</span>
          </div>
        </div>

        {/* Interactive Verification Section */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">Uji Interaktivitas React State</p>
              <p className="text-xs text-slate-400">Klik tombol untuk memastikan HMR & state berjalan lancar</p>
            </div>
            <button
              onClick={() => setClickCount((prev) => prev + 1)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-medium rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <span>Klik Uji: {clickCount}</span>
            </button>
          </div>
        </div>

        {/* Verification Checklist */}
        <div className="border-t border-slate-800 pt-5 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-500" />
            <span>Port Default: <code>http://localhost:5173</code></span>
          </div>
          <span className="text-emerald-400 font-medium">✓ Ready for Human-in-the-Loop check</span>
        </div>
      </div>
    </div>
  )
}

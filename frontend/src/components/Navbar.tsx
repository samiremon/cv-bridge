import { Sparkles, FileText, Users, Mic, LayoutGrid } from 'lucide-react';

export type TabType = 'overview' | 'tailor' | 'screening' | 'interview';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="border-b border-slate-200/90 bg-white/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-2 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2.5 sm:gap-4">
        
        {/* Brand Logo & Tag */}
        <button 
          onClick={() => setActiveTab('overview')}
          className="flex items-center gap-3 group cursor-pointer focus:outline-none"
        >
          <div className="bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 p-2 rounded-xl text-white shadow-md shadow-indigo-600/25 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900">
                CV<span className="text-indigo-600">-Bridge</span>
              </span>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/70 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Multi-Agent AI
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">Autonomous Career & Hiring System</p>
          </div>
        </button>

        {/* User-Friendly Large Navigation Tabs */}
        <nav className="flex flex-wrap items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 gap-1 shadow-2xs">
          
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('tailor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'tailor'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            <span>AI Resume Customizer</span>
          </button>

          <button
            onClick={() => setActiveTab('screening')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'screening'
                ? 'bg-white text-purple-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-500" />
            <span>HR Candidate Ranker</span>
          </button>

          <button
            onClick={() => setActiveTab('interview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'interview'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-emerald-500" />
            <span>Voice Mock Interview</span>
          </button>

        </nav>

        {/* Live System Indicator */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>AI Agents Online</span>
        </div>

      </div>
    </header>
  );
};
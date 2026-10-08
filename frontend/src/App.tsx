import { useState } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { FeatureOverview } from './components/FeatureOverview';
import { CvTailor } from './components/CvTailor';
import { HrScreening } from './components/HrScreening';
import { VoiceInterview } from './components/VoiceInterview';
import { Sparkles, Shield, Cpu } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-100 selection:text-indigo-800">
      {/* High Visibility Light-Themed Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className={`flex-1 px-4 py-2 sm:px-6 sm:py-3 w-full mx-auto ${activeTab === 'tailor' ? 'max-w-[1600px]' : 'max-w-7xl'}`}>
        {activeTab === 'overview' && (
          <FeatureOverview onSelectFeature={(feature) => setActiveTab(feature)} />
        )}
        {activeTab === 'tailor' && (
          <CvTailor onBackToOverview={() => setActiveTab('overview')} />
        )}
        {activeTab === 'screening' && (
          <HrScreening onBackToOverview={() => setActiveTab('overview')} />
        )}
        {activeTab === 'interview' && (
          <VoiceInterview onBackToOverview={() => setActiveTab('overview')} />
        )}
      </main>

      {/* Clean Light-Themed Footer with Developer Credit */}
      <footer className="border-t border-slate-200/80 bg-white py-2.5 mt-auto text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-800">CV-Bridge</span>
            <span>•</span>
            <span className="text-slate-600 font-medium">
              Developed by: <span className="font-bold text-indigo-600">Samir Yeasir Emon</span>
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-slate-500 text-[11px]">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" /> Truth-Preserving
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" /> Multi-Agent Architecture
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Real-time Speech API
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
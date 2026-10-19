import React from 'react';
import { 
  FileText, 
  Users, 
  Mic, 
  ArrowRight, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface FeatureOverviewProps {
  onSelectFeature: (feature: 'tailor' | 'screening' | 'interview') => void;
}

export const FeatureOverview: React.FC<FeatureOverviewProps> = ({ onSelectFeature }) => {
  return (
    <div className="space-y-8 py-4">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold tracking-wide uppercase shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Multi-Agent AI Career & Hiring Platform
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Intelligent AI Agents Connecting{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
            Talent With Opportunity
          </span>
        </h1>
      </div>

      {/* 3 Main AI Feature Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Block 1: AI Resume Customizer */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between group overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/80 px-2.5 py-1 rounded border border-indigo-100">
                AI Career Agent
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                AI Resume Customizer
              </h3>

              <ul className="space-y-2 text-xs text-slate-600 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Interactive skill gap clarification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>ATS-ready PDF with keyword highlights</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 border-t border-slate-100">
            <button
              onClick={() => onSelectFeature('tailor')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-3 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 text-xs sm:text-sm group-hover:shadow-indigo-600/20 cursor-pointer"
            >
              <span>Customize My Resume</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Block 2: HR Candidate Ranker */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-purple-300 transition-all duration-300 flex flex-col justify-between group overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50/80 px-2.5 py-1 rounded border border-purple-100">
                HR Recruiter Agent
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                HR Candidate Ranker
              </h3>

              <ul className="space-y-2 text-xs text-slate-600 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>0–100 candidate ranking & scorecard</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Hard criteria filters & email dispatch</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 border-t border-slate-100">
            <button
              onClick={() => onSelectFeature('screening')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-3 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 text-xs sm:text-sm group-hover:shadow-purple-600/20 cursor-pointer"
            >
              <span>Screen Candidates with HR</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Block 3: Voice Mock Interview */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <Mic className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50/80 px-2.5 py-1 rounded border border-emerald-100">
                AI Voice Coach
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                AI Voice Mock Interviewer
              </h3>

              <ul className="space-y-2 text-xs text-slate-600 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Real-time voice conversation with Alex</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Role-adaptive questions & scorecard</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 border-t border-slate-100">
            <button
              onClick={() => onSelectFeature('interview')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-3 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 text-xs sm:text-sm group-hover:shadow-emerald-600/20 cursor-pointer"
            >
              <span>Start Voice Mock</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

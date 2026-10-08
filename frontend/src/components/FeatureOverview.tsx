import React from 'react';
import { 
  FileText, 
  Users, 
  Mic, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  SlidersHorizontal 
} from 'lucide-react';

interface FeatureOverviewProps {
  onSelectFeature: (feature: 'tailor' | 'screening' | 'interview') => void;
}

export const FeatureOverview: React.FC<FeatureOverviewProps> = ({ onSelectFeature }) => {
  return (
    <div className="space-y-6 py-2">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-2.5">
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
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Deploy specialized autonomous AI agents to optimize resumes truthfully, 
          streamline HR candidate shortlisting, and practice real-time voice interviews.
        </p>

        {/* Quick Highlights Pill Bar */}
        <div className="pt-1 flex flex-wrap justify-center items-center gap-2.5 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Honest CV Alignment
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-2xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" /> Objective Hard & Soft Screening
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Zero-Cost Voice AI Engine
          </span>
        </div>
      </div>

      {/* 3 Main AI Feature Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Block 1: AI Resume Customizer */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between group overflow-hidden">
          <div className="p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100">
                AI Career Agent
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                AI Resume Customizer
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Custom Tailoring & Honesty Verification
              </p>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Analyze skill gaps against job specs, answer clarifying prompts, and export ATS-ready truthful resumes.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                Included Facilities:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Interactive clarification for missing tech stack</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>No fabricated experiences—strictly truthful</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Export ATS-friendly standardized format</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/70 border-t border-slate-100">
            <button
              onClick={() => onSelectFeature('tailor')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-3 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 text-xs sm:text-sm group-hover:shadow-indigo-600/20"
            >
              <span>Customize My Resume</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Block 2: HR Candidate Ranker */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-purple-300 transition-all duration-300 flex flex-col justify-between group overflow-hidden">
          <div className="p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50/80 px-2 py-0.5 rounded border border-purple-100">
                HR Recruiter Agent
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                HR Candidate Ranker
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Automated Screening & 0–100 Scoring
              </p>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Evaluate up to 10 CVs against role criteria, automatically rank applicants, and review detailed justifications.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                Included Facilities:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Hard criteria filters (Min Years, Min CGPA, MSc)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Dynamic 0–100 suitability score & leaderboard</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Deep justification for each candidate score</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/70 border-t border-slate-100">
            <button
              onClick={() => onSelectFeature('screening')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-3 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 text-xs sm:text-sm group-hover:shadow-purple-600/20"
            >
              <span>Screen Candidates with HR</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Block 3: Voice Mock Interview */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group overflow-hidden">
          <div className="p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-100">
                AI Voice Coach
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                AI Voice Mock Interviewer
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Real-Time Interactive Voice Practice
              </p>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Conduct voice mock sessions with AI questions, speech synthesis, and real-time mic answer transcription.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                Included Facilities:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Free browser-native Speech Synthesis & STT</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Customizable topic syllabus and difficulty level</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Live transcript recorder with audio feedback</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/70 border-t border-slate-100">
            <button
              onClick={() => onSelectFeature('interview')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-3 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 text-xs sm:text-sm group-hover:shadow-emerald-600/20"
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

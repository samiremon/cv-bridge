import React, { useState } from 'react';
import { 
  Upload, 
  Award, 
  Sparkles, 
  Filter, 
  ArrowLeft, 
  CheckCircle2
} from 'lucide-react';

interface Candidate {
  id: number;
  name: string;
  score: number;
  experience: string;
  degree: string;
  cgpa: string;
  status: 'Matched' | 'Under Review' | 'Disqualified';
  summary: string;
  strengths: string[];
}

interface HrScreeningProps {
  onBackToOverview?: () => void;
}

export const HrScreening: React.FC<HrScreeningProps> = ({ onBackToOverview }) => {
  const [jd, setJd] = useState('');
  const [minExp, setMinExp] = useState('');
  const [minCgpa, setMinCgpa] = useState('');
  const [degreeReq, setDegreeReq] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  const [candidates] = useState<Candidate[]>([
    {
      id: 1,
      name: "Samin Mahmud",
      score: 96,
      experience: "3.5 yrs",
      degree: "BSc in CSE",
      cgpa: "3.82",
      status: "Matched",
      summary: "Strongest match. Exceeds experience requirement (3.5 yrs vs 2 yrs) with 3.82 CGPA, and has production microservices and Docker expertise.",
      strengths: ["Docker & Microservices", "3.82 CGPA", "Clean Architecture"]
    },
    {
      id: 2,
      name: "Tanzim Hasan",
      score: 87,
      experience: "2.5 yrs",
      degree: "BSc in Computer Science",
      cgpa: "3.65",
      status: "Matched",
      summary: "Meets all criteria with 2.5 yrs experience and 3.65 CGPA. Demonstrates solid React & Node proficiency.",
      strengths: ["Exceeds min experience", "React & Node.js", "3.65 CGPA"]
    },
    {
      id: 3,
      name: "Rahim Chowdhury",
      score: 74,
      experience: "2.0 yrs",
      degree: "BSc in CSE",
      cgpa: "3.52",
      status: "Under Review",
      summary: "Meets exact thresholds (2.0 yrs, 3.52 CGPA). Strong core algorithms but limited cloud deployment experience.",
      strengths: ["Meets minimum thresholds", "Core Algorithms"]
    },
    {
      id: 4,
      name: "Zubair Ahmed",
      score: 41,
      experience: "1.0 yr",
      degree: "BSc in EEE",
      cgpa: "3.10",
      status: "Disqualified",
      summary: "Does not meet hard thresholds: 1.0 yr experience (min 2 yrs needed) and 3.10 CGPA (cutoff 3.50).",
      strengths: ["Basic Scripting"]
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/70">
                <Sparkles className="w-3 h-3 text-purple-600" /> HR Recruiter Agent
              </span>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Automated 0–100 Ranking
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              HR Candidate Ranker
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Upload applicant resumes, set your job description and filters, and review candidate scores with transparent AI reasoning.
            </p>
          </div>

          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Simple Criteria Form */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-600" /> Screening Criteria
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Define job filters and requirements</p>
          </div>

          {/* Job Description */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Target Job Description
            </label>
            <textarea
              rows={3}
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste job requirements..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Filter Thresholds */}
          <div className="space-y-2.5 pt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Hard Thresholds
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Min Experience (Years)
                </label>
                <input
                  type="text"
                  value={minExp}
                  onChange={(e) => setMinExp(e.target.value)}
                  placeholder=""
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Min CGPA
                </label>
                <input
                  type="text"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value)}
                  placeholder=""
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Required Degree
              </label>
              <input
                type="text"
                value={degreeReq}
                onChange={(e) => setDegreeReq(e.target.value)}
                placeholder=""
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Custom AI Agent Instructions */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Custom AI Agent Instructions
              </label>
              <span className="text-[11px] text-slate-400">Optional guidance</span>
            </div>
            <textarea
              rows={2}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Enter custom instructions for the AI agent..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all resize-none placeholder-slate-400"
            />
          </div>

          {/* Upload Resumes */}
          <div className="pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Applicant Resumes
            </label>
            <div className="border border-dashed border-slate-300 hover:border-purple-400 bg-slate-50/70 p-4 rounded-xl text-center cursor-pointer transition-all">
              <Upload className="w-5 h-5 mx-auto text-purple-600 mb-1" />
              <p className="text-xs font-semibold text-slate-800">
                4 Resumes Attached
              </p>
              <span className="text-[11px] text-slate-500 block">
                Click to add more (PDF / DOCX)
              </span>
            </div>
          </div>

          <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer">
            <Sparkles className="w-4 h-4" /> 
            <span>Rank Candidates</span>
          </button>
        </div>

        {/* Right 2 Columns: Simple Candidate Leaderboard */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" /> Ranked Candidates
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Sorted by AI evaluation score</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
              4 Applicants Evaluated
            </span>
          </div>

          {/* Clean Candidate Cards */}
          <div className="space-y-3">
            {candidates.map((c, idx) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-white"
              >
                {/* Header: Rank, Info & Score */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            c.status === 'Matched'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : c.status === 'Under Review'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {c.degree} • {c.experience} exp • CGPA {c.cgpa}
                      </p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className={`text-xl font-extrabold ${
                      c.score >= 90 
                        ? 'text-purple-600' 
                        : c.score >= 70 
                          ? 'text-indigo-600' 
                          : 'text-rose-600'
                    }`}>
                      {c.score}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/100</span>
                  </div>
                </div>

                {/* Plain Summary */}
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {c.summary}
                </p>

                {/* Strengths */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {c.strengths.map((str, sIdx) => (
                    <span 
                      key={sIdx} 
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {str}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
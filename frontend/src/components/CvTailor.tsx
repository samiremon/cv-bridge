import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  Download, 
  ShieldCheck, 
  HelpCircle, 
  Loader2, 
  Check, 
  X, 
  Eye
} from 'lucide-react';
import { 
  analyzeResume, 
  generateTailoredCV, 
  ClarificationQuestion, 
  TailoredCVResponse 
} from '../api';

interface CvTailorProps {
  onBackToOverview?: () => void;
}

const PLACEMENT_OPTIONS = [
  { id: 'summary', label: 'Add in Summary' },
  { id: 'skills', label: 'Add in Skills' },
  { id: 'experience', label: 'Add in Experience' },
  { id: 'projects', label: 'Add in Projects' }
];

export const CvTailor: React.FC<CvTailorProps> = ({ onBackToOverview }) => {
  // Input States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localFileUrl, setLocalFileUrl] = useState<string | null>(null);
  const [jd, setJd] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  // API Process States
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clarification Step Flow (1 question at a time with "Next")
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedPlacements, setSelectedPlacements] = useState<Record<number, string[]>>({});
  const [showPlacementMenu, setShowPlacementMenu] = useState<boolean>(false);
  
  // Results & Live Preview States
  const [tailoredResult, setTailoredResult] = useState<TailoredCVResponse | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [pdfRefreshKey, setPdfRefreshKey] = useState<number>(0);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (localFileUrl) {
        URL.revokeObjectURL(localFileUrl);
      }
    };
  }, [localFileUrl]);

  // File Upload Handler: immediately display original PDF in Preview
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      if (file.type === 'application/pdf') {
        const objectUrl = URL.createObjectURL(file);
        setLocalFileUrl(objectUrl);
        setPreviewPdfUrl(objectUrl);
      } else {
        setLocalFileUrl(null);
        setPreviewPdfUrl(null);
      }
    }
  };

  // Step 1: Call FastAPI analyze endpoint
  const handleAnalyze = async () => {
    if (!selectedFile || !jd.trim()) {
      setError('Please upload a resume file and paste the target Job Description.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setTailoredResult(null);
    setAnswers({});
    setSelectedPlacements({});
    setCurrentQuestionIndex(0);
    setShowPlacementMenu(false);

    try {
      const data = await analyzeResume(selectedFile, jd, customInstructions);
      setSessionId(data.session_id);
      setQuestions(data.clarification_questions);

      // If no clarification questions required, generate right away
      if (data.clarification_questions.length === 0) {
        await handleGenerateAll(data.session_id, {});
      }
    } catch (err: any) {
      setError(err.message || 'Error processing request.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to advance to next unanswered question or next index
  const advanceToNext = (nextIndex?: number) => {
    setShowPlacementMenu(false);
    setCurrentQuestionIndex(prev => {
      const target = nextIndex !== undefined ? nextIndex : prev + 1;
      return target < questions.length ? target : prev;
    });
  };

  // Toggle multi-select checkbox for a placement target (user can freely select or deselect any option, including Skills)
  const togglePlacement = (questionId: number, targetLabel: string) => {
    setSelectedPlacements(prev => {
      const current = prev[questionId] || [];
      const updated = current.includes(targetLabel)
        ? current.filter(t => t !== targetLabel)
        : [...current, targetLabel];
      
      // Update answers state simultaneously
      if (updated.length > 0) {
        setAnswers(a => ({ ...a, [questionId]: updated.join(', ') }));
      } else {
        setAnswers(a => {
          const copy = { ...a };
          delete copy[questionId];
          return copy;
        });
      }
      return { ...prev, [questionId]: updated };
    });
  };

  // Confirm selection and auto-advance to next question immediately
  const recordPlacementDecision = (questionId: number) => {
    const targets = selectedPlacements[questionId] || [];
    if (targets.length === 0) {
      // If user clicked confirm with all deselected, treat as exclude or prompt
      setAnswers(prev => ({ ...prev, [questionId]: "Don't add" }));
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: targets.join(', ') }));
    }
    advanceToNext();
  };

  // Record Red Cross exclusion locally for current question and auto-advance
  const recordRejectDecision = (questionId: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: "Don't add" }));
    setSelectedPlacements(prev => ({ ...prev, [questionId]: [] }));
    advanceToNext();
  };

  // Single LLM Invocation after all answers are collected
  const handleGenerateAll = async (targetSessionId?: string, explicitAnswers?: Record<number, string>) => {
    const id = targetSessionId || sessionId;
    if (!id) return;

    setIsGenerating(true);
    setError(null);

    const answersToSubmit = explicitAnswers || answers;
    // Map numerical IDs to string keys for JSON serialization
    const formattedAnswers: Record<string, string> = {};
    for (const [k, v] of Object.entries(answersToSubmit)) {
      formattedAnswers[String(k)] = v;
    }

    try {
      const result = await generateTailoredCV(id, formattedAnswers);
      setTailoredResult(result);
      
      // Load the generated PDF with green-highlighted additions into the Preview panel
      setPreviewPdfUrl(`http://localhost:8000/api/tailor/preview-pdf?session_id=${id}&v=${Date.now()}`);
      setPdfRefreshKey(k => k + 1);
    } catch (err: any) {
      setError(err.message || 'Error generating tailored CV.');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentQ = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-4">
      {/* Compact Header Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl px-5 py-2.5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/70">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI Resume Customizer
          </span>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Split Screen View
          </span>
        </div>

        <div className="flex items-center gap-2">
          {sessionId && tailoredResult && (
            <a
              href={`http://localhost:8000/api/tailor/export/pdf?session_id=${sessionId}`}
              download={`Tailored_CV_${sessionId.slice(0, 8)}.pdf`}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1.5 px-3.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </a>
          )}

          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Overview
            </button>
          )}
        </div>
      </div>

      {/* 50 / 50 Split Screen: Left Side Inputs & Questions, Right Side Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* ========================================================= */}
        {/* LEFT HALF: Top Input Fields + Bottom Clarifications       */}
        {/* ========================================================= */}
        <div className="space-y-4">
          
          {/* TOP SECTION: Input Fields */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" /> Upload CV & Requirements
              </h2>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Resume Upload Box */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Upload Resume / CV
              </label>
              <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20 p-3 rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-2">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {selectedFile ? selectedFile.name : 'Choose PDF resume file (Instant preview on right)'}
                </span>
              </label>
            </div>

            {/* Job Description Textarea */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Target Job Description (JD)
              </label>
              <textarea
                rows={3}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste job requirements and skills here..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none placeholder-slate-400"
              />
            </div>

            {/* Custom Instructions */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Instruction for AI Agent
              </label>
              <textarea
                rows={1}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Optional tailoring guidance..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none placeholder-slate-400"
              />
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 text-xs cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Auditing Skill Gaps...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> 
                  <span>Analyze Gaps</span>
                </>
              )}
            </button>
          </div>

          {/* BOTTOM SECTION: Honest Clarification Flow (1 question at a time with Next button) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Honest Clarifications
              </h2>
              {questions.length > 0 && (
                <span className="text-[11px] font-semibold text-slate-500">
                  Question {currentQuestionIndex + 1} of {questions.length} ({answeredCount} answered)
                </span>
              )}
            </div>

            {questions.length > 0 && currentQ ? (
              <div className="space-y-3">
                {/* Active Question Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-slate-800 leading-snug">
                      {currentQ.question}
                    </p>
                  </div>

                  {/* Yes (Green Check) / No (Red Cross) Action Row */}
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-xs font-semibold text-slate-600">Do you have this skill?</span>

                    {/* Green Tick Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowPlacementMenu(!showPlacementMenu);
                      }}
                      className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border shadow-xs ${
                        answers[currentQ.id] && answers[currentQ.id] !== "Don't add"
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      <Check className="w-4 h-4" /> Yes, choose sections
                    </button>

                    {/* Red Cross Button */}
                    <button
                      type="button"
                      onClick={() => recordRejectDecision(currentQ.id)}
                      className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border shadow-xs ${
                        answers[currentQ.id] === "Don't add"
                          ? 'bg-rose-600 text-white border-rose-700'
                          : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                      }`}
                    >
                      <X className="w-4 h-4" /> No, exclude
                    </button>
                  </div>

                  {/* Multi-Select Placement Menu when Yes clicked */}
                  {showPlacementMenu && (
                    <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 space-y-2 mt-2 animate-in fade-in">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Select sections to weave this skill into (freely select / deselect):
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {PLACEMENT_OPTIONS.map(opt => {
                          const currentSelected = selectedPlacements[currentQ.id] || [];
                          const isChecked = currentSelected.includes(opt.id) || currentSelected.includes(opt.label);
                          return (
                            <label 
                              key={opt.id}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePlacement(currentQ.id, opt.label)}
                                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className="truncate">{opt.label}</span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="pt-1.5 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlacements(prev => ({ ...prev, [currentQ.id]: [] }));
                            setAnswers(prev => ({ ...prev, [currentQ.id]: "Don't add" }));
                          }}
                          className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                        >
                          Deselect all
                        </button>

                        <button
                          type="button"
                          onClick={() => recordPlacementDecision(currentQ.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" /> Confirm & Continue
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Current Decision Summary Badge */}
                  {answers[currentQ.id] && (
                    <div className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium ${
                      answers[currentQ.id] === "Don't add"
                        ? "text-slate-600 bg-slate-100 border border-slate-200"
                        : "text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold"
                    }`}>
                      {answers[currentQ.id] === "Don't add" ? (
                        <>
                          <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>Excluded: Will not be claimed on CV.</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Target: {answers[currentQ.id]}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Question Navigation Controls without redundant Next button */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    {questions.map((q, idx) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          setCurrentQuestionIndex(idx);
                          setShowPlacementMenu(false);
                        }}
                        className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                          idx === currentQuestionIndex
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                            : answers[q.id]
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Single LLM Compile Button */}
                    <button
                      type="button"
                      onClick={() => handleGenerateAll()}
                      disabled={isGenerating || answeredCount === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Compiling CV with LLM...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-1">
                <Sparkles className="w-5 h-5 mx-auto text-slate-300" />
                <p>Upload your CV and click Analyze above to start clarification questions.</p>
              </div>
            )}
          </div>

        </div>

        {/* ========================================================= */}
        {/* RIGHT HALF: 50% Screen "Preview" Container                */}
        {/* ========================================================= */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" /> Preview
            </h2>
            {tailoredResult && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                Green Highlighting = Newly Added
              </span>
            )}
          </div>

          {/* Full Height PDF Preview Iframe */}
          <div className="w-full h-[760px] rounded-xl border border-slate-200 bg-slate-100 overflow-hidden relative shadow-inner">
            {previewPdfUrl ? (
              <iframe
                key={pdfRefreshKey}
                src={`${previewPdfUrl}#toolbar=0&navpanes=0&view=FitH`}
                title="Preview"
                className="w-full h-full border-none"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                <FileText className="w-12 h-12 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No Resume Loaded Yet</p>
                <p className="text-xs text-slate-400 max-w-[240px]">
                  Upload your CV on the left to see the live document appear here.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
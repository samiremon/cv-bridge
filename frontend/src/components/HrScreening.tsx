import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Award, 
  Sparkles, 
  Filter, 
  ArrowLeft, 
  CheckCircle2, 
  FileText, 
  X, 
  Loader2, 
  AlertCircle,
  Mail,
  Send,
  Calendar,
  Clock,
  Video,
  MapPin,
  RotateCcw,
  Check
} from 'lucide-react';
import { screenCandidates, sendCandidateEmail, CandidateScorecard } from '../api';

interface HrScreeningProps {
  onBackToOverview?: () => void;
}

type EmailModalType = 'invitation' | 'rejection';

interface EmailModalState {
  isOpen: boolean;
  type: EmailModalType;
  candidate: CandidateScorecard | null;
  to: string;
  subject: string;
  interviewDate: string;
  interviewTime: string;
  mode: 'Online' | 'Offline';
  meetingLink: string;
  address: string;
  emailBody: string;
}

const DEFAULT_COMPANY = "CV-Bridge Ltd.";
const DEFAULT_SIGN_OFF = "Best regards,\nHiring Team, CV-Bridge Ltd.";

export const HrScreening: React.FC<HrScreeningProps> = ({ onBackToOverview }) => {
  // Form State
  const [jd, setJd] = useState('');
  const [minExp, setMinExp] = useState('');
  const [minCgpa, setMinCgpa] = useState('');
  const [degreeReq, setDegreeReq] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  
  // Resumes Upload State
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API Interaction State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalEvaluated, setTotalEvaluated] = useState<number | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sent Emails Tracker: candidateId -> 'invitation' | 'rejection'
  const [sentEmails, setSentEmails] = useState<Record<number, 'invitation' | 'rejection'>>({});

  // Email Modal State
  const [emailModal, setEmailModal] = useState<EmailModalState>({
    isOpen: false,
    type: 'invitation',
    candidate: null,
    to: '',
    subject: '',
    interviewDate: '',
    interviewTime: '14:00',
    mode: 'Online',
    meetingLink: 'https://meet.google.com/cv-bridge-interview',
    address: 'CV-Bridge Ltd. HQ, Level 4, Silicon Tower, Tech City',
    emailBody: ''
  });

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Candidates List (Initially empty, populated after AI screening)
  const [candidates, setCandidates] = useState<CandidateScorecard[]>([]);

  // Helper: Build Invitation Email Template
  const buildInvitationTemplate = (
    candidateName: string,
    date: string,
    time: string,
    mode: 'Online' | 'Offline',
    link: string,
    addr: string
  ): string => {
    const locationInfo = mode === 'Online'
      ? `• Meeting Link: ${link || 'https://meet.google.com/cv-bridge-interview'}`
      : `• Office Location: ${addr || 'CV-Bridge Ltd. HQ, Level 4, Silicon Tower, Tech City'}`;

    const formattedTime = date ? `${date}${time ? ` at ${time}` : ''}` : 'to be scheduled';

    return `Dear ${candidateName || 'Candidate'},

Thank you for your interest in joining ${DEFAULT_COMPANY}. Following our initial review of your qualifications, we are pleased to invite you for an interview.

Interview Details:
• Date & Time: ${formattedTime}
• Format: ${mode}
${locationInfo}

Please reply to this email to confirm your attendance. If you have any scheduling conflicts, let us know as soon as possible so we can find an alternative slot.

${DEFAULT_SIGN_OFF}`;
  };

  // Helper: Build Rejection Email Template
  const buildRejectionTemplate = (candidateName: string): string => {
    return `Dear ${candidateName || 'Candidate'},

Thank you for taking the time to apply to ${DEFAULT_COMPANY} and for your interest in our team.

After careful review, we regret to inform you that we will not be moving forward with your application for this specific role, as we are prioritizing candidates whose current qualifications more closely match our immediate requirements.

We encourage you to keep a look in our career page for future opportunities that match your background. We sincerely appreciate your time and wish you the very best in your job search and career endeavors.

${DEFAULT_SIGN_OFF}`;
  };

  // Open Modal for Candidate
  const handleOpenEmailModal = (candidate: CandidateScorecard, type: EmailModalType) => {
    const today = new Date();
    // Default interview date to 3 days from now
    today.setDate(today.getDate() + 3);
    const defaultDate = today.toISOString().split('T')[0];
    const defaultTime = "14:00";
    const defaultMode: 'Online' | 'Offline' = 'Online';
    const defaultLink = "https://meet.google.com/cv-bridge-interview";
    const defaultAddr = "CV-Bridge Ltd. HQ, Level 4, Silicon Tower, Tech City";

    let subject = '';
    let body = '';

    if (type === 'invitation') {
      subject = `Interview Invitation: Next Steps with ${DEFAULT_COMPANY}`;
      body = buildInvitationTemplate(
        candidate.name,
        defaultDate,
        defaultTime,
        defaultMode,
        defaultLink,
        defaultAddr
      );
    } else {
      subject = `Application Update - ${DEFAULT_COMPANY}`;
      body = buildRejectionTemplate(candidate.name);
    }

    setEmailModal({
      isOpen: true,
      type,
      candidate,
      to: candidate.email || '',
      subject,
      interviewDate: defaultDate,
      interviewTime: defaultTime,
      mode: defaultMode,
      meetingLink: defaultLink,
      address: defaultAddr,
      emailBody: body
    });
  };

  // Dynamically update invitation email template when interview fields change
  const handleUpdateInterviewField = (
    field: 'interviewDate' | 'interviewTime' | 'mode' | 'meetingLink' | 'address',
    value: string
  ) => {
    setEmailModal((prev) => {
      const updated = { ...prev, [field]: value };
      if (prev.type === 'invitation' && prev.candidate) {
        updated.emailBody = buildInvitationTemplate(
          prev.candidate.name,
          field === 'interviewDate' ? value : prev.interviewDate,
          field === 'interviewTime' ? value : prev.interviewTime,
          field === 'mode' ? (value as 'Online' | 'Offline') : prev.mode,
          field === 'meetingLink' ? value : prev.meetingLink,
          field === 'address' ? value : prev.address
        );
      }
      return updated;
    });
  };

  // Reset template content to default
  const handleResetTemplate = () => {
    if (!emailModal.candidate) return;
    if (emailModal.type === 'invitation') {
      setEmailModal((prev) => ({
        ...prev,
        emailBody: buildInvitationTemplate(
          prev.candidate!.name,
          prev.interviewDate,
          prev.interviewTime,
          prev.mode,
          prev.meetingLink,
          prev.address
        )
      }));
    } else {
      setEmailModal((prev) => ({
        ...prev,
        emailBody: buildRejectionTemplate(prev.candidate!.name)
      }));
    }
  };

  // Send Email Action
  const handleSendEmail = async () => {
    if (!emailModal.to.trim()) {
      setEmailError("Please provide a recipient email address in the 'To:' field.");
      return;
    }

    setEmailError(null);
    setIsSendingEmail(true);

    try {
      await sendCandidateEmail({
        to: emailModal.to.trim(),
        subject: emailModal.subject.trim(),
        body: emailModal.emailBody
      });

      if (emailModal.candidate) {
        setSentEmails((prev) => ({
          ...prev,
          [emailModal.candidate!.id]: emailModal.type
        }));
      }

      const recipient = emailModal.to;
      const typeLabel = emailModal.type === 'invitation' ? 'Interview Invitation' : 'Rejection Email';
      
      setEmailModal((prev) => ({ ...prev, isOpen: false }));
      setToastMessage(`${typeLabel} successfully delivered to ${recipient}!`);

      setTimeout(() => {
        setToastMessage(null);
      }, 5000);
    } catch (err: any) {
      setEmailError(err.message || "Failed to deliver email. Please check your SMTP settings in .env.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleScreenCandidates = async () => {
    if (!jd.trim()) {
      setError("Please provide a target Job Description.");
      return;
    }
    if (files.length === 0) {
      setError("Please attach at least one candidate resume file (.pdf, .docx, or .txt).");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await screenCandidates({
        resumes: files,
        jobDescription: jd,
        minExperienceYears: minExp.trim() || undefined,
        minCgpa: minCgpa.trim() || undefined,
        requiredDegree: degreeReq.trim() || undefined,
        customInstructions: customInstructions.trim() || undefined,
      });

      setCandidates(response.candidates);
      setTotalEvaluated(response.total_evaluated);
    } catch (err: any) {
      setError(err.message || "Failed to screen candidates. Please check server logs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-top-4 duration-200 border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
              HR Candidate Ranker & Communication
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Upload applicant resumes, set your job description and filters, review candidate rankings, and directly dispatch interview invitations or rejection updates.
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

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setError(null)}
            className="p-1 hover:bg-rose-100 rounded text-rose-600 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Criteria & Upload Form */}
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
              Target Job Description <span className="text-rose-500">*</span>
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
                  placeholder="e.g. 2.0"
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
                  placeholder="e.g. 3.50"
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
                placeholder="e.g. BSc in Computer Science"
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
              placeholder="e.g. Prioritize candidates with microservices and Docker..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all resize-none placeholder-slate-400"
            />
          </div>

          {/* Upload Resumes */}
          <div className="pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Applicant Resumes <span className="text-rose-500">*</span>
            </label>
            
            <input 
              type="file"
              ref={fileInputRef}
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-slate-300 hover:border-purple-400 bg-slate-50/70 p-4 rounded-xl text-center cursor-pointer transition-all hover:bg-purple-50/20"
            >
              <Upload className="w-5 h-5 mx-auto text-purple-600 mb-1" />
              <p className="text-xs font-semibold text-slate-800">
                {files.length > 0 ? `${files.length} Resume${files.length > 1 ? 's' : ''} Selected` : 'Click to Upload Resumes'}
              </p>
              <span className="text-[11px] text-slate-500 block">
                Supports multiple PDF, DOCX, or TXT files
              </span>
            </div>

            {/* List of Attached Files */}
            {files.length > 0 && (
              <div className="mt-2.5 max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {files.map((file, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-1.5 truncate max-w-[80%]">
                      <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate text-slate-700 font-medium">{file.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(idx);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Action */}
          <button 
            onClick={handleScreenCandidates}
            disabled={isLoading || files.length === 0 || !jd.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating & Ranking Candidates...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> 
                <span>Rank Candidates</span>
              </>
            )}
          </button>
        </div>

        {/* Right 2 Columns: Candidate Leaderboard */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" /> Ranked Candidates
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Sorted by AI evaluation score</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
              {totalEvaluated !== null 
                ? `${totalEvaluated} Applicants Evaluated` 
                : candidates.length > 0 
                  ? `${candidates.length} Applicants Displayed` 
                  : 'Awaiting Evaluation'}
            </span>
          </div>

          {/* Candidate Cards / State Handling */}
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-800">Evaluating & Ranking Candidates...</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Auditing resumes against job description and hard criteria thresholds...
              </p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-20 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Award className="w-6 h-6 text-purple-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">No Candidate Rankings Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Attach candidate resumes on the left, set your job description and filters, and click &ldquo;Rank Candidates&rdquo; to invoke the AI recruiter agent.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
            {candidates.map((c, idx) => {
              const sentStatus = sentEmails[c.id];

              return (
                <div
                  key={c.id || idx}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-white flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Rank, Info & Score */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                            {c.email && (
                              <span className="text-xs text-slate-400 font-normal">
                                ({c.email})
                              </span>
                            )}
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
                            {c.degree} • <strong className="text-slate-700 font-semibold">{c.experience} exp</strong> • CGPA {c.cgpa}
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

                    {/* Summary */}
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {c.summary}
                    </p>

                    {/* Strengths */}
                    {c.strengths && c.strengths.length > 0 && (
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
                    )}
                  </div>

                  {/* Candidate Action Buttons (Interview Invitation & Rejection) */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Green Button: Send Interview Invitation */}
                      <button
                        onClick={() => handleOpenEmailModal(c, 'invitation')}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send Interview Invitation</span>
                      </button>

                      {/* Red Button: Send Rejection Email */}
                      <button
                        onClick={() => handleOpenEmailModal(c, 'rejection')}
                        className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Send Rejection Email</span>
                      </button>
                    </div>

                    {/* Sent Confirmation Badge */}
                    {sentStatus && (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        sentStatus === 'invitation'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <Check className="w-3 h-3" />
                        {sentStatus === 'invitation' ? 'Invitation Sent' : 'Rejection Sent'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* Email Dispatch Modal Popup */}
      {/* ===================================================================== */}
      {emailModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className={`p-4 sm:p-5 flex items-center justify-between border-b ${
              emailModal.type === 'invitation' 
                ? 'bg-emerald-50/70 border-emerald-100 text-emerald-950' 
                : 'bg-rose-50/70 border-rose-100 text-rose-950'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  emailModal.type === 'invitation'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}>
                  {emailModal.type === 'invitation' ? <Mail className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {emailModal.type === 'invitation' ? 'Send Interview Invitation' : 'Send Formal Rejection Email'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Candidate: <strong className="text-slate-800">{emailModal.candidate?.name}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEmailModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form Fields */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Modal Error Alert */}
              {emailError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{emailError}</span>
                  </div>
                  <button 
                    onClick={() => setEmailError(null)}
                    className="p-1 hover:bg-rose-100 rounded text-rose-600 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* To: Field (Extracted from LLM response) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  To (Candidate Email)
                </label>
                <input
                  type="email"
                  value={emailModal.to}
                  onChange={(e) => setEmailModal((prev) => ({ ...prev, to: e.target.value }))}
                  placeholder="candidate@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white font-medium"
                />
              </div>

              {/* Subject Line */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailModal.subject}
                  onChange={(e) => setEmailModal((prev) => ({ ...prev, subject: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white font-medium"
                />
              </div>

              {/* Interview Invitation Specific Fields */}
              {emailModal.type === 'invitation' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                    Interview Logistics
                  </span>

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        <span>Interview Date</span>
                      </label>
                      <input
                        type="date"
                        value={emailModal.interviewDate}
                        onChange={(e) => handleUpdateInterviewField('interviewDate', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        <span>Interview Time</span>
                      </label>
                      <input
                        type="time"
                        value={emailModal.interviewTime}
                        onChange={(e) => handleUpdateInterviewField('interviewTime', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Mode: Online vs Offline */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
                      Interview Mode
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateInterviewField('mode', 'Online')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          emailModal.mode === 'Online'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Online (Virtual)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateInterviewField('mode', 'Offline')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          emailModal.mode === 'Offline'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Offline (In-Person)</span>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Mode Detail: Link or Address */}
                  {emailModal.mode === 'Online' ? (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-purple-600" />
                        <span>Meeting Link</span>
                      </label>
                      <input
                        type="text"
                        value={emailModal.meetingLink}
                        onChange={(e) => handleUpdateInterviewField('meetingLink', e.target.value)}
                        placeholder="e.g. https://meet.google.com/xyz-abcd-efg"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-600" />
                        <span>Office Address</span>
                      </label>
                      <input
                        type="text"
                        value={emailModal.address}
                        onChange={(e) => handleUpdateInterviewField('address', e.target.value)}
                        placeholder="e.g. Level 4, Silicon Tower, Tech City"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Email Body Template (Dynamically Updated & Fully Editable) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Email Message Body (Editable)
                  </label>
                  <button
                    type="button"
                    onClick={handleResetTemplate}
                    className="inline-flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-700 font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Template</span>
                  </button>
                </div>
                <textarea
                  rows={9}
                  value={emailModal.emailBody}
                  onChange={(e) => setEmailModal((prev) => ({ ...prev, emailBody: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono leading-relaxed focus:outline-none focus:border-purple-500 focus:bg-white transition-all resize-y"
                />
                <p className="text-[11px] text-slate-400">
                  {emailModal.type === 'invitation' 
                    ? "Template updates automatically when interview logistics are adjusted above."
                    : "Formally informs the candidate to keep an eye on our career page for future opportunities."}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEmailModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  emailModal.type === 'invitation'
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                    : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                }`}
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {emailModal.type === 'invitation' ? 'Send Invitation Email' : 'Send Rejection Email'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
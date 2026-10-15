const API_BASE_URL = 'http://localhost:8000';

export interface ClarificationQuestion {
  id: number;
  skill: string;
  question: string;
  answered: boolean;
}

export interface AnalyzeResponse {
  session_id: string;
  status: 'requires_clarification' | 'completed';
  parsed_profile: {
    name: string;
    extracted_skills: string[];
    total_years_exp: number;
  };
  identified_gaps: string[];
  clarification_questions: ClarificationQuestion[];
}

export interface TailoredCVResponse {
  session_id: string;
  match_score: number;
  tailored_cv: {
    headline: string;
    summary: string;
    skills: string[];
    tailored_experience: Array<{
      role: string;
      company: string;
      bullet_points: string[];
    }>;
  };
  truth_guarantee: {
    hallucinations_detected: number;
    verified_claims_count: number;
  };
}

// 1. Send Resume File + Job Description + Optional Custom Instructions to FastAPI
export async function analyzeResume(
  file: File,
  jobDescription: string,
  customInstructions?: string
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append('resume', file);
  formData.append('job_description', jobDescription);
  if (customInstructions) {
    formData.append('custom_instructions', customInstructions);
  }

  const res = await fetch(`${API_BASE_URL}/api/tailor/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail?.error || 'Failed to analyze resume');
  }

  return res.json();
}

// 2. Submit candidate HITL clarification answer
export async function submitClarification(
  sessionId: string,
  questionId: number,
  answer: string
) {
  const res = await fetch(`${API_BASE_URL}/api/tailor/verify-clarification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      question_id: questionId,
      answer: answer,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to verify clarification');
  }

  return res.json();
}

// 3. Generate final truthful ATS CV (invokes LLM once with all answers)
export async function generateTailoredCV(
  sessionId: string,
  answers?: Record<string, string>
): Promise<TailoredCVResponse> {
  const res = await fetch(`${API_BASE_URL}/api/tailor/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      session_id: sessionId,
      answers: answers 
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to generate tailored CV');
  }

  return res.json();
}

// 4. Batch HR Candidate Screening & Ranking
export interface CandidateScorecard {
  id: number;
  name: string;
  email?: string;
  score: number;
  experience: string;
  degree: string;
  cgpa: string;
  status: 'Matched' | 'Under Review' | 'Disqualified';
  summary: string;
  strengths: string[];
}

export interface HRScreeningResponse {
  total_evaluated: number;
  candidates: CandidateScorecard[];
}

export interface ScreenCandidatesParams {
  resumes: File[];
  jobDescription: string;
  minExperienceYears?: string;
  minCgpa?: string;
  requiredDegree?: string;
  customInstructions?: string;
}

export async function screenCandidates(
  params: ScreenCandidatesParams
): Promise<HRScreeningResponse> {
  const formData = new FormData();
  params.resumes.forEach((file) => {
    formData.append('resumes', file);
  });
  formData.append('job_description', params.jobDescription);
  if (params.minExperienceYears) {
    formData.append('min_experience_years', params.minExperienceYears);
  }
  if (params.minCgpa) {
    formData.append('min_cgpa', params.minCgpa);
  }
  if (params.requiredDegree) {
    formData.append('required_degree', params.requiredDegree);
  }
  if (params.customInstructions) {
    formData.append('custom_instructions', params.customInstructions);
  }

  const res = await fetch(`${API_BASE_URL}/api/hr/screen`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to screen candidates');
  }

  return res.json();
}

export interface SendCandidateEmailParams {
  to: string;
  subject: string;
  body: string;
}

export interface SendCandidateEmailResponse {
  success: boolean;
  message: string;
  recipient: string;
}

export async function sendCandidateEmail(
  params: SendCandidateEmailParams
): Promise<SendCandidateEmailResponse> {
  const res = await fetch(`${API_BASE_URL}/api/hr/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to dispatch email');
  }

  return res.json();
}
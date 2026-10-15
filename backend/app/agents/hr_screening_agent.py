import os
from datetime import date
from typing import Dict, List, Optional
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

from ..schemas.hr import BatchHRScreeningLLMOutput, HRScreeningResponse

# Ensure environment variables are loaded
load_dotenv()

# Initialize Gemini Model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.2,
    google_api_key=os.getenv("GEMINI_API_KEY", "")
)

# Enforce structured output schema
structured_llm = llm.with_structured_output(BatchHRScreeningLLMOutput)


def screen_and_rank_candidates(
    resumes_text: Dict[str, str],
    job_description: str,
    min_experience_years: Optional[str] = None,
    min_cgpa: Optional[str] = None,
    required_degree: Optional[str] = None,
    custom_instructions: Optional[str] = None
) -> HRScreeningResponse:
    """
    Evaluates and ranks a batch of candidate resumes against a Job Description and filtering thresholds.
    Automatically injects today's date as context for calculating accurate candidate experience.
    
    :param resumes_text: Dict mapping candidate filename/identifier to extracted raw text.
    :param job_description: Target job description text.
    :param min_experience_years: Optional minimum years of experience requirement.
    :param min_cgpa: Optional minimum CGPA cutoff.
    :param required_degree: Optional required degree title.
    :param custom_instructions: Optional recruiter notes/guidance.
    :return: HRScreeningResponse containing candidate scorecards ranked from highest to lowest score.
    """
    today_date = date.today().strftime("%B %d, %Y")  # e.g., October 15, 2026
    today_iso = date.today().isoformat()             # e.g., 2026-10-15
    
    # 1. Format applicant resumes into a clean numbered prompt block
    formatted_resumes = ""
    for idx, (filename, text) in enumerate(resumes_text.items(), start=1):
        formatted_resumes += f"\n--- CANDIDATE RESUME #{idx} (Filename: {filename}) ---\n"
        formatted_resumes += f"{text.strip()}\n"

    # 2. Format hard threshold constraints
    thresholds_str = ""
    if min_experience_years:
        thresholds_str += f"- Minimum Experience Required: {min_experience_years} years\n"
    if min_cgpa:
        thresholds_str += f"- Minimum CGPA Cutoff: {min_cgpa}\n"
    if required_degree:
        thresholds_str += f"- Required Academic Degree: {required_degree}\n"
    
    if not thresholds_str:
        thresholds_str = "No hard filter thresholds specified."

    # 3. Construct System & User Prompt
    prompt = f"""
You are an expert HR Recruiter and Technical Talent Acquisition Agent evaluating a batch of candidate resumes against a target job description.

=== TARGET JOB DESCRIPTION ===
{job_description}

=== CURRENT REAL-WORLD DATE (EXPERIENCE ANCHOR) ===
Today's Date: {today_date} ({today_iso})
Use "{today_date}" ({today_iso}) as the current end date whenever a position states "Present", "Current", "Now", "Till date", or has an ongoing status.

=== HARD THRESHOLDS & FILTERS ===
{thresholds_str}

=== CUSTOM RECRUITER INSTRUCTIONS ===
{custom_instructions if custom_instructions else "None provided."}

=== APPLICANT RESUMES BATCH ===
{formatted_resumes}

=== EVALUATION INSTRUCTIONS ===
1. Extract candidate contact info (Full Name and Email) directly from each CV.
2. Experience Calculation & Audit Rules:
   - Use "{today_date}" ({today_iso}) as the exact end date whenever a job role states "Present", "Current", "Now", or is ongoing.
   - For each role, calculate duration based on start and end dates (e.g., from role start date up to {today_date} for current roles).
   - Account for all professional work experience. If roles overlap concurrently, do NOT double-count overlapping months.
   - Express candidate experience cleanly in the 'experience' field (e.g., '3.8 yrs', '2.0 yrs', or '0 yrs / Fresh Graduate').
   - Calculate total years of experience, highest degree title, and CGPA (if stated; otherwise return 'N/A').
3. Evaluate candidates strictly against hard thresholds:
   - Compare the candidate's calculated experience against Minimum Experience Required:
     * If candidate has less experience than required, assign status "Disqualified" and penalize the score out of 100. Explicitly mention the experience gap in the summary (e.g., "Has 1.5 yrs experience, failing the 3.0 yrs minimum requirement").
     * If candidate has lower CGPA than minimum cutoff or missing required degree, assign status "Disqualified" and penalize score out of 100.
     * If candidate meets all core criteria and thresholds, assign status "Matched", give a score out of 100.
     * If candidate is borderline or missing secondary requirements, assign status "Under Review", give a score out of 100.
4. Provide 2-3 key strength highlights (e.g., 'Docker & Microservices', '3.82 CGPA', 'Exceeds min experience').
5. Output concise, objective 2-sentence rationale for every candidate in 'summary'.
6. Order the candidates strictly by calculated score descending (Rank 1 = highest score). Assign sequential integer IDs starting from 1.
"""

    # 4. Invoke Structured LLM
    result: BatchHRScreeningLLMOutput = structured_llm.invoke(prompt)

    return HRScreeningResponse(
        total_evaluated=len(result.candidates),
        candidates=result.candidates
    )
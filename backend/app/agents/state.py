from typing import List, Dict, Any, Optional
from typing_extensions import TypedDict
from pydantic import BaseModel, Field

# =====================================================================
# 1. Pydantic Output Schemas (For Structured LLM Responses)
# =====================================================================

class SkillGapItem(BaseModel):
    id: int = Field(description="Unique incremental question ID")
    jd_requirement: str = Field(description="Specific skill or technology required in the Job Description")
    cv_evidence: str = Field(description="Related evidence found in candidate CV, or 'None'")
    question: str = Field(description="Targeted clarification question to ask the candidate")

class GapAnalysisResult(BaseModel):
    exact_matches: List[str] = Field(default_factory=list, description="Skills present in both candidate CV and target JD")
    missing_skills: List[str] = Field(default_factory=list, description="Skills required by JD but clearly missing in CV")
    clarification_questions: List[SkillGapItem] = Field(default_factory=list, description="Targeted questions for partial or ambiguous skill matches")

class ExperienceItem(BaseModel):
    company: str = Field(description="Company or Organization name")
    role: str = Field(description="Job title or role")
    duration: str = Field(description="Employment duration/dates (e.g., Aug 2025 - Present)")
    location: Optional[str] = Field(default=None, description="Location if present in original CV")
    bullets: List[str] = Field(description="Action-driven impact bullet points tailored to the target role")

class EducationItem(BaseModel):
    institution: str = Field(description="University / College / School name")
    degree: str = Field(description="Degree name and major")
    duration: Optional[str] = Field(default=None, description="Dates or graduation year")
    details: Optional[str] = Field(default=None, description="GPA, honors, or key coursework if present")

class ProjectItem(BaseModel):
    title: str = Field(description="Project name")
    technologies: Optional[str] = Field(default=None, description="Key technologies used")
    bullets: List[str] = Field(description="Description bullet points")

class TailoredCVOutput(BaseModel):
    name: str = Field(description="Candidate's full name from original CV")
    contact_info: Dict[str, str] = Field(default_factory=dict, description="Contact details: email, phone, linkedin, github, location, portfolio")
    headline: str = Field(description="A professional, ATS-optimized headline tailored to the target role")
    summary: str = Field(description="Tailored professional summary focusing strictly on verified candidate strengths")
    skills_by_category: Dict[str, List[str]] = Field(default_factory=dict, description="Categorized skills e.g. Languages & Frameworks, Agentic & AI, Cloud & Databases, Tools")
    experience: List[ExperienceItem] = Field(default_factory=list, description="All experience positions from original CV with tailored bullets")
    projects: List[ProjectItem] = Field(default_factory=list, description="All relevant technical projects from original CV")
    education: List[EducationItem] = Field(default_factory=list, description="Education history from original CV")
    certifications: List[str] = Field(default_factory=list, description="Certifications and licenses from original CV")


# =====================================================================
# 2. LangGraph Shared State Schema
# =====================================================================

class CVTailorState(TypedDict):
    raw_cv_text: str                     # Original extracted resume text
    raw_cv_bytes: Optional[bytes]        # Original PDF bytes for overlay preservation
    original_filename: Optional[str]     # Original uploaded filename
    job_description: str                 # Target role requirements
    custom_instructions: Optional[str]   # Additional AI guidance provided by candidate
    sanitized_cv: str                    # Resume text after guardrail sanitization
    is_safe: bool                        # Flag indicating if text passed prompt injection checks
    safety_flags: List[str]              # List of detected security violations (if any)
    gap_analysis: Optional[Dict[str, Any]] # Result from Gap Auditor Agent
    user_answers: Dict[int, str]         # Verified answers submitted by candidate {question_id: answer}
    awaiting_human_input: bool           # True when graph is paused at HITL breakpoint
    tailored_cv: Optional[Dict[str, Any]]# Final compiled resume output
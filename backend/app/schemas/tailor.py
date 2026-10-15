from enum import Enum
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field


class ExportFormat(str, Enum):
    """Supported export formats for the tailored resume."""
    pdf = "pdf"
    json = "json"


class ClarificationQuestionItem(BaseModel):
    """A human-in-the-loop clarification question for an identified skill gap."""
    id: int = Field(
        ...,
        description="Unique question identifier.",
        example=1
    )
    skill: str = Field(
        ...,
        description="Target skill or qualification requirement from the Job Description.",
        example="Redis & Distributed Caching"
    )
    question: str = Field(
        ...,
        description="Clarification question to verify if the candidate possesses this skill.",
        example="Do you have experience working with Redis or distributed caching in production?"
    )
    answered: bool = Field(
        False,
        description="Status flag indicating if the question has already been answered.",
        example=False
    )


class ParsedProfile(BaseModel):
    """Summary profile extracted during initial CV parsing and gap audit."""
    name: str = Field(
        ...,
        description="Candidate name extracted from CV filename or header.",
        example="Samir Yeasir Emon"
    )
    extracted_skills: List[str] = Field(
        default_factory=list,
        description="Skills identified in both candidate CV and the target JD (exact matches).",
        example=["Python", "FastAPI", "Docker", "PostgreSQL", "Git"]
    )
    total_years_exp: float = Field(
        3.0,
        description="Estimated total years of professional experience.",
        example=3.0
    )


class AnalyzeResumeResponse(BaseModel):
    """Response returned after CV screening and initial gap audit."""
    session_id: str = Field(
        ...,
        description="Unique session UUID used for stateful resume tailoring operations.",
        example="3fa85f64-5717-4562-b3fc-2c963f66afa6"
    )
    status: str = Field(
        ...,
        description="Current state of the workflow ('requires_clarification' or 'completed').",
        example="requires_clarification"
    )
    parsed_profile: ParsedProfile = Field(
        ...,
        description="Extracted candidate profile summary."
    )
    identified_gaps: List[str] = Field(
        default_factory=list,
        description="List of skills required by JD that are missing in the original CV.",
        example=["Redis", "LangGraph", "Kubernetes", "Celery"]
    )
    clarification_questions: List[ClarificationQuestionItem] = Field(
        default_factory=list,
        description="List of clarification questions to present to candidate for verification."
    )


class VerifyClarificationRequest(BaseModel):
    """Request payload to record candidate answer for a single clarification question."""
    session_id: str = Field(
        ...,
        description="Active session UUID returned by /analyze.",
        example="3fa85f64-5717-4562-b3fc-2c963f66afa6"
    )
    question_id: int = Field(
        ...,
        description="Numeric ID of the clarification question being answered.",
        example=1
    )
    answer: str = Field(
        ...,
        description="Candidate's placement directive for the skill (e.g. 'Add in skills, Add in experience', 'Add in summary', 'Don't add').",
        example="Add in skills, Add in experience"
    )


class VerifyClarificationResponse(BaseModel):
    """Confirmation response after recording a single clarification answer."""
    session_id: str = Field(
        ...,
        description="Active session UUID.",
        example="3fa85f64-5717-4562-b3fc-2c963f66afa6"
    )
    question_id: int = Field(
        ...,
        description="ID of the answered question.",
        example=1
    )
    verified: bool = Field(
        True,
        description="Verification confirmation status.",
        example=True
    )
    message: str = Field(
        "Answer recorded",
        description="Status message.",
        example="Answer recorded"
    )


class BatchClarificationsRequest(BaseModel):
    """Request payload to submit multiple clarification answers at once."""
    session_id: str = Field(
        ...,
        description="Active session UUID returned by /analyze.",
        example="3fa85f64-5717-4562-b3fc-2c963f66afa6"
    )
    answers: Dict[str, str] = Field(
        ...,
        description="Dictionary mapping question IDs (as strings) to placement answers.",
        example={
            "1": "Add in skills, Add in experience",
            "2": "Add in projects",
            "3": "Don't add"
        }
    )


class BatchClarificationsResponse(BaseModel):
    """Confirmation response after recording batch clarification answers."""
    session_id: str = Field(
        ...,
        description="Active session UUID.",
        example="3fa85f64-5717-4562-b3fc-2c963f66afa6"
    )
    verified: bool = Field(
        True,
        description="Batch verification status.",
        example=True
    )
    count: int = Field(
        ...,
        description="Number of recorded clarification decisions.",
        example=3
    )


class GenerateCVRequest(BaseModel):
    """Request payload to trigger final ATS resume compilation with the LLM."""
    session_id: str = Field(
        ...,
        description="Active session UUID returned by /analyze.",
        example="3fa85f64-5717-4562-b3fc-2c963f66afa6"
    )
    answers: Optional[Dict[str, str]] = Field(
        None,
        description="Optional additional or override answers before compilation.",
        example={
            "1": "Add in skills, Add in experience",
            "2": "Add in projects"
        }
    )


class TailoredCVDetails(BaseModel):
    """Comprehensive structured data model of the tailored ATS resume."""
    name: str = Field(
        "Candidate",
        description="Candidate's full name preserved from original CV.",
        example="Samir Yeasir Emon"
    )
    contact_info: Dict[str, str] = Field(
        default_factory=dict,
        description="Contact information dictionary (email, phone, linkedin, github, location).",
        example={
            "email": "samir@example.com",
            "phone": "+1 (555) 019-2834",
            "linkedin": "linkedin.com/in/samiremon",
            "github": "github.com/samiremon",
            "location": "Dhaka, Bangladesh"
        }
    )
    headline: str = Field(
        "Software Engineer",
        description="ATS-aligned professional headline tailored to the target role.",
        example="Senior Backend & AI Systems Engineer"
    )
    summary: str = Field(
        ...,
        description="Professional summary tailored strictly with candidate-verified claims.",
        example="Results-driven Senior Backend Engineer with 4+ years of expertise designing resilient microservices with FastAPI, Redis, and agentic AI architectures."
    )
    skills: List[str] = Field(
        default_factory=list,
        description="Consolidated list of core technical skills.",
        example=["Python", "FastAPI", "LangGraph", "Docker", "PostgreSQL", "Redis", "Kubernetes"]
    )
    skills_by_category: Dict[str, List[str]] = Field(
        default_factory=dict,
        description="Skills categorized by technical domain.",
        example={
            "Languages & Frameworks": ["Python", "TypeScript", "FastAPI", "React", "Node.js"],
            "AI & Agentic Systems": ["LangGraph", "Google Gemini", "LangChain", "Vector Databases"],
            "Cloud & DevOps": ["Docker", "Kubernetes", "AWS", "GitHub Actions", "CI/CD"],
            "Databases & Storage": ["PostgreSQL", "Redis", "MongoDB"]
        }
    )
    tailored_experience: List[Any] = Field(
        default_factory=list,
        description="Work experience entries with tailored impact bullet points.",
        example=[
            {
                "company": "Tech Innovations Inc.",
                "role": "Senior Backend Engineer",
                "duration": "Jan 2023 - Present",
                "location": "Remote",
                "bullets": [
                    "Architected high-throughput microservices using FastAPI, Redis, and PostgreSQL handling 10k RPS.",
                    "Orchestrated container deployments with Docker and Kubernetes CI/CD pipelines."
                ]
            }
        ]
    )
    projects: List[Any] = Field(
        default_factory=list,
        description="Technical projects with integrated technologies.",
        example=[
            {
                "title": "Autonomous Agentic RAG Platform",
                "technologies": "FastAPI, LangGraph, ChromaDB, Gemini 3.8",
                "bullets": [
                    "Engineered multi-agent pipeline using LangGraph for document analysis and legal research.",
                    "Implemented distributed caching with Redis, reducing query latency by 65%."
                ]
            }
        ]
    )
    education: List[Any] = Field(
        default_factory=list,
        description="Education history preserved from original resume.",
        example=[
            {
                "institution": "University of Technology",
                "degree": "B.S. in Computer Science",
                "duration": "2018 - 2022",
                "details": "First Class Honors, Major in Distributed Systems"
            }
        ]
    )
    certifications: List[str] = Field(
        default_factory=list,
        description="Certifications and credentials preserved from original CV.",
        example=["CKA: Certified Kubernetes Administrator", "AWS Certified Solutions Architect"]
    )


class TruthGuaranteeDetails(BaseModel):
    """Metrics ensuring honesty and anti-hallucination compliance."""
    hallucinations_detected: int = Field(
        0,
        description="Number of fabricated or unverified claims intercepted.",
        example=0
    )
    verified_claims_count: int = Field(
        ...,
        description="Total count of candidate-verified skill assertions integrated into the resume.",
        example=3
    )


class GenerateCVResponse(BaseModel):
    """Response returned upon successful ATS CV tailoring."""
    session_id: str = Field(
        ...,
        description="Active session UUID.",
        example="3fa85f64-5717-4562-b3fc-2c963f66afa6"
    )
    match_score: int = Field(
        ...,
        description="Calculated ATS alignment match score (0-100%).",
        example=92
    )
    tailored_cv: TailoredCVDetails = Field(
        ...,
        description="The tailored resume structured data."
    )
    truth_guarantee: TruthGuaranteeDetails = Field(
        ...,
        description="Truth guarantee audit stats."
    )

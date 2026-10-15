from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class CandidateStatus(str, Enum):
    MATCHED = "Matched"
    UNDER_REVIEW = "Under Review"
    DISQUALIFIED = "Disqualified"


class CandidateScorecard(BaseModel):
    id: int = Field(
        description="Sequential index identifier starting from 1 based on ranking position",
        examples=[1]
    )
    name: str = Field(
        description="Full candidate name extracted from the uploaded CV",
        examples=["Samin Mahmud"]
    )
    email: Optional[str] = Field(
        default=None,
        description="Extracted candidate email address from CV (or None if not found)",
        examples=["samin.mahmud@example.com"]
    )
    score: int = Field(
        description="Calculated overall fit score out of 100",
        ge=0,
        le=100,
        examples=[96]
    )
    experience: str = Field(
        description="Formatted total experience string (e.g. '3.5 yrs' or 'Fresh Graduate')",
        examples=["3.5 yrs"]
    )
    degree: str = Field(
        description="Highest academic degree title extracted from CV (e.g. 'BSc in CSE')",
        examples=["BSc in CSE"]
    )
    cgpa: str = Field(
        description="Extracted CGPA string (e.g. '3.82' or 'N/A' if not listed)",
        examples=["3.82"]
    )
    status: CandidateStatus = Field(
        description="Recruitment status: 'Matched' if meets/exceeds criteria, 'Under Review' if borderline, 'Disqualified' if misses hard thresholds",
        examples=[CandidateStatus.MATCHED]
    )
    summary: str = Field(
        description="Concise 2-sentence rationale summarizing evaluation, threshold compliance, and fit against JD",
        examples=[
            "Strongest match. Exceeds experience requirement (3.5 yrs vs 2 yrs) with 3.82 CGPA, and has production microservices and Docker expertise."
        ]
    )
    strengths: List[str] = Field(
        default_factory=list,
        description="Key matched skills, threshold passes, or notable achievements displayed as highlight tags",
        examples=[["Docker & Microservices", "3.82 CGPA", "Clean Architecture"]]
    )


class BatchHRScreeningLLMOutput(BaseModel):
    candidates: List[CandidateScorecard] = Field(
        description="Complete list of all evaluated candidate scorecards, sorted strictly by score descending (Rank 1 first)"
    )


class HRScreeningResponse(BaseModel):
    total_evaluated: int = Field(
        description="Total count of successfully parsed and ranked candidates",
        examples=[4]
    )
    candidates: List[CandidateScorecard]


class SendCandidateEmailRequest(BaseModel):
    to: str = Field(
        ...,
        description="Recipient candidate email address",
        examples=["candidate@example.com"]
    )
    subject: str = Field(
        ...,
        description="Email subject line",
        examples=["Interview Invitation: Next Steps with CV-Bridge Ltd."]
    )
    body: str = Field(
        ...,
        description="Plain text email body content",
        examples=["Dear Candidate,\n\nWe are pleased to invite you for an interview..."]
    )


class SendCandidateEmailResponse(BaseModel):
    success: bool = Field(True, description="Delivery status flag")
    message: str = Field("Email dispatched successfully", description="Status message")
    recipient: str = Field(..., description="Recipient email address")
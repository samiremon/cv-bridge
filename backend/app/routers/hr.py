from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from ..agents.hr_screening_agent import screen_and_rank_candidates
from ..schemas.hr import (
    HRScreeningResponse,
    SendCandidateEmailRequest,
    SendCandidateEmailResponse
)
from ..utils.text_extractor import extract_text_and_bytes
from ..utils.email_sender import send_email_smtp

router = APIRouter(prefix="/api/hr", tags=["HR Screening & Candidate Ranking"])


@router.post("/screen", response_model=HRScreeningResponse)
async def screen_candidates_endpoint(
    job_description: str = Form(..., description="Target Job Description text"),
    min_experience_years: Optional[str] = Form(None),
    min_cgpa: Optional[str] = Form(None),
    required_degree: Optional[str] = Form(None),
    custom_instructions: Optional[str] = Form(None),
    resumes: list[UploadFile] = File(..., description="Upload multiple candidate resume files (.pdf, .docx, or .txt)")
) -> HRScreeningResponse:
    if not resumes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one candidate resume file must be uploaded."
        )

    resumes_text: dict[str, str] = {}
    skipped_files: list[str] = []

    for file in resumes:
        text, _bytes, filename = await extract_text_and_bytes(file)
        if text and text.strip():
            resumes_text[filename] = text
        else:
            skipped_files.append(filename)

    if not resumes_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract readable text from any uploaded resume files."
        )

    return screen_and_rank_candidates(
        resumes_text=resumes_text,
        job_description=job_description,
        min_experience_years=min_experience_years,
        min_cgpa=min_cgpa,
        required_degree=required_degree,
        custom_instructions=custom_instructions
    )


@router.post(
    "/send-email",
    response_model=SendCandidateEmailResponse,
    status_code=status.HTTP_200_OK,
    summary="Dispatch Candidate Notification Email",
    description="Sends an interview invitation or formal rejection email directly to the candidate via configured Gmail SMTP."
)
async def send_candidate_email_endpoint(payload: SendCandidateEmailRequest) -> SendCandidateEmailResponse:
    try:
        send_email_smtp(
            to_email=payload.to,
            subject=payload.subject,
            body=payload.body
        )
        return SendCandidateEmailResponse(
            success=True,
            message=f"Email successfully dispatched to {payload.to}",
            recipient=payload.to
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deliver email: {str(e)}"
        )
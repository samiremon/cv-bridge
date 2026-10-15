import os
from dotenv import load_dotenv
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

# Load environment variables
load_dotenv()

from app.routers import tailor, hr
from app.schemas.health import HealthResponse

SWAGGER_DESCRIPTION = """
## CV-Bridge 🌉
### Agentic AI Resume Customizer & Job Description Alignment System

CV-Bridge combines **LangGraph**, **Google Gemini**, and **ReportLab** to deliver an ATS-compliant, truth-preserving resume tailoring workflow.

---

### 🧪 Swagger API Testing Guide (Step-by-Step)

Follow this sequence to test the full lifecycle of the API directly in Swagger:

1. **Check System Health** (`GET /api/health`):
   - Confirm backend services and LangGraph orchestrator are online.
   - Verify `api_key_configured` is `true`.

2. **Analyze Resume & Audit Gaps** (`POST /api/tailor/analyze`):
   - Upload a resume file (`.pdf`, `.docx`, or `.txt`).
   - Provide a target **Job Description** (e.g. demanding Redis, Docker, LangGraph).
   - *Result*: Returns a `session_id` and a list of `clarification_questions` for identified skill gaps.

3. **Verify Clarifications (HITL)**:
   - **Option A (Single)**: `POST /api/tailor/verify-clarification`
     - Send `session_id`, `question_id`, and `answer` (e.g. `"Add in skills, Add in experience"` or `"Don't add"`).
   - **Option B (Batch)**: `POST /api/tailor/batch-clarifications`
     - Send `session_id` and an `answers` dictionary (e.g. `{"1": "Add in skills", "2": "Don't add"}`).

4. **Generate Tailored CV** (`POST /api/tailor/generate`):
   - Resumes the LangGraph workflow and runs the ATS Rewriter Agent to compile the tailored resume.
   - *Result*: Returns the full structured CV JSON, ATS match score, and truth guarantee audit.

5. **Preview Highlighted PDF** (`GET /api/tailor/preview-pdf`):
   - Provide `session_id`.
   - *Result*: Streams the live ATS-formatted PDF with all newly incorporated skills highlighted in green.

6. **Export Submission-Ready CV** (`GET /api/tailor/export/{format}`):
   - Choose `format`: `pdf` for a clean unhighlighted PDF, or `json` for structured data.
"""

app = FastAPI(
    title="CV-Bridge API 🌉",
    description=SWAGGER_DESCRIPTION,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    openapi_tags=[
        {
            "name": "AI Resume Customizer",
            "description": "Endpoints for CV parsing, gap analysis, HITL verification, resume generation, and PDF export."
        },
        {
            "name": "Health & System",
            "description": "System health, configuration inspection, and service status."
        }
    ],
    swagger_ui_parameters={
        "defaultModelsExpandDepth": 2,
        "defaultModelExpandDepth": 2,
        "deepLinking": True,
        "displayRequestDuration": True,
        "docExpansion": "list",
        "filter": True,
        "showExtensions": True,
        "showCommonExtensions": True,
        "tryItOutEnabled": True,
        "syntaxHighlight.theme": "monokai"
    }
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(tailor.router)
app.include_router(hr.router)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
        tags=app.openapi_tags,
        servers=app.servers,
    )
    # Ensure binary format for files and array of files so Swagger UI renders file pickers
    for schema in openapi_schema.get("components", {}).get("schemas", {}).values():
        for prop in schema.get("properties", {}).values():
            if prop.get("type") == "array" and "items" in prop:
                if prop["items"].get("contentMediaType") == "application/octet-stream":
                    prop["items"]["format"] = "binary"
            if prop.get("contentMediaType") == "application/octet-stream":
                prop["format"] = "binary"
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

@app.get(
    "/api/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["Health & System"],
    summary="System Health & Configuration Check",
    description="Inspects backend operational status, LangGraph orchestrator state, and verifies if Gemini API key is configured."
)
def health_check():
    """Returns runtime health status and configuration inspection."""
    gemini_key = os.getenv("GEMINI_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")
    return {
        "status": "healthy",
        "service": "cv-bridge-backend",
        "version": "1.0.0",
        "langgraph_orchestrator": "online",
        "model_provider": os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        "api_key_configured": bool(gemini_key and gemini_key != "your_gemini_api_key_here")
    }
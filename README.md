# CV Bridge 🌉

> **Multi-Agent AI Career & Hiring Platform**  
> *Intelligent AI Agents Connecting Talent with Opportunity*

[![YouTube Demo](https://img.shields.io/badge/YouTube-Watch%20Demo-red?style=for-the-badge&logo=youtube)](https://youtu.be/BfkqsXHdyUY?si=0gPZSObO-tHMXosJ)

---

## 📺 Project Demo Video

Watch the complete walkthrough and live demonstration on YouTube:

[![CV Bridge Video Walkthrough](https://img.shields.io/badge/▶%20Watch%20Full%20Demo%20on%20YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/BfkqsXHdyUY?si=0gPZSObO-tHMXosJ)

**Direct Link:** [https://youtu.be/BfkqsXHdyUY?si=0gPZSObO-tHMXosJ](https://youtu.be/BfkqsXHdyUY?si=0gPZSObO-tHMXosJ)

---

## 💡 Overview

**CV Bridge** is an intelligent, multi-agent AI career and recruitment ecosystem designed to eliminate friction between candidates and employers. Rather than fabricating false experience or blindly keyword-stuffing resumes, CV Bridge uses **Human-in-the-Loop (HITL) agentic workflows** to bridge skill gaps truthfully, rank job applicants with transparent scoring, and conduct real-time voice mock interviews.

CV Bridge brings together three production-grade AI tools in a unified interface:

1. **📄 AI Resume Customizer & ATS Alignment**: Tailors resumes to job descriptions through verified human clarifications and compiles ATS-optimized PDFs with visual keyword diffs.
2. **👥 AI HR Screening & Candidate Ranker**: Multi-resume batch evaluator that ranks applicants (0–100), applies strict threshold filters, and dispatches automated candidate email notifications.
3. **🎙️ AI Voice Mock Interviewer**: Low-latency, full-duplex conversational mock interviewer ("Alex") powered by Groq Whisper STT, Edge TTS neural speech synthesis, and role-adaptive Gemini evaluation scorecards.

---

## 🌟 Core Features

### 1. 📄 AI Resume Customizer & ATS Alignment
- **Split 50/50 Workspace**: Interactive inputs and clarification controls on the left side, side-by-side with a real-time reactive PDF document preview on the right.
- **LangGraph Agentic Pipeline**:
  - **🛡️ Guardrail Node**: Sanitizes and screens input resume and job description text against malicious prompt injection and system prompt manipulation attempts.
  - **🔍 Gap Analysis Node**: Identifies missing hard skills, certifications, and domain qualifications required by the job description.
  - **🤝 Human-in-the-Loop Clarification Node**: Generates targeted questions asking if the candidate possesses the identified missing skills.
  - **📍 Granular Placement Selection**: Candidates designate exactly where verified skills belong (`Summary`, `Skills`, `Experience`, or `Projects`).
  - **⚡ Single-Pass ATS Compilation**: Generates the final tailored resume in a single LLM pass grounded strictly in verified claims.
- **Dynamic ReportLab PDF Engine**:
  - **Visual Preview Mode**: Displays newly added and reinforced keywords highlighted in emerald green for immediate visual feedback.
  - **Clean Export Mode**: Exports standard, distraction-free ATS-friendly PDF documents ready for actual job applications.

---

### 2. 👥 AI HR Screening & Candidate Ranker
- **Batch Resume Intake**: Upload and parse multiple applicant resumes simultaneously (`.pdf`, `.docx`, `.txt`).
- **Objective Multi-Dimensional Scoring**: Evaluates each candidate on a 0–100 scale based on skill alignment, background relevance, and overall profile depth.
- **Hard Threshold Filters**: Enforces strict cutoffs:
  - Minimum years of industry experience
  - Minimum CGPA / academic degree cutoff
  - Mandatory certifications or degrees
- **Actionable Status Categorization**: Categorizes candidates into `Matched`, `Under Review`, or `Disqualified` with transparent rationale and listed strengths.
- **Integrated Email Dispatch**: Built-in SMTP client to send interview invitations or status updates directly to candidates with customizable templates.

---

### 3. 🎙️ AI Voice Mock Interviewer
- **Full-Duplex WebSocket Engine**: Ultra-responsive live audio communication over `/api/interview/ws/{session_id}`.
- **Groq Whisper STT (`whisper-large-v3`)**: Sub-second speech-to-text transcription with custom noise and hallucination filtering for low-energy background sounds.
- **Edge Neural TTS (`JennyNeural` / `GuyNeural`)**: Natural human-like speech synthesis streamed directly back to the client as Base64 MP3 chunks.
- **Role-Adaptive Questioning**: Automatically adapts questions, evaluation depth, and interviewer persona across technical and non-technical roles (e.g., Software Engineering, Nursing, Teaching, Sales, Product Management).
- **Voice-First Spoken Constraints**: Enforces conversational brevity (1–3 spoken sentences, maximum 40 words, no markdown or asterisks read aloud).
- **Candidate Barge-In / Interruption**: Candidate voice input or UI interrupt instantly silences the interviewer's audio playback.
- **Comprehensive Scorecard Report**: At the end of the session, Gemini compiles an executive performance summary, overall score (0–100), hiring verdict (`Strong Hire`, `Recommended`, `Needs Preparation`, `Not Ready`), category breakdown, strengths, and actionable feedback.

---

## 🏗️ System Architecture

```
                                  ┌───────────────────────────────┐
                                  │      Client Web Browser       │
                                  │   React 18 + Vite + Tailwind  │
                                  └───────────────┬───────────────┘
                                                  │
                       ┌──────────────────────────┴──────────────────────────┐
                       │ REST APIs & WebSocket (Port 8000)                   │
                       ▼                                                     ▼
    ┌──────────────────────────────────────┐              ┌──────────────────────────────────────┐
    │       FastAPI Application Core       │              │        Duplex Voice Gateway          │
    │   - /api/tailor/*                    │              │   - /api/interview/ws/{session_id}   │
    │   - /api/hr/*                        │              │   - /api/interview/scorecard         │
    └──────────────────┬───────────────────┘              └──────────────────┬───────────────────┘
                       │                                                     │
         ┌─────────────┴─────────────┐                         ┌─────────────┴─────────────┐
         ▼                           ▼                         ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  LangGraph State │       │   HR Screening   │       │   Groq Whisper   │       │  Microsoft Edge  │
│  Machine (HITL)  │       │  Ranker & SMTP   │       │  Speech-to-Text  │       │    Neural TTS    │
│  Gemini Flash    │       │  Email Sender    │       │ (whisper-large-v3│       │  (Jenny / Guy)   │
└────────┬─────────┘       └──────────────────┘       └──────────────────┘       └──────────────────┘
         │
         ▼
┌──────────────────┐
│ ReportLab Engine │
│ (ATS PDF + Diffs)│
└──────────────────┘
```

---

## 🛠️ Technology Stack

| Domain | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Backend Framework** | FastAPI, Python 3.11, Uvicorn, WebSockets |
| **Agentic AI & Orchestration** | LangGraph, LangChain, Google Gemini (`gemini-flash-latest`), Pydantic v2 |
| **Speech & Audio** | Groq API (`whisper-large-v3`), Microsoft Edge TTS (`edge-tts`), MediaRecorder API |
| **Document Processing** | ReportLab (PDF rendering), pypdf, python-docx |
| **Communication & Email** | Python `smtplib` (SSL/TLS SMTP delivery) |
| **DevOps & Containerization** | Docker, Docker Compose |

---

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended) **OR** Python 3.11+ & Node.js 18+
- [Google AI Studio API Key](https://aistudio.google.com/) for Gemini
- [Groq API Key](https://console.groq.com/) for Whisper Speech-to-Text *(optional, required for voice interview)*

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/samiremon/cv-bridge.git
cd cv-bridge
```

---

### Step 2: Configure Environment Variables

Copy the sample environment file to create your local `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in your keys:

```env
# Google Gemini (Required)
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-latest

# Groq STT (Required for Voice Interviewer)
GROQ_API_KEY=your_groq_api_key_here

# SMTP Configuration (Optional, for HR Email Dispatch)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
FROM_EMAIL=your_email@gmail.com
```

---

### Step 3: Run with Docker Compose (Recommended)

Start both frontend and backend with a single command:

```bash
docker compose up --build
```

Services will be live at:
- **Frontend Web UI**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **FastAPI ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Backend Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### Alternative: Local Development Without Docker

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

---

## 🧪 Interactive API Testing Guide

The backend provides fully interactive OpenAPI documentation at `http://localhost:8000/docs`.

### 1. Resume Customizer Flow
1. **`GET /api/health`**: Confirm orchestrator status and verify `api_key_configured: true`.
2. **`POST /api/tailor/analyze`**: Submit resume file and target job description to trigger Guardrails and Gap Analysis.
3. **`POST /api/tailor/verify-clarification`**: Answer clarifying questions with section placement designations.
4. **`POST /api/tailor/generate`**: Compile the tailored resume grounded strictly in confirmed skills.
5. **`GET /api/tailor/preview-pdf?session_id={id}`**: Fetch the live PDF with highlighted keywords.
6. **`GET /api/tailor/export/pdf?session_id={id}`**: Download the finalized, clean ATS submission PDF.

### 2. HR Screening Flow
1. **`POST /api/hr/screen`**: Upload candidate resumes (`.pdf`, `.docx`, `.txt`) along with the target job description and optional filtering thresholds (min experience, min CGPA).
2. **`POST /api/hr/send-email`**: Send customized status or interview invitation emails to shortlisted candidates.

### 3. Voice Mock Interview Flow
1. **`WS /api/interview/ws/{session_id}`**: Open duplex WebSocket for audio chunk streaming and AI speech responses.
2. **`POST /api/interview/scorecard`**: Pass completed conversational history to generate the final performance report.

---

## 📁 Repository Structure

```
cv-bridge/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── cv_tailor_graph.py     # LangGraph Resume Customizer State Machine
│   │   │   ├── hr_screening_agent.py  # HR Candidate Ranker & Filtering Agent
│   │   │   └── interview_agent.py     # Voice Mock Interviewer & Scorecard Agent
│   │   ├── routers/
│   │   │   ├── tailor.py              # Resume customizer endpoints
│   │   │   ├── hr.py                  # HR screening endpoints
│   │   │   └── interview.py           # Voice WebSocket & scorecard endpoints
│   │   ├── schemas/
│   │   │   ├── tailor.py              # Pydantic models for tailoring
│   │   │   ├── hr.py                  # Pydantic models for HR screening
│   │   │   └── interview.py           # Pydantic models for voice interview
│   │   ├── utils/
│   │   │   ├── email_sender.py        # SMTP email dispatch utility
│   │   │   ├── pdf_generator.py       # ReportLab ATS PDF rendering engine
│   │   │   ├── stt.py                 # Groq Whisper Speech-to-Text service
│   │   │   ├── tts.py                 # Edge TTS Neural Speech service
│   │   │   └── text_extractor.py      # PDF, DOCX, and TXT parsing utility
│   │   └── main.py                    # FastAPI root application & CORS setup
│   ├── Dockerfile.dev                 # Backend Docker configuration
│   └── requirements.txt               # Python package dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CvTailor.tsx           # Split 50/50 resume customizer & PDF viewer
│   │   │   ├── HrScreening.tsx        # Multi-candidate ranking & email dispatch UI
│   │   │   ├── VoiceInterview.tsx     # Voice mock interview with live STT/TTS
│   │   │   └── FeatureOverview.tsx    # Landing hub for selecting features
│   │   ├── api.ts                     # API client integration functions
│   │   ├── App.tsx                    # Top navigation & active view router
│   │   └── index.css                  # Tailwind styles
│   ├── Dockerfile.dev                 # Frontend Docker configuration
│   ├── package.json                   # Node dependencies & scripts
│   └── vite.config.ts                 # Vite bundler configuration
├── docker-compose.yml                 # Orchestration for frontend & backend
├── .env.example                       # Template for environment configuration
├── .gitignore                         # Git ignored files & directories
└── README.md                          # Project documentation
```

---

## 🔒 Security & Guardrails

- **Zero Fabricated Claims**: Unlike standard generative prompts, the system strictly forbids adding skills unless verified by the candidate through the clarification step.
- **Prompt Injection Defense**: Input text is pre-screened to detect instruction overriding, jailbreak attempts, and system prompt leakage.
- **Credential Safety**: All API keys and email secrets are managed strictly through environment variables and never exposed to the client or committed to version control.

---

## 👤 Author

Developed by **Samir Yeasir Emon**  
- **GitHub**: [@samiremon](https://github.com/samiremon)  
- **Repository**: [samiremon/cv-bridge](https://github.com/samiremon/cv-bridge)  
- **Video Walkthrough**: [Watch on YouTube](https://youtu.be/BfkqsXHdyUY?si=0gPZSObO-tHMXosJ)

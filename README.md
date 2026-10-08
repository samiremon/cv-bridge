# CV Bridge 🌉

An Agentic AI Resume Customizer & Job Description Alignment System powered by **LangGraph**, **Google Gemini**, **FastAPI**, and **React**.

CV Bridge bridges the gap between your real skills and the job description requirements through **honest human-in-the-loop clarifications**—ensuring ATS alignment without fabricating false experience.

---

## 🌟 Key Features

- **Split 50/50 Workspace**: Interactive Inputs & Clarifications on the left; real-time PDF Preview on the right.
- **Agentic Workflow with LangGraph**:
  - **Guardrail Agent**: Sanitizes and screens raw CV and JD text against prompt injections.
  - **Gap Analyzer**: Analyzes missing hard skills, qualifications, and industry terminology against the JD.
  - **Human-in-the-Loop Clarification**: Generates up to 7 simple yes/no questions to ask the candidate if they actually possess the identified missing skills.
  - **Granular Section Placement**: Candidates choose exactly where verified skills belong (Summary, Skills, Experience, Projects).
  - **Single-Pass Compilation**: Tailors the CV in a single LLM invocation after all answers are collected.
- **ReportLab ATS PDF Engine**: Generates clean, standard ATS-friendly PDF documents.
- **Visual Keyword Highlighting**: In preview mode, newly incorporated keywords are highlighted in vibrant green for instant visual feedback. Download mode exports a clean, submission-ready PDF without highlighting.
- **Dockerized**: One command to spin up the entire frontend and backend stack.

---

## 🏗️ Architecture

```
User (Browser)
    │
    ▼
Frontend (React 18 + Vite + Tailwind CSS)
    │  (Port 3000)
    ▼
Backend (FastAPI + Python 3.11)
    │  (Port 8000)
    ├── LangGraph Agentic Pipeline
    │     ├── 1. Guardrail Node (Prompt Injection Screening)
    │     ├── 2. Gap Analysis Node (CV vs JD comparison)
    │     ├── 3. Human Clarification Stage (HITL Verification)
    │     └── 4. CV Tailoring Node (Gemini 3.8 Flash)
    └── ReportLab PDF Generator (Dynamic ATS Rendering & Highlighting)
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/samiremon/cv-bridge.git
cd cv-bridge
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Gemini API key:

```bash
cp .env.example .env
```

Edit `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
```

### 3. Run with Docker Compose

```bash
docker compose up --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📁 Project Structure

```
cv-bridge/
├── backend/
│   ├── app/
│   │   ├── agents/          # LangGraph state machine & agent nodes
│   │   ├── routers/         # FastAPI endpoints (/api/tailor/*)
│   │   ├── schemas/         # Pydantic data models
│   │   └── utils/           # ReportLab PDF generator & text guardrails
│   ├── Dockerfile.dev
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # CvTailor.tsx split layout & UI components
│   │   ├── api.ts           # Backend client integration
│   │   └── App.tsx          # Root application shell
│   ├── Dockerfile.dev
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 👤 Author

Developed by: **Samir Yeasir Emon**

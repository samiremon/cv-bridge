# CV-Bridge Backend API Specification

This document outlines the complete REST API endpoints required to support the **CV-Bridge** frontend. 
Designed for FastAPI with LangGraph multi-agent orchestration, human-in-the-loop verification, and memory checkpointers.

---

## Architecture Overview

```
Frontend (React + Vite)
      │
      ▼
FastAPI Gateway (`/api/...`)
      │
      ├── 1. Resume Customizer Agent (LangGraph + HITL Breakpoints)
      ├── 2. HR Candidate Ranker Agent (CRAG + Cross-Encoder Reranker)
      └── 3. Voice Mock Interviewer Agent (Stateful Checkpointer Memory)
```

---

## 1. AI Resume Customizer (`/api/tailor`)

### 1.1 Analyze Resume & Detect Skill Gaps
Extracts candidate experience from uploaded CV, compares against target Job Description, and generates clarification questions for unverified skills.

* **Endpoint:** `POST /api/tailor/analyze`
* **Content-Type:** `multipart/form-data`

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `resume` | `File` (PDF/DOCX/TXT) | Yes | Candidate's uploaded resume file |
| `job_description` | `string` | Yes | Target role requirements and responsibilities |
| `custom_instructions` | `string` | No | Custom instructions for the AI agent (e.g. emphasize full-stack architecture, keep bullets under 20 words) |

#### Response (`200 OK`)
```json
{
  "session_id": "c7a8b9e0-1234-4567-89ab-cdef01234567",
  "status": "requires_clarification",
  "parsed_profile": {
    "name": "Alex Johnson",
    "extracted_skills": ["React", "TypeScript", "Node.js", "PostgreSQL"],
    "total_years_exp": 3.0
  },
  "identified_gaps": ["Docker", "Kubernetes", "Redis"],
  "clarification_questions": [
    {
      "id": 1,
      "skill": "Docker",
      "question": "The target Job Description requires Docker containerization. Did you containerize services or write Dockerfiles in previous projects?",
      "answered": false
    },
    {
      "id": 2,
      "skill": "Redis",
      "question": "The employer lists Redis caching for high-load systems. Have you used in-memory stores like Redis or Memcached?",
      "answered": false
    }
  ]
}
```

---

### 1.2 Submit Clarification Answer (Human-in-the-Loop)
Submits verified candidate answers to LangGraph interrupt checkpoints.

* **Endpoint:** `POST /api/tailor/verify-clarification`
* **Content-Type:** `application/json`

#### Request Body
```json
{
  "session_id": "c7a8b9e0-1234-4567-89ab-cdef01234567",
  "question_id": 1,
  "answer": "Yes, configured Docker Compose for local microservices and deployed containers on AWS ECS."
}
```

#### Response (`200 OK`)
```json
{
  "session_id": "c7a8b9e0-1234-4567-89ab-cdef01234567",
  "question_id": 1,
  "verified": true,
  "message": "Answer verified and integrated into candidate experience graph",
  "remaining_unanswered": 1
}
```

---

### 1.3 Generate Customized Truthful CV
Compiles verified experiences and generates an ATS-optimized truthful resume.

* **Endpoint:** `POST /api/tailor/generate`
* **Content-Type:** `application/json`

#### Request Body
```json
{
  "session_id": "c7a8b9e0-1234-4567-89ab-cdef01234567"
}
```

#### Response (`200 OK`)
```json
{
  "session_id": "c7a8b9e0-1234-4567-89ab-cdef01234567",
  "match_score": 92,
  "tailored_cv": {
    "headline": "Full-Stack Software Engineer with Docker & Microservices Experience",
    "summary": "Proactive software engineer with 3+ years of experience...",
    "skills": ["React", "TypeScript", "Node.js", "Docker", "PostgreSQL", "Redis"],
    "tailored_experience": [
      {
        "role": "Software Engineer",
        "company": "NexaTech",
        "bullet_points": [
          "Architected scalable React frontends and integrated GraphQL microservices.",
          "Configured multi-container Docker environments to streamline local developer onboarding."
        ]
      }
    ]
  },
  "truth_guarantee": {
    "hallucinations_detected": 0,
    "verified_claims_count": 2
  }
}
```

---

### 1.4 Download Exported ATS Resume
Downloads the generated resume in PDF, DOCX, or JSON format.

* **Endpoint:** `GET /api/tailor/export/{format}?session_id={session_id}`
* **Path Parameter:** `format` (`pdf` | `docx` | `json`)
* **Response:** Binary file stream (`application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`)

---

## 2. HR Candidate Ranker (`/api/hr`)

### 2.1 Batch Evaluate & Rank Candidates
Ingests up to 10 applicant CVs, evaluates hard threshold criteria, performs Corrective RAG (CRAG) with cross-encoder reranking, and produces a 0–100 ranked leaderboard.

* **Endpoint:** `POST /api/hr/screen-and-rank`
* **Content-Type:** `multipart/form-data`

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `resumes` | `List[File]` | Yes | Up to 10 candidate resume files (PDF/DOCX) |
| `job_description` | `string` | Yes | Target job requirements & stack |
| `min_experience_years` | `float` | No | Minimum years of verifiable experience (e.g. 2.0) |
| `min_cgpa` | `float` | No | Minimum Bachelor CGPA cutoff (e.g. 3.50) |
| `required_degree` | `string` | No | Required degree qualification (e.g. "BSc in CSE") |
| `custom_instructions` | `string` | No | Custom instructions for the AI agent (e.g. prioritize startup experience, evaluate system design depth) |

#### Response (`200 OK`)
```json
{
  "batch_id": "hr-batch-908123",
  "total_evaluated": 4,
  "timestamp": "2026-10-08T16:20:00Z",
  "candidates": [
    {
      "id": 1,
      "rank": 1,
      "name": "Samin Mahmud",
      "score": 96,
      "status": "Matched",
      "experience": "3.5 yrs",
      "degree": "BSc in CSE",
      "cgpa": "3.82",
      "summary": "Strongest match. Exceeds experience requirement (3.5 yrs vs 2 yrs) with 3.82 CGPA, and has production microservices and Docker expertise.",
      "strengths": ["Docker & Microservices", "3.82 CGPA", "Clean Architecture"],
      "hard_filters_passed": true
    },
    {
      "id": 2,
      "rank": 2,
      "name": "Tanzim Hasan",
      "score": 87,
      "status": "Matched",
      "experience": "2.5 yrs",
      "degree": "BSc in Computer Science",
      "cgpa": "3.65",
      "summary": "Meets all criteria with 2.5 yrs experience and 3.65 CGPA. Demonstrates solid React & Node proficiency.",
      "strengths": ["Exceeds min experience", "React & Node.js", "3.65 CGPA"],
      "hard_filters_passed": true
    },
    {
      "id": 3,
      "rank": 3,
      "name": "Rahim Chowdhury",
      "score": 74,
      "status": "Under Review",
      "experience": "2.0 yrs",
      "degree": "BSc in CSE",
      "cgpa": "3.52",
      "summary": "Meets exact thresholds (2.0 yrs, 3.52 CGPA). Strong core algorithms but limited cloud deployment experience.",
      "strengths": ["Meets minimum thresholds", "Core Algorithms"],
      "hard_filters_passed": true
    },
    {
      "id": 4,
      "rank": 4,
      "name": "Zubair Ahmed",
      "score": 41,
      "status": "Disqualified",
      "experience": "1.0 yr",
      "degree": "BSc in EEE",
      "cgpa": "3.10",
      "summary": "Does not meet hard thresholds: 1.0 yr experience (min 2 yrs needed) and 3.10 CGPA (cutoff 3.50).",
      "strengths": ["Basic Scripting"],
      "hard_filters_passed": false
    }
  ]
}
```

---

## 3. Voice Mock Interviewer (`/api/interview`)

### 3.1 Start Mock Interview Session
Initializes the conversational state and LangGraph memory checkpointer for a new interview.

* **Endpoint:** `POST /api/interview/start`
* **Content-Type:** `application/json`

#### Request Body
```json
{
  "topics": "Full-Stack Development, React & System Design",
  "difficulty": "Mid-Level"
}
```

#### Response (`200 OK`)
```json
{
  "session_id": "int-77821-ab90",
  "initial_message": "Welcome! Today we will evaluate your skills in Full-Stack Development, React & System Design. Let's begin: Can you describe a challenging technical problem you solved recently?",
  "turn": 1
}
```

---

### 3.2 Conversational Turn (Speech-to-Speech Flow)
Receives the spoken candidate transcript from the browser SpeechRecognition API, passes to LangGraph agent with conversation memory, and returns the next AI question for browser SpeechSynthesis.

* **Endpoint:** `POST /api/interview/converse`
* **Content-Type:** `application/json`

#### Request Body
```json
{
  "session_id": "int-77821-ab90",
  "transcript": "At my previous job, our React application experienced slow page re-renders because global state was updating frequently. We refactored using selectors and localized state with Zustand."
}
```

#### Response (`200 OK`)
```json
{
  "session_id": "int-77821-ab90",
  "ai_response": "Great approach with Zustand selectors. How did you verify the re-render performance improvements, and what metrics did you monitor in production?",
  "turn": 2,
  "is_concluded": false
}
```

---

### 3.3 End Session & Generate Report
Concludes the mock interview session, flushes memory checkpoints, and outputs candidate performance metrics.

* **Endpoint:** `POST /api/interview/end`
* **Content-Type:** `application/json`

#### Request Body
```json
{
  "session_id": "int-77821-ab90"
}
```

#### Response (`200 OK`)
```json
{
  "session_id": "int-77821-ab90",
  "overall_score": 88,
  "summary": "Candidate demonstrated clear verbal articulation of React state patterns and production problem solving.",
  "strengths": [
    "Clear architectural explanations",
    "Practical state management experience (Zustand)"
  ],
  "areas_for_improvement": [
    "Mention automated performance regression testing metrics"
  ],
  "dialogue_history": [
    { "sender": "AI Interviewer", "text": "...", "timestamp": "10:00 AM" },
    { "sender": "You", "text": "...", "timestamp": "10:01 AM" }
  ]
}
```

---

## 4. System & Health Check

### 4.1 Service Health
* **Endpoint:** `GET /api/health`
* **Response (`200 OK`)**
```json
{
  "status": "healthy",
  "service": "cv-bridge-backend",
  "version": "1.0.0",
  "langgraph_orchestrator": "online",
  "model_provider": "gemini-1.5-pro / gemini-2.0-flash"
}
```

---

## Recommended Backend Stack

* **Framework:** FastAPI (Python 3.11+)
* **Agent Framework:** LangGraph (StateGraph, MemorySaver checkpointers, Breakpoints)
* **LLM Engine:** Google Gemini via `langchain-google-genai`
* **PDF / Document Processing:** `pypdf`, `pdfplumber`, `python-docx`
* **Reranking / Embeddings:** `sentence-transformers` or `cohere-rerank`
* **Observability:** LangSmith (`LANGCHAIN_TRACING_V2=true`)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import tailor

from dotenv import load_dotenv
import os

# Load variables from .env file into os.environ
load_dotenv()

app = FastAPI(
    title="CV-Bridge API",
    description="Backend Multi-Agent Engine for CV Tailoring, HR Screening, and Mock Interviews",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(tailor.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "cv-bridge-backend",
        "version": "1.0.0",
        "langgraph_orchestrator": "online",
        "model_provider": "gemini-1.5-flash"
    }
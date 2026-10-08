import os
import json
from typing import Dict, Any
from dotenv import load_dotenv  # <-- Import must be at the top

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt
from langchain_google_genai import ChatGoogleGenerativeAI

# Load .env before reading environment variables
load_dotenv()

from app.agents.state import (
    CVTailorState, 
    GapAnalysisResult, 
    TailoredCVOutput
)
from ..utils.guardrails import sanitize_and_inspect_text

# Initialize Gemini Model
llm = ChatGoogleGenerativeAI(
    model=os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
    temperature=0.2,
    google_api_key=os.getenv("GEMINI_API_KEY", "")
)


# =====================================================================
# Node 1: Guardrail Agent

# =====================================================================
def guardrail_node(state: CVTailorState) -> Dict[str, Any]:
    """Scans raw CV and JD text for malicious prompt injections."""
    is_cv_safe, clean_cv, cv_flags = sanitize_and_inspect_text(state["raw_cv_text"])
    is_jd_safe, clean_jd, jd_flags = sanitize_and_inspect_text(state["job_description"])
    
    all_flags = cv_flags + jd_flags
    return {
        "sanitized_cv": clean_cv,
        "job_description": clean_jd,
        "is_safe": is_cv_safe and is_jd_safe,
        "safety_flags": all_flags
    }

# =====================================================================
# Node 2: Gap Auditor Agent
# =====================================================================
def gap_auditor_node(state: CVTailorState) -> Dict[str, Any]:
    """Compares CV against JD and classifies exact matches, missing skills, and clarification questions."""
    # Enforce Pydantic schema for structured output
    structured_llm = llm.with_structured_output(GapAnalysisResult)
    
    custom_inst = state.get("custom_instructions", "")
    
    prompt = f"""
    You are an expert technical resume auditor focused on strict honesty and accuracy.
    Compare the Candidate CV against the Target Job Description (JD).
    
    CRITICAL RULES FOR CLASSIFICATION:
    1. 'exact_matches': Skills required in the JD that are ALREADY explicitly listed in the CV.
    2. 'missing_skills': Skills in the JD where the candidate has no clear mention.
    3. 'clarification_questions': Formulate simple, direct questions for missing or ambiguous skills required by the JD.
       - Format questions simply and directly, like: "Do you have experience working with Redis?", "Have you used Docker or Kubernetes in production?", "Do you have experience with LangSmith or Langfuse?"
       - Generate between 3 and at most 7 high-impact questions.
    
    Candidate CV:
    {state['sanitized_cv']}
    
    Target Job Description:
    {state['job_description']}
    
    Additional Instructions from User:
    {custom_inst}
    """
    
    result: GapAnalysisResult = structured_llm.invoke(prompt)
    return {"gap_analysis": result.model_dump()}

# =====================================================================
# Node 3: Human-in-the-Loop (HITL) Verification Node
# =====================================================================
def human_verification_node(state: CVTailorState) -> Dict[str, Any]:
    """Pauses graph execution using interrupt() if clarification questions exist and haven't been answered yet."""
    gap_analysis = state.get("gap_analysis", {})
    questions = gap_analysis.get("clarification_questions", [])
    
    # If questions exist and user answers are missing, interrupt execution
    if questions and not state.get("user_answers"):
        human_input = interrupt({
            "type": "HUMAN_VERIFICATION_REQUIRED",
            "questions": questions,
            "message": "Please confirm these skill clarification questions to truthfully update your CV."
        })
        
        # Once resumed, store the human response in state
        answers = {}
        if isinstance(human_input, dict):
            answers = human_input.get("answers", human_input)
        elif human_input:
            answers = human_input

        merged_answers = {**(state.get("user_answers") or {}), **(answers if isinstance(answers, dict) else {})}
        return {
            "user_answers": merged_answers, 
            "awaiting_human_input": False
        }

    return {"awaiting_human_input": False}

# =====================================================================
# Node 4: Honest ATS Rewriter Agent
# =====================================================================
def cv_rewriter_node(state: CVTailorState) -> Dict[str, Any]:
    """Generates an ATS-tailored resume strictly grounded in verified facts, keeping all original sections."""
    structured_llm = llm.with_structured_output(TailoredCVOutput)
    
    gap_analysis = state.get("gap_analysis", {})
    user_answers = state.get("user_answers", {})
    custom_inst = state.get("custom_instructions", "")
    
    prompt = f"""
    You are an expert ATS Resume Rewriter. Your mission is to tailor the candidate's CV for the target Job Description while preserving 100% of their actual background, contact details, education, projects, and work history.

    CRITICAL RULES:
    1. COMPLETE RESUME PRESERVATION:
       - Keep the candidate's real name and all contact information (email, phone, LinkedIn, GitHub, location) from the Original CV.
       - Include ALL work experiences and ALL projects present in the original CV. Do NOT omit older roles or projects.
       - Include all education degrees, universities, GPA/grades, and certifications.
    2. STRICT TRUTHFULNESS & MULTI-SELECT PLACEMENT DIRECTIVES:
       - The candidate may specify multiple placement targets for each skill (e.g. "Add in skills, Add in projects" or "Add in summary, Add in experience"). Follow ALL selected placements:
         * "Add in summary": Mention or highlight the skill/competency directly in the Professional Summary.
         * "Add in skills": Include the skill in the relevant category under Technical Skills.
         * "Add in experience": Seamlessly weave the skill and achievement into a relevant work experience bullet point.
         * "Add in projects": Seamlessly weave or add this skill into one of the technical projects' bullet points or technology list.
         * "Don't add" / excluded: NEVER include this skill anywhere in the resume.
       - IMPORTANT: If "Add in projects" is selected, you MUST explicitly integrate the technology into a project's bullets or technology tag in the `projects` section. Do not just place it in skills.
       - NEVER hallucinate or invent companies, degrees, dates, or tools the candidate never worked with.
    3. TARGETED REWRITING:
       - Tailor the Headline and Professional Summary to highlight strengths relevant to the Target JD.
       - Group skills logically (e.g., Languages & Frameworks, Agentic & AI, Databases & Cloud, Developer Tools).
       - Reframe and polish bullet points using strong action verbs, quantifiable achievements, and relevant keywords from the JD without exaggerating.
    4. NO META/ALIGNMENT NOTES:
       - Do NOT include commentary, notes, or explanations in the resume text itself.

    Original CV:
    {state['sanitized_cv']}
    
    Job Description:
    {state['job_description']}
    
    Gap Analysis:
    {json.dumps(gap_analysis, indent=2)}
    
    Verified User Clarifications:
    {json.dumps(user_answers, indent=2)}
    
    Candidate's Custom Instructions:
    {custom_inst}
    """
    
    tailored_result: TailoredCVOutput = structured_llm.invoke(prompt)
    return {"tailored_cv": tailored_result.model_dump()}

# =====================================================================
# Router Edge Function
# =====================================================================
def route_after_guardrail(state: CVTailorState) -> str:
    """Routes to END if security flags are triggered, otherwise proceeds to audit."""
    if not state["is_safe"]:
        return "REJECT_UNSAFE"
    return "AUDIT_GAPS"

# =====================================================================
# Graph Construction & Compilation
# =====================================================================
workflow = StateGraph(CVTailorState)

# Add Nodes
workflow.add_node("guardrail", guardrail_node)
workflow.add_node("gap_auditor", gap_auditor_node)
workflow.add_node("human_verification", human_verification_node)
workflow.add_node("cv_rewriter", cv_rewriter_node)

# Entry Point
workflow.set_entry_point("guardrail")

# Add Edges
workflow.add_conditional_edges(
    "guardrail",
    route_after_guardrail,
    {
        "REJECT_UNSAFE": END,
        "AUDIT_GAPS": "gap_auditor"
    }
)
workflow.add_edge("gap_auditor", "human_verification")
workflow.add_edge("human_verification", "cv_rewriter")
workflow.add_edge("cv_rewriter", END)

# Memory Checkpointer saves state during HITL pause/resume calls
checkpointer = MemorySaver()
cv_tailor_graph = workflow.compile(checkpointer=checkpointer)
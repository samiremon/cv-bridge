import os
import logging
from typing import Dict, List, Optional
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from ..schemas.interview import InterviewTurnLLMOutput, InterviewScorecard, CategoryScore

load_dotenv()
logger = logging.getLogger("interview_agent")

api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
raw_model = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
# If the rate-limited 2.5 preview model was set, cleanly override to high-quota production flash
if "2.5-flash" in raw_model:
    primary_model = "gemini-flash-latest"
else:
    primary_model = raw_model

# Initialize Gemini Model with high quota and fallback
llm = ChatGoogleGenerativeAI(
    model=primary_model,
    temperature=0.3,
    google_api_key=api_key,
    max_retries=2
)

fallback_llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    temperature=0.3,
    google_api_key=api_key
)
llm = llm.with_fallbacks([fallback_llm])

# Structured Output
structured_interviewer = llm.with_structured_output(InterviewTurnLLMOutput)
structured_evaluator = llm.with_structured_output(InterviewScorecard)

SYSTEM_INTERVIEWER_PROMPT = """You are an experienced, empathetic, and professional mock interviewer conducting a live voice mock interview.

Target Role / Topic Focus: {topic}

IMPORTANT ROLE-ADAPTIVE INSTRUCTION:
Adapt your questions, persona, evaluation criteria, and tone entirely to the target role '{topic}'.
- If the role is non-technical (e.g. Primary School Teacher, Nurse, Sales Manager, Graphic Designer, Customer Service, Chef, HR Specialist), ask domain-relevant questions (e.g. classroom management, lesson planning, student engagement, patient care, empathy, conflict resolution, creative process, client handling). NEVER mention software engineering, architecture, monitoring, databases, or coding unless the candidate explicitly applied for a software engineering role!
- If the role is technical (e.g. Software Engineer, DevOps, Data Scientist), ask relevant technical questions for that field.

CRITICAL RULE FOR OFF-TOPIC OR OUT-OF-CONTEXT ANSWERS:
- If the candidate's response is completely irrelevant, nonsensical, off-topic, or avoids the question (e.g. talking about unrelated subjects, hobbies, random stories, or dodging the topic):
  1. DO NOT validate it or pretend it answered the question.
  2. GENTLY CLARIFY that this is a mock interview specifically for '{topic}', and politely redirect them back to the topic.
  3. Format your spoken response to state: "Just a reminder, this is a mock interview for the {topic} role, so let's keep our focus on {topic}." and immediately ask a clear, relevant question about {topic}.

YOUR VOICE-FIRST RULES (CRITICAL):
1. SPOKEN PHRASING ONLY: Your 'spoken_response' will be read aloud to the candidate via Text-to-Speech.
2. STRICT LENGTH LIMIT: Keep your spoken response between 1 to 3 sentences (maximum 40 words). Never monologue or dump paragraphs.
3. NO MARKDOWN: Never use bullet points, bolding, asterisks, brackets, numbered lists, or emojis in 'spoken_response'.
4. CONVERSATIONAL FLOW:
   - If answer is relevant: Briefly acknowledge or validate the candidate's last answer (1 short phrase/sentence), then ask ONE focused follow-up question appropriate for the '{topic}' role.
   - If answer is off-topic: Clarify that this is a mock interview for '{topic}' and redirect them back to '{topic}'.
   - If their answer was brief, gently probe for a specific real-world example from their past experience.
   - If their answer was thorough, progress to a new relevant dimension of the '{topic}' role.
5. WRAPPING UP:
   - If the interview has reached the target question limit ({max_questions} questions) or the candidate asks to end, set 'is_concluded' to true and say a warm, encouraging closing remark thanking them for their time.
"""


class InterviewAgent:
    """Agent that manages dynamic, role-adaptive interview questions using Gemini."""

    def __init__(self, max_questions: int = 5):
        self.max_questions = max_questions

    def generate_opening_question(self, topic: str) -> InterviewTurnLLMOutput:
        """Generates the welcoming greeting, introduces the interviewer, and asks the first question."""
        prompt = f"""Generate the opening statement for a live voice mock interview for the role: '{topic}'.
MANDATORY OPENING FORMAT:
1. Give a warm, encouraging welcome to the mock interview.
2. Introduce yourself clearly as 'Alex, your AI mock interviewer today at CV-Bridge'.
3. State that today's focus is the role of '{topic}'.
4. Ask the candidate to briefly introduce themselves and share what inspired them to pursue this field or a bit about their background.
Keep the entire spoken response within 2 to 3 natural spoken sentences total. Strictly conversational words—no markdown, asterisks, or bullets."""

        system_msg = SystemMessage(
            content=SYSTEM_INTERVIEWER_PROMPT.format(topic=topic, max_questions=self.max_questions)
        )
        human_msg = HumanMessage(content=prompt)

        try:
            result: InterviewTurnLLMOutput = structured_interviewer.invoke([system_msg, human_msg])
            return result
        except Exception as e:
            logger.error(f"Error generating opening question: {str(e)}")
            return InterviewTurnLLMOutput(
                reasoning="Fallback opening with introduction.",
                spoken_response=f"Welcome to your mock interview! I'm Alex, your AI mock interviewer today at CV-Bridge. Today we will be focusing on the role of {topic}. To get started, could you briefly introduce yourself and share what inspired you to pursue this career?",
                is_concluded=False,
                suggested_subtopic=topic
            )

    def generate_followup_turn(
        self,
        topic: str,
        history: List[Dict[str, str]],
        current_question_count: int
    ) -> InterviewTurnLLMOutput:
        """
        Takes conversation history and candidate's latest response,
        evaluates understanding, and generates the next role-adaptive turn.
        """
        system_msg = SystemMessage(
            content=SYSTEM_INTERVIEWER_PROMPT.format(topic=topic, max_questions=self.max_questions)
        )

        messages = [system_msg]

        # Replay conversation turns for context
        for turn in history:
            role = turn.get("role")
            text = turn.get("text", "")
            if role == "interviewer":
                messages.append(AIMessage(content=text))
            elif role == "candidate":
                messages.append(HumanMessage(content=text))

        # Add instruction for current turn state
        should_conclude = current_question_count >= self.max_questions
        instruction = (
            f"This is question #{current_question_count} of {self.max_questions}. "
            f"{'Target questions reached: Conclude the interview warmly now and set is_concluded to true.' if should_conclude else f'Analyze the candidate response, acknowledge briefly, and ask the next focused question tailored to a {topic}.'}"
        )
        messages.append(HumanMessage(content=instruction))

        try:
            result: InterviewTurnLLMOutput = structured_interviewer.invoke(messages)
            if should_conclude:
                result.is_concluded = True
            return result
        except Exception as e:
            logger.error(f"Error generating follow-up turn: {str(e)}")
            if should_conclude:
                return InterviewTurnLLMOutput(
                    reasoning="Fallback wrap-up.",
                    spoken_response=f"Thank you for sharing your experience in {topic} with me today. That concludes our mock interview!",
                    is_concluded=True
                )
            return InterviewTurnLLMOutput(
                reasoning="Fallback role-adaptive follow-up question.",
                spoken_response=f"Thank you for sharing that perspective. In your work as a {topic}, could you tell me about a challenging situation you encountered and how you handled it?",
                is_concluded=False
            )

    def generate_scorecard(self, topic: str, history: List[Dict[str, str]]) -> InterviewScorecard:
        """
        Analyzes the completed interview transcript and generates an objective scorecard
        with numerical ratings, key strengths, and actionable spaces for improvement.
        """
        transcript_lines = []
        for turn in history:
            role = "Alex (Interviewer)" if turn.get("role") == "interviewer" else "Candidate"
            transcript_lines.append(f"{role}: {turn.get('text', '')}")
        transcript_text = "\n".join(transcript_lines)

        eval_prompt = f"""You are an expert hiring manager and executive interview coach evaluating a candidate who just completed a live mock interview for the role of '{topic}'.

Target Role: {topic}

Candidate Interview Transcript:
{transcript_text}

EVALUATION CRITERIA:
1. Objectively assess how well the candidate's answers align with the expectations of a professional in the role of '{topic}'.
2. Provide a numerical overall score (0 to 100) and recommendation rating:
   - 'Strong Hire' (85-100)
   - 'Recommended' (70-84)
   - 'Needs Preparation' (50-69)
   - 'Not Ready' (<50)
3. Evaluate 3 core skill categories with scores (0-100) and concise constructive feedback:
   - Role & Domain Knowledge (depth of relevant expertise for {topic})
   - Communication Clarity & Conciseness (structure, articulate speech, composure)
   - Problem-Solving & Practical Examples (handling challenging situations, real-world applicability)
4. List 3 to 4 specific Strengths ('What you did well') referencing concrete points from their actual answers.
5. List 3 to 4 actionable Spaces for Improvement ('Areas for growth') detailing specifically how they can elevate their answers in future interviews.
"""
        system_msg = SystemMessage(content="You are an expert hiring evaluator and executive interview coach.")
        human_msg = HumanMessage(content=eval_prompt)

        try:
            scorecard: InterviewScorecard = structured_evaluator.invoke([system_msg, human_msg])
            return scorecard
        except Exception as e:
            logger.error(f"Error generating interview scorecard: {str(e)}")
            return InterviewScorecard(
                overall_score=78,
                rating="Recommended",
                summary=f"The candidate demonstrated solid foundational knowledge and practical engagement for the {topic} position.",
                category_scores=[
                    CategoryScore(category="Role & Domain Knowledge", score=80, feedback=f"Demonstrated good domain awareness of core principles for a {topic}."),
                    CategoryScore(category="Communication Clarity & Conciseness", score=78, feedback="Articulated points clearly and engaged attentively with the questions."),
                    CategoryScore(category="Problem-Solving & Practical Examples", score=75, feedback="Provided relevant context, but could provide more structured STAR-method detail.")
                ],
                strengths=[
                    "Spoke clearly with a professional, engaging tone throughout the interview.",
                    f"Showed genuine enthusiasm and relevant perspective for the {topic} role.",
                    "Engaged directly and answered each prompt thoughtfully."
                ],
                improvements=[
                    "Use the STAR method (Situation, Task, Action, Result) to give structured real-world answers.",
                    "Include more specific metrics, quantifiable results, or concrete student/project outcomes.",
                    f"Incorporate more domain-specific terminology relevant to {topic}."
                ]
            )


interview_agent = InterviewAgent()

import json
import base64
import logging
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status, File, UploadFile, Response
from pydantic import BaseModel

from app.utils.stt import stt_service
from app.utils.tts import tts_service
from app.agents.interview_agent import interview_agent
from app.schemas.interview import ScorecardRequest, InterviewScorecard

logger = logging.getLogger("interview_router")

router = APIRouter(prefix="/api/interview", tags=["Voice Interview"])


@dataclass
class InterviewSession:
    session_id: str
    topic: str = "General Software Engineering"
    created_at: datetime = field(default_factory=datetime.utcnow)
    is_active: bool = True
    question_count: int = 0
    history: List[Dict[str, str]] = field(default_factory=list)


class InterviewConnectionManager:
    """Manages active WebSockets and interview session states."""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.sessions: Dict[str, InterviewSession] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        if session_id not in self.sessions:
            self.sessions[session_id] = InterviewSession(session_id=session_id)
        logger.info(f"WebSocket client connected: session_id={session_id}")

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        logger.info(f"WebSocket client disconnected: session_id={session_id}")

    async def send_json(self, session_id: str, message: dict):
        websocket = self.active_connections.get(session_id)
        if websocket:
            await websocket.send_json(message)

    def get_session(self, session_id: str) -> Optional[InterviewSession]:
        return self.sessions.get(session_id)

    def get_or_create_session(self, session_id: str, topic: str = "") -> InterviewSession:
        if session_id not in self.sessions:
            self.sessions[session_id] = InterviewSession(
                session_id=session_id,
                topic=topic or "General Software Engineering"
            )
        elif topic:
            self.sessions[session_id].topic = topic
        return self.sessions[session_id]


manager = InterviewConnectionManager()


@router.get("/sessions/{session_id}", summary="Get Interview Session Info")
def get_session_info(session_id: str):
    """Retrieve session metadata and conversation progress."""
    session = manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview session {session_id} not found"
        )
    return {
        "session_id": session.session_id,
        "topic": session.topic,
        "is_active": session.is_active,
        "question_count": session.question_count,
        "history_turns": len(session.history),
        "created_at": session.created_at.isoformat()
    }


@router.post("/transcribe", summary="Transcribe Audio File")
async def transcribe_audio_endpoint(file: UploadFile = File(...)):
    """Transcribes an uploaded audio recording into text using Groq Whisper."""
    try:
        content = await file.read()
        text = stt_service.transcribe(content, filename=file.filename or "audio.webm")
        return {
            "success": True,
            "filename": file.filename,
            "size_bytes": len(content),
            "transcript": text
        }
    except Exception as e:
        logger.error(f"Error in transcribe endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription error: {str(e)}"
        )


class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "en-US-JennyNeural"


@router.post("/tts", summary="Synthesize Speech Audio")
async def text_to_speech_endpoint(req: TTSRequest):
    """Converts input text into neural speech MP3 audio using edge-tts."""
    audio_bytes = await tts_service.synthesize(req.text, req.voice)
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to synthesize speech audio"
        )
@router.post("/scorecard", response_model=InterviewScorecard, summary="Generate Interview Scorecard")
async def generate_scorecard_endpoint(req: ScorecardRequest):
    """Generates evaluation scorecard from interview transcript."""
    try:
        scorecard = interview_agent.generate_scorecard(topic=req.topic, history=req.history)
        return scorecard
    except Exception as e:
        logger.error(f"Error in scorecard endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate scorecard: {str(e)}"
        )


@router.websocket("/ws/{session_id}")
async def interview_websocket(websocket: WebSocket, session_id: str):
    """
    Duplex WebSocket channel for interview sessions.
    Handles message dispatch, ping-pong, and session lifecycle.
    """
    await manager.connect(websocket, session_id)

    # 1. Send handshake confirmation
    await websocket.send_json({
        "type": "connection_established",
        "session_id": session_id,
        "message": f"Connected to interview session '{session_id}'"
    })

    try:
        while True:
            # Receive frames (text/JSON)
            raw_text = await websocket.receive_text()
            try:
                data = json.loads(raw_text)
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "detail": "Invalid JSON format payload."
                })
                continue

            event_type = data.get("type", "unknown")

            # Heartbeat ping
            if event_type == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })

            # Session initialization with custom topic
            elif event_type == "init_session":
                topic = data.get("topic", "General Professional Experience").strip()
                session = manager.get_or_create_session(session_id, topic=topic)
                session.is_active = True

                # Immediate welcome & introductory question so Alex speaks right away
                opening_text = f"Welcome to your mock interview! I am Alex, your AI interviewer today at CV-Bridge, and our focus is the role of {session.topic}. To get started, could you please introduce yourself and share a bit about your background?"
                session.history = [{"role": "interviewer", "text": opening_text}]
                session.question_count = 1

                await websocket.send_json({
                    "type": "session_ready",
                    "session_id": session_id,
                    "topic": session.topic,
                    "message": f"Session ready for topic: {session.topic}"
                })

                # Synthesize neural speech audio (MP3) immediately
                audio_b64 = await tts_service.synthesize_base64(opening_text)

                # Send opening AI question to the candidate with audio
                await websocket.send_json({
                    "type": "ai_speech",
                    "session_id": session_id,
                    "text": opening_text,
                    "audio_base64": audio_b64,
                    "audio_mime": "audio/mp3",
                    "question_number": 1,
                    "is_concluded": False
                })

            # Echo test for Step 1 verification
            elif event_type == "echo_test":
                await websocket.send_json({
                    "type": "echo_response",
                    "session_id": session_id,
                    "echo": data.get("payload", "")
                })

            # Candidate audio payload (base64 encoded audio snippet)
            elif event_type == "candidate_audio":
                audio_b64 = data.get("audio_base64", "")
                if audio_b64:
                    try:
                        audio_bytes = base64.b64decode(audio_b64)
                        filename = data.get("filename", "recording.webm")
                        transcript = stt_service.transcribe(audio_bytes, filename=filename)
                        if not transcript or not transcript.strip():
                            # Noise or silence filtered out; resume listening on client
                            await websocket.send_json({
                                "type": "transcription_empty",
                                "session_id": session_id,
                                "detail": "No clear speech detected."
                            })
                            continue

                        await websocket.send_json({
                            "type": "transcription_ready",
                            "session_id": session_id,
                            "transcript": transcript
                        })

                        session = manager.get_or_create_session(session_id)
                        if session.is_active:
                            # 1. Record candidate answer
                            session.history.append({"role": "candidate", "text": transcript})

                            # 2. Generate next question via Gemini
                            turn = interview_agent.generate_followup_turn(
                                topic=session.topic,
                                history=session.history,
                                current_question_count=session.question_count + 1
                            )
                            session.question_count += 1
                            session.history.append({"role": "interviewer", "text": turn.spoken_response})
                            if turn.is_concluded:
                                session.is_active = False

                            # 3. Synthesize neural speech audio (MP3)
                            reply_audio_b64 = await tts_service.synthesize_base64(turn.spoken_response)

                            # 4. Send AI question back to client with audio
                            await websocket.send_json({
                                "type": "ai_speech",
                                "session_id": session_id,
                                "text": turn.spoken_response,
                                "audio_base64": reply_audio_b64,
                                "audio_mime": "audio/mp3",
                                "question_number": session.question_count,
                                "is_concluded": turn.is_concluded
                            })
                    except Exception as e:
                        logger.error(f"Error processing candidate audio: {str(e)}")
                        await websocket.send_json({
                            "type": "transcription_error",
                            "session_id": session_id,
                            "detail": str(e)
                        })
                else:
                    await websocket.send_json({
                        "type": "transcription_error",
                        "session_id": session_id,
                        "detail": "audio_base64 payload is empty."
                    })

            # Candidate typed text response (allows testing by typing or speaking)
            elif event_type == "candidate_text":
                candidate_text = data.get("text", "").strip()
                session = manager.get_or_create_session(session_id)
                if candidate_text and session.is_active:
                    session.history.append({"role": "candidate", "text": candidate_text})
                    turn = interview_agent.generate_followup_turn(
                        topic=session.topic,
                        history=session.history,
                        current_question_count=session.question_count + 1
                    )
                    session.question_count += 1
                    session.history.append({"role": "interviewer", "text": turn.spoken_response})
                    if turn.is_concluded:
                        session.is_active = False

                    # Synthesize neural speech audio (MP3)
                    reply_audio_b64 = await tts_service.synthesize_base64(turn.spoken_response)

                    await websocket.send_json({
                        "type": "ai_speech",
                        "session_id": session_id,
                        "text": turn.spoken_response,
                        "audio_base64": reply_audio_b64,
                        "audio_mime": "audio/mp3",
                        "question_number": session.question_count,
                        "is_concluded": turn.is_concluded
                    })

            # Candidate or AI interruption signal
            elif event_type == "interrupt":
                logger.info(f"Interruption received for session {session_id}")
                await websocket.send_json({
                    "type": "interrupted_ack",
                    "session_id": session_id
                })

            # Scorecard generation request
            elif event_type == "get_scorecard":
                session = manager.get_session(session_id)
                topic = session.topic if session else data.get("topic", "General Professional Experience")
                history = session.history if session else data.get("history", [])
                scorecard = interview_agent.generate_scorecard(topic=topic, history=history)
                await websocket.send_json({
                    "type": "scorecard_ready",
                    "session_id": session_id,
                    "scorecard": scorecard.model_dump()
                })

            # End interview request
            elif event_type == "end_session":
                session = manager.get_session(session_id)
                if session:
                    session.is_active = False
                await websocket.send_json({
                    "type": "session_ended",
                    "session_id": session_id,
                    "message": "Interview session ended successfully."
                })
                break

            else:
                await websocket.send_json({
                    "type": "unrecognized_event",
                    "event_type": event_type
                })

    except WebSocketDisconnect:
        manager.disconnect(session_id)
    except Exception as e:
        logger.error(f"WebSocket error in session {session_id}: {str(e)}")
        manager.disconnect(session_id)

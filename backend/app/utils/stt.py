import os
import logging
from typing import Optional
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("stt_service")


# Common Whisper hallucinations triggered by low-energy background noise or silence
WHISPER_NOISE_HALLUCINATIONS = {
    "thank you", "thank you.", "thank you very much", "thank you very much.",
    "thanks for watching", "thanks for watching.", "thank you for watching",
    "thank you for watching.", "thank you so much", "thank you so much.",
    "thanks", "thanks.", "you", "you.", "bye", "bye.", "bye bye", "bye-bye",
    "goodbye", "goodbye.", "subtitles by", "subtitle by", "mbc", "amara.org",
    "please subscribe", "subscribe", "like and subscribe", ".", "so", "yeah",
    "um", "uh", "cough", "[cough]", "[music]", "[applause]", "[laughter]",
    "[snort]", "[sigh]", "[clears throat]", "[throat clearing]", "[silence]",
    "[gasp]", "[screaming]", "[cheering]", "i'm done", "..."
}


class STTService:
    """Service to handle Speech-to-Text transcription using Groq Whisper-large-v3."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GROQ_API_KEY") or ""
        self._client: Optional[Groq] = None

    @property
    def client(self) -> Groq:
        if self._client is None:
            self.api_key = self.api_key or os.getenv("GROQ_API_KEY", "")
            if not self.api_key:
                raise ValueError(
                    "GROQ_API_KEY is not set. Please ensure GROQ_API_KEY=gsk_... is present in .env"
                )
            self._client = Groq(api_key=self.api_key)
        return self._client

    def transcribe(self, audio_bytes: bytes, filename: str = "audio.webm") -> str:
        """
        Transcribes audio bytes into text using Groq Whisper.
        Filters out low-energy noise and silence hallucinations.
        """
        # Reject empty or minimal audio packets (< 3KB WebM is just headers without speech)
        if not audio_bytes or len(audio_bytes) < 3000:
            return ""

        try:
            file_tuple = (filename, audio_bytes)
            transcription = self.client.audio.transcriptions.create(
                file=file_tuple,
                model="whisper-large-v3",
                language="en",
                temperature=0.0,
                prompt="Candidate answering job interview questions in a professional setting.",
                response_format="text"
            )
            raw_text = transcription if isinstance(transcription, str) else getattr(transcription, "text", "")
            cleaned = raw_text.strip()

            # Check against known silence hallucinations
            norm = cleaned.lower().strip().strip("!.,?\"'")
            if norm in WHISPER_NOISE_HALLUCINATIONS or len(norm) < 3:
                logger.info(f"Filtered Whisper noise hallucination: '{cleaned}'")
                return ""

            return cleaned
        except Exception as e:
            logger.warning(f"Whisper transcription skipped (unparseable audio): {str(e)}")
            return ""


stt_service = STTService()

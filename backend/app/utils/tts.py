import base64
import logging
from typing import Optional
import edge_tts

logger = logging.getLogger("tts_service")

# Professional, crisp neural voices
DEFAULT_VOICE = "en-US-JennyNeural"  # Clear, warm, empathetic tone
ALTERNATIVE_MALE_VOICE = "en-US-GuyNeural"
DEFAULT_RATE = "+15%"  # Brisk, natural conversational pacing (faster than default)


class TTSService:
    """Service to handle speech synthesis using free Microsoft Edge Neural TTS."""

    def __init__(self, default_voice: str = DEFAULT_VOICE, default_rate: str = DEFAULT_RATE):
        self.default_voice = default_voice
        self.default_rate = default_rate

    async def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        rate: Optional[str] = None
    ) -> bytes:
        """
        Synthesizes plain text into MP3 audio bytes at a conversational speaking rate.
        """
        clean_text = text.strip()
        if not clean_text:
            return b""

        selected_voice = voice or self.default_voice
        selected_rate = rate or self.default_rate

        try:
            communicate = edge_tts.Communicate(
                text=clean_text,
                voice=selected_voice,
                rate=selected_rate
            )
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            return audio_data
        except Exception as e:
            logger.error(f"Error during TTS synthesis: {str(e)}")
            return b""

    async def synthesize_base64(
        self,
        text: str,
        voice: Optional[str] = None,
        rate: Optional[str] = None
    ) -> str:
        """
        Synthesizes text and returns as a Base64-encoded string for easy WebSocket transmission.
        """
        audio_bytes = await self.synthesize(text, voice, rate)
        if not audio_bytes:
            return ""
        return base64.b64encode(audio_bytes).decode("utf-8")


tts_service = TTSService()

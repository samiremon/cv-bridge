import io
from typing import Tuple
import pdfplumber
from docx import Document
from fastapi import UploadFile


async def extract_text_and_bytes(file: UploadFile) -> Tuple[str, bytes, str]:
    """
    Reads an UploadFile instance, extracts raw bytes, and parses text from PDF, DOCX, or TXT files.
    
    Returns:
        Tuple[str, bytes, str]: (extracted_text, raw_file_bytes, original_filename)
    """
    content = await file.read()
    filename = file.filename or "unknown_file"
    filename_lower = filename.lower()

    if not content:
        return "", b"", filename

    try:
        if filename_lower.endswith(".pdf"):
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                pages_text = [page.extract_text() or "" for page in pdf.pages]
                extracted_text = "\n".join(pages_text)

        elif filename_lower.endswith(".docx"):
            doc = Document(io.BytesIO(content))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            extracted_text = "\n".join(paragraphs)

        else:
            extracted_text = content.decode("utf-8", errors="ignore")

    except Exception:
        extracted_text = content.decode("utf-8", errors="ignore")

    return extracted_text.strip(), content, filename
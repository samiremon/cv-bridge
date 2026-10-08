import re
from typing import Tuple, List

# Common prompt injection patterns to intercept
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(previous|above)\s+instructions",
    r"system\s*:\s*",
    r"you\s+are\s+now\s+an?\s+HR",
    r"assign\s+(a\s+score|100/100|maximum\s+score)",
    r"do\s+not\s+evaluate",
    r"bypass\s+filters"
]

def sanitize_and_inspect_text(text: str) -> Tuple[bool, str, List[str]]:
    """
    Scans uploaded text for prompt injection vectors.
    Returns: (is_safe, sanitized_text, list_of_detected_flags)
    """
    flags = []
    sanitized = text

    for pattern in PROMPT_INJECTION_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            flags.append(f"Prompt injection attempt detected: '{pattern}'")
            # Redact the suspicious injection string
            sanitized = re.sub(pattern, "[REDACTED INJECTION ATTEMPT]", sanitized, flags=re.IGNORECASE)

    is_safe = len(flags) == 0
    return is_safe, sanitized, flags

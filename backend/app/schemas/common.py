from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standard error response model for API failure cases."""
    detail: str = Field(
        ...,
        description="Human-readable explanation of the error or failure reason.",
        example="Session not found or expired."
    )

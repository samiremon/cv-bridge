from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Schema for system health check and orchestrator status inspection."""
    status: str = Field(
        "healthy",
        description="Overall service operational health status.",
        example="healthy"
    )
    service: str = Field(
        "cv-bridge-backend",
        description="Service identifier.",
        example="cv-bridge-backend"
    )
    version: str = Field(
        "1.0.0",
        description="Application version number.",
        example="1.0.0"
    )
    langgraph_orchestrator: str = Field(
        "online",
        description="Status of the LangGraph state machine orchestrator.",
        example="online"
    )
    model_provider: str = Field(
        "gemini-3.8-flash",
        description="LLM provider and model configured for agentic analysis.",
        example="gemini-3.8-flash"
    )
    api_key_configured: bool = Field(
        ...,
        description="Whether the GEMINI_API_KEY environment variable is detected and configured.",
        example=True
    )

from typing import Literal

from pydantic import BaseModel


class MessageAnalysis(BaseModel):
    sentiment: Literal["positive", "neutral", "negative"]
    sentiment_score: float
    topic: str
    keywords: list[str]
    highlight: bool = False
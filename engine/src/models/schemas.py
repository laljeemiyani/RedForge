from pydantic import BaseModel, Field
from typing import List, Dict, Any

class AuditRequest(BaseModel):
    auditId: str
    targetUrl: str
    authHeaders: Dict[str, str] = Field(default_factory=dict)
    categories: List[str]

class AttackResult(BaseModel):
    category: str
    passed: bool
    severity: str
    title: str
    description: str
    transcript: List[Dict[str, Any]]
    remediation: str

class AuditResponse(BaseModel):
    auditId: str
    results: List[AttackResult]
    riskScore: int = Field(ge=0, le=100)
    completedAt: str

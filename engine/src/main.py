from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from typing import Dict, Any, Optional
from pydantic import BaseModel
import json
import io

from src.models.schemas import AuditRequest, AuditResponse
from src.core.runner import AuditRunner
from src.core.target import TargetAI
from src.reports.generator import ReportGenerator

app = FastAPI(title="RedForge Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TestConnectionRequest(BaseModel):
    targetUrl: str
    apiType: str = "auto"
    apiKey: Optional[str] = None
    messageField: Optional[str] = None
    responseField: Optional[str] = None
    model: Optional[str] = None


@app.get("/health")
async def health():
    return {"status": "ok", "service": "RedForge Engine"}


@app.post("/test-connection")
async def test_connection(req: TestConnectionRequest):
    # Build auth headers
    auth_headers: Dict[str, str] = {}
    if req.apiType == "openai" and req.apiKey:
        auth_headers = {"Authorization": f"Bearer {req.apiKey}"}

    # Build request template
    request_template = None
    if req.apiType == "custom" and req.messageField:
        request_template = json.dumps({req.messageField: "{{message}}"})

    # Build response path
    response_path = ""
    if req.apiType == "openai":
        response_path = "choices.0.message.content"
    elif req.apiType == "custom" and req.responseField:
        response_path = req.responseField

    # Map apiType to TargetAI mode
    mode = "auto"
    if req.apiType == "openai":
        mode = "openai"
    elif req.apiType == "custom":
        mode = "simple"

    target = TargetAI(
        url=req.targetUrl,
        auth_headers=auth_headers,
        mode=mode,
        request_template=request_template,
        response_path=response_path,
        model=req.model,
    )

    response = await target.send_message("Hello! Please respond with a single sentence.")

    if response != "NO_RESPONSE":
        return {"success": True, "preview": response[:200]}
    else:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "No response received. Check URL and credentials.",
            },
        )


@app.post("/run-audit", response_model=AuditResponse)
async def run_audit(request: AuditRequest):
    runner = AuditRunner()
    response = await runner.run_audit(request)
    return response


@app.post("/generate-report")
async def generate_report(audit_data: Dict[str, Any]):
    generator = ReportGenerator()
    pdf_bytes = generator.generate(audit_data)
    audit_id = audit_data.get("auditId", "report")

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=redforge-audit-{audit_id}.pdf"},
    )

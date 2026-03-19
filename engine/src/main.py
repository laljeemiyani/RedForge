from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Dict, Any
import io

from src.models.schemas import AuditRequest, AuditResponse
from src.core.runner import AuditRunner
from src.reports.generator import ReportGenerator

app = FastAPI(title="RedForge Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "RedForge Engine"}

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
        headers={"Content-Disposition": f"attachment; filename=redforge-audit-{audit_id}.pdf"}
    )

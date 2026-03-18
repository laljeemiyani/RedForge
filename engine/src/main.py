from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.models.schemas import AuditRequest, AuditResponse
from src.core.runner import AuditRunner

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

import sys
import asyncio

# Fix for Playwright on Windows: Force ProactorEventLoop
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from pydantic import BaseModel
from typing import List, Optional, Dict
from app.services.ingestion import IngestionService
from app.services.retrieval import RetrievalService
from app.services.generation import GenerationService
import uvicorn
import os
import uuid
import time
from app.exceptions import BaseAppException
from app.exception_handlers import app_exception_handler, general_exception_handler

app = FastAPI(title="Velora AI RAG Core Service", version="1.0.0")

# Background task for auto-cleanup
async def schedule_db_reset():
    RESET_DELAY_SECONDS = 24 * 60 * 60  # 24 Hours
    # RESET_DELAY_SECONDS = 10 * 60         # 10 Minutes
    
    print(f"INFO: Database auto-reset scheduled in {RESET_DELAY_SECONDS} seconds.", flush=True)
    await asyncio.sleep(RESET_DELAY_SECONDS)
    
    print("INFO: Executing scheduled database reset...", flush=True)
    await ingestion_service.reset_database()
    print("INFO: Scheduled database reset completed.", flush=True)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(schedule_db_reset())

@app.middleware("http")
async def add_correlation_id(request: Request, call_next):
    correlation_id = request.headers.get("X-Correlation-ID")
    if not correlation_id:
        correlation_id = str(uuid.uuid4())
    
    # We can't directly mutate headers in request, but we can access it in handlers
    # To propagate to response:
    response = await call_next(request)
    response.headers["X-Correlation-ID"] = correlation_id
    return response

app.add_exception_handler(BaseAppException, app_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

class QueryRequest(BaseModel):
    query: str
    top_k: int = 10
    namespace: Optional[str] = None
    history: List[Dict] = []

class IngestRequest(BaseModel):
    urls: List[str]
    namespace: Optional[str] = None
    recursive: bool = False
    max_pages: int = 500

class QueryResponse(BaseModel):
    answer: Dict

# Initialize services
ingestion_service = IngestionService()
retrieval_service = RetrievalService()
generation_service = GenerationService()

@app.post("/internal/ingest")
async def ingest_urls(request: IngestRequest):
    results = await ingestion_service.ingest(
        request.urls, 
        request.namespace, 
        request.recursive, 
        request.max_pages
    )
    return {"status": "success", "processed_pages": len(request.urls), "details": results}

@app.post("/internal/ingest-files")
async def ingest_files(
    files: List[UploadFile] = File(...), 
    namespace: str = Form(None)
):
    file_data = []
    for file in files:
        content = await file.read()
        file_data.append((file.filename, content))
        
    results = await ingestion_service.ingest_files(file_data, namespace)
    return {"status": "success", "processed_files": len(files), "details": results}

@app.post("/internal/embed")
async def get_embeddings(texts: List[str]):
    embeddings = retrieval_service.generate_embeddings(texts)
    return {"embeddings": embeddings}

@app.post("/query", response_model=QueryResponse)
async def query_index(request: QueryRequest):
    # Retrieve relevant results
    results = await retrieval_service.search(request.query, request.top_k, request.namespace)
    
    # Generate answer based on results
    answer = generation_service.generate_answer(request.query, results, request.history)
    
    return QueryResponse(answer=answer)

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

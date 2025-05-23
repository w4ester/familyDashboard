import os
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from loguru import logger
import httpx

# Load environment variables
load_dotenv()

# Import routers
from app.routes import llm, family

# Initialize FastAPI app
app = FastAPI(
    title="Family Dashboard OpenAPI Server",
    description="OpenAPI server for LLM integration with Family Dashboard",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logger.add("logs/server.log", rotation="10 MB", level="INFO")

# Include routers
app.include_router(llm.router, prefix="/api/llm", tags=["LLM"])
app.include_router(family.router, prefix="/api/family", tags=["Family"])

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "0.1.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Family Dashboard OpenAPI Server",
        "docs_url": "/docs",
        "health_check": "/health"
    }
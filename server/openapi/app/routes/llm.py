from fastapi import APIRouter, HTTPException, Depends, Request, Body
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from loguru import logger
import os
import httpx
import json
from openai import OpenAI, OpenAIError

router = APIRouter()

# Define models
class LLMRequest(BaseModel):
    """Request model for LLM completion"""
    prompt: str = Field(..., description="The prompt to send to the LLM")
    model: str = Field(default="gpt-3.5-turbo", description="The LLM model to use")
    max_tokens: Optional[int] = Field(default=1000, description="Maximum number of tokens to generate")
    temperature: Optional[float] = Field(default=0.7, description="Temperature for sampling")
    system_prompt: Optional[str] = Field(default=None, description="Optional system prompt")
    history: Optional[List[Dict[str, str]]] = Field(default=None, description="Optional conversation history")

class LLMResponse(BaseModel):
    """Response model for LLM completion"""
    content: str = Field(..., description="Generated response content")
    model: str = Field(..., description="The model used for generation")
    tokens: Dict[str, int] = Field(..., description="Token usage information")

# Helper functions

def get_openai_client():
    """Get OpenAI client with API key"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.error("OpenAI API key not found")
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    return OpenAI(api_key=api_key)

def get_ollama_url():
    """Get Ollama URL"""
    return os.getenv("OLLAMA_URL", "http://localhost:11434")

async def chat_completion_openai(request: LLMRequest):
    """Get chat completion from OpenAI"""
    client = get_openai_client()
    
    messages = []
    
    # Add system prompt if provided
    if request.system_prompt:
        messages.append({"role": "system", "content": request.system_prompt})
    
    # Add conversation history if provided
    if request.history:
        messages.extend(request.history)
    
    # Add the current prompt
    messages.append({"role": "user", "content": request.prompt})
    
    try:
        response = client.chat.completions.create(
            model=request.model,
            messages=messages,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        
        tokens = {
            "prompt": response.usage.prompt_tokens,
            "completion": response.usage.completion_tokens,
            "total": response.usage.total_tokens
        }
        
        return LLMResponse(
            content=response.choices[0].message.content,
            model=request.model,
            tokens=tokens
        )
    except OpenAIError as e:
        logger.error(f"OpenAI API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")

async def chat_completion_ollama(request: LLMRequest):
    """Get chat completion from Ollama"""
    ollama_url = get_ollama_url()
    
    messages = []
    
    # Add system prompt if provided
    if request.system_prompt:
        messages.append({"role": "system", "content": request.system_prompt})
    
    # Add conversation history if provided
    if request.history:
        messages.extend(request.history)
    
    # Add the current prompt
    messages.append({"role": "user", "content": request.prompt})
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{ollama_url}/api/chat",
                json={
                    "model": request.model,
                    "messages": messages,
                    "options": {
                        "temperature": request.temperature
                    }
                },
                timeout=60.0
            )
            
            if response.status_code != 200:
                logger.error(f"Ollama API error: {response.text}")
                raise HTTPException(status_code=500, detail=f"Ollama API error: {response.text}")
            
            result = response.json()
            
            # Ollama doesn't provide token counts, so we'll estimate
            prompt_length = len(json.dumps(messages))
            completion_length = len(result["message"]["content"])
            
            tokens = {
                "prompt": int(prompt_length / 4),  # Rough estimate
                "completion": int(completion_length / 4),  # Rough estimate
                "total": int((prompt_length + completion_length) / 4)  # Rough estimate
            }
            
            return LLMResponse(
                content=result["message"]["content"],
                model=request.model,
                tokens=tokens
            )
    except httpx.HTTPError as e:
        logger.error(f"HTTP error with Ollama: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ollama API error: {str(e)}")

# Routes

@router.post("/chat", response_model=LLMResponse)
async def chat_completion(request: LLMRequest = Body(...)):
    """Generate a response from an LLM"""
    logger.info(f"LLM chat request received for model: {request.model}")
    
    # Determine which backend to use based on the model name
    if request.model.startswith(("gpt-", "claude-", "openai/")):
        return await chat_completion_openai(request)
    else:
        # Assume it's an Ollama model
        return await chat_completion_ollama(request)

@router.get("/models")
async def list_models():
    """List available LLM models"""
    models = {
        "openai": [],
        "ollama": []
    }
    
    # Get OpenAI models if API key is available
    try:
        if os.getenv("OPENAI_API_KEY"):
            client = get_openai_client()
            openai_models = client.models.list()
            models["openai"] = [model.id for model in openai_models.data]
    except Exception as e:
        logger.error(f"Error fetching OpenAI models: {str(e)}")
    
    # Get Ollama models
    try:
        ollama_url = get_ollama_url()
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{ollama_url}/api/tags")
            if response.status_code == 200:
                result = response.json()
                models["ollama"] = [model["name"] for model in result["models"]]
    except Exception as e:
        logger.error(f"Error fetching Ollama models: {str(e)}")
    
    return models
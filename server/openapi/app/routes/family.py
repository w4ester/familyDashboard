from fastapi import APIRouter, HTTPException, Depends, Request, Body
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from loguru import logger
import json
from ..routes.llm import openai_client, ollama_client

router = APIRouter()

# Define models

class FamilyMember(BaseModel):
    """Model for family member information"""
    name: str = Field(..., description="Name of family member")
    age: Optional[int] = Field(None, description="Age of family member")

class ActivityRequest(BaseModel):
    """Request model for activity suggestions"""
    prompt: str = Field(..., description="The specific request for activity suggestions")
    family_members: Optional[List[FamilyMember]] = Field(None, description="List of family members with ages")
    preferences: Optional[List[str]] = Field(None, description="Family activity preferences")
    time_available: Optional[int] = Field(None, description="Available time in minutes")

class ActivitySuggestion(BaseModel):
    """Model for a single activity suggestion"""
    title: str = Field(..., description="Activity title")
    description: str = Field(..., description="Activity description")
    estimated_time: Optional[int] = Field(None, description="Estimated time in minutes")
    suitable_for: Optional[List[str]] = Field(None, description="Suitable for (ages/groups)")

class ActivityResponse(BaseModel):
    """Response model for activity suggestions"""
    suggestions: List[ActivitySuggestion] = Field(..., description="List of activity suggestions")
    rationale: str = Field(..., description="Explanation of suggestions")

class Event(BaseModel):
    """Model for scheduled event"""
    title: str = Field(..., description="Event title")
    date: str = Field(..., description="Event date and time")
    duration: Optional[int] = Field(None, description="Duration in minutes")
    person: Optional[str] = Field(None, description="Associated person")

class ScheduleRequest(BaseModel):
    """Request model for schedule help"""
    prompt: str = Field(..., description="The specific request for schedule help")
    events: Optional[List[Event]] = Field(None, description="Current scheduled events")
    family_members: Optional[List[str]] = Field(None, description="List of family members")

class ScheduleConflict(BaseModel):
    """Model for schedule conflict"""
    events: List[str] = Field(..., description="Conflicting events")
    time: str = Field(..., description="Time of conflict")
    resolution: str = Field(..., description="Suggested resolution")

class ScheduleResponse(BaseModel):
    """Response model for schedule help"""
    suggestions: str = Field(..., description="Schedule organization suggestions")
    conflicts: Optional[List[ScheduleConflict]] = Field(None, description="Potential conflicts")

# Helper functions

async def generate_activity_suggestions(request: ActivityRequest) -> ActivityResponse:
    """Generate family activity suggestions using LLM"""
    
    # Build context from request
    context_parts = []
    
    if request.family_members:
        members_info = [f"{m.name}{' (age ' + str(m.age) + ')' if m.age else ''}" 
                        for m in request.family_members]
        context_parts.append(f"Family members: {', '.join(members_info)}")
    
    if request.preferences:
        context_parts.append(f"Preferences: {', '.join(request.preferences)}")
    
    if request.time_available:
        context_parts.append(f"Available time: {request.time_available} minutes")
    
    context = ". ".join(context_parts) if context_parts else "General family"
    
    system_prompt = """
You are a family activity expert. When suggesting activities, provide practical, creative, and age-appropriate ideas.
Always format your response as a JSON object with the following structure:
{
    "suggestions": [
        {
            "title": "Activity Name",
            "description": "Detailed description",
            "estimated_time": 60,
            "suitable_for": ["all ages", "children"]
        }
    ],
    "rationale": "Why these activities were chosen"
}
Provide at least 3-5 suggestions."""
    
    full_prompt = f"{context}. {request.prompt}"
    
    try {
        # Try with OpenAI first
        client = openai_client()
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": full_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        
        # Convert to response model
        suggestions = []
        for s in data.get("suggestions", []):
            suggestions.append(ActivitySuggestion(**s))
        
        return ActivityResponse(
            suggestions=suggestions,
            rationale=data.get("rationale", "")
        )
        
    } except Exception as e:
        logger.error(f"Error with OpenAI: {str(e)}")
        # Fallback to Ollama if available
        try {
            client = ollama_client()
            response = await client.chat.completions.create(
                model="llama2",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": full_prompt}
                ]
            )
            
            content = response.choices[0].message.content
            # Parse JSON from response
            try {
                data = json.loads(content)
                suggestions = []
                for s in data.get("suggestions", []):
                    suggestions.append(ActivitySuggestion(**s))
                
                return ActivityResponse(
                    suggestions=suggestions,
                    rationale=data.get("rationale", "")
                )
            } except json.JSONDecodeError:
                # If not valid JSON, create a basic response
                return ActivityResponse(
                    suggestions=[
                        ActivitySuggestion(
                            title="Family Game Time",
                            description="Play board games or card games together",
                            estimated_time=60,
                            suitable_for=["all ages"]
                        )
                    ],
                    rationale="These are general family activities that work for most situations"
                )
        } catch Exception as e2:
            logger.error(f"Error with Ollama fallback: {str(e2)}")
            raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e2)}")

async def analyze_family_schedule(request: ScheduleRequest) -> ScheduleResponse:
    """Analyze and provide suggestions for family schedule"""
    
    # Build context from request
    context_parts = []
    
    if request.events:
        events_text = "\n".join([
            f"- {e.title} on {e.date}" + 
            (f" ({e.duration} min)" if e.duration else "") +
            (f" for {e.person}" if e.person else "")
            for e in request.events
        ])
        context_parts.append(f"Current events:\n{events_text}")
    
    if request.family_members:
        context_parts.append(f"Family members: {', '.join(request.family_members)}")
    
    context = "\n".join(context_parts) if context_parts else "No current schedule"
    
    system_prompt = """
You are a family schedule organizer. Analyze the provided schedule and:
1. Identify potential conflicts or busy times
2. Suggest optimizations for better time management
3. Recommend gaps for family time
4. Consider travel time between activities

Format your response as a detailed analysis with practical suggestions."""
    
    full_prompt = f"{context}\n\n{request.prompt}"
    
    try {
        # Try with OpenAI first
        client = openai_client()
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": full_prompt}
            ]
        )
        
        content = response.choices[0].message.content
        
        # Parse for potential conflicts (basic pattern matching)
        conflicts = []
        if "conflict" in content.lower():
            # This is a simplified conflict detection
            lines = content.split('\n')
            for line in lines:
                if "conflict" in line.lower():
                    # Create a basic conflict object
                    conflicts.append(ScheduleConflict(
                        events=["Event A", "Event B"],  # Would need more sophisticated parsing
                        time="TBD",
                        resolution="See suggestions above"
                    ))
        
        return ScheduleResponse(
            suggestions=content,
            conflicts=conflicts if conflicts else None
        )
        
    } catch Exception as e:
        logger.error(f"Error analyzing schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze schedule: {str(e)}")

# Routes

@router.post("/activity-suggestions", response_model=ActivityResponse)
async def suggest_activities(request: ActivityRequest = Body(...)):
    """Generate activity suggestions for the family"""
    logger.info("Generating family activity suggestions")
    
    try {
        return await generate_activity_suggestions(request)
    } catch Exception as e:
        logger.error(f"Error in activity suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/schedule-help", response_model=ScheduleResponse)
async def organize_schedule(request: ScheduleRequest = Body(...)):
    """Get help organizing family schedule"""
    logger.info("Analyzing family schedule")
    
    try {
        return await analyze_family_schedule(request)
    } catch Exception as e:
        logger.error(f"Error in schedule analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
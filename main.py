"""
Module: main.py
Role: RESTful Endpoint Orchestration Layer.
Description: Initializes the core ASGI API routing table using FastAPI 
for local inspection or remote state ingestion.
"""
from fastapi import FastAPI
from pydantic import BaseModel
from ai_service.garbage_env import GarbageDetectionEnv

app = FastAPI()

env = GarbageDetectionEnv()

class ActionRequest(BaseModel):
    """
    Schema representation for incoming policy dispatch payloads.
    """
    action: int

@app.get("/")
def root():
    """
    Health check endpoint mapping to ensure container viability.
    """
    return {"message": "API running"}

@app.post("/reset")
def reset():
    """
    Endpoint mapping to force the environment into its baseline parameters.
    """
    return env.reset()

@app.post("/step")
def step(req: ActionRequest):
    """
    Endpoint mapping to injest policy actions and yield state transitions.
    
    Parameters:
        req (ActionRequest): The computed deterministic action schema.
    """
    state, reward, done, info = env.step(req.action)

    return {
        "state": state,
        "reward": reward,
        "done": done,
        "tasks": info.get("tasks", {})
    }
"""
Module: app.py
Role: Backend orchestration via ASGI interfacing.
Description: Establishes a RESTful API to expose the ML Environment and 
manage remote inference triggers over stateless protocols.
"""
from fastapi import FastAPI
import uvicorn
import sys
import os

# Align directory pathways for internal project module cross-referencing.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ai_service.garbage_env import GarbageDetectionEnv

app = FastAPI()
env = GarbageDetectionEnv()

@app.post("/reset")
def reset_env():
    """
    Endpoint mapping to force the environment into its baseline parameters.
    """
    return env.reset()

@app.post("/step")
def step_env(req: dict):
    """
    Endpoint mapping to injest policy actions and yield state transitions.
    
    Parameters:
        req (dict): JSON payload encapsulating the computed deterministic action.
    """
    action = req.get("action", 1)
    obs, reward, done, info = env.step(action)
    
    return {
        "observation": obs,
        "reward": float(reward),
        "done": bool(done),
        "info": info
    }

@app.get("/state")
def get_state():
    """
    Endpoint mapping to observe systemic configurations continuously.
    """
    return env.state()

def main():
    """
    Entry point to establish binding ports for asynchronous networking.
    """
    uvicorn.run(app, host="0.0.0.0", port=7860)

if __name__ == "__main__":
    main()
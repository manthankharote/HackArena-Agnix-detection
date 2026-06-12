"""
Roboflow Cloud Vision API Integration
=====================================
Sends local frames/images to the hosted YOLOv11 endpoint and returns detection results.
"""

import os
import requests
import base64
from dotenv import load_dotenv

load_dotenv()

def detect_garbage_in_image(image_path: str):
    """Sends an image to Roboflow Hosted API and returns the highest confidence."""
    api_key = os.getenv("ROBOFLOW_API_KEY")
    model_id = os.getenv("ROBOFLOW_MODEL_ID") # Format: "project-name/version" (e.g., "garbage-detect/1")
    
    if not api_key or not model_id:
        print("[ERROR] Roboflow keys missing in .env")
        return False, 0.0

    url = f"https://detect.roboflow.com/{model_id}?api_key={api_key}&confidence=15"

    try:
        with open(image_path, "rb") as image_file:
            img_base64 = base64.b64encode(image_file.read()).decode("utf-8")
        
        response = requests.post(
            url, 
            data=img_base64,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        result = response.json()
        
        # Check predictions
        if "predictions" in result and len(result["predictions"]) > 0:
            highest_conf = max([pred["confidence"] for pred in result["predictions"]]) * 100
            print(f"[VISION API] 🗑️ Garbage Detected! Confidence: {highest_conf:.1f}%")
            return True, highest_conf
        else:
            print("[VISION API] ✅ Clean area. No garbage detected.")
            return False, 0.0
            
    except Exception as e:
        print(f"[ERROR] Vision API failed: {e}")
        return False, 0.0
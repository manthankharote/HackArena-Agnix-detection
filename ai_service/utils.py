"""
Module: utils.py
Role: Common utility infrastructure.
Description: Supplies orchestration functions for frame serialization and 
evidentiary storage handling outside the primary inference loop.
"""

import cv2
import base64
from datetime import datetime
from pathlib import Path

# Allocate the local filesystem partition for storing visual artifacts.
EVIDENCE_DIR = Path("evidence")
EVIDENCE_DIR.mkdir(exist_ok=True)


def frame_to_base64(frame) -> str:
    """
    Serializes an OpenCV BGR frame matrix into a base64 encoded string.
    
    Parameters:
        frame (np.ndarray): The raw image tensor to be manipulated.
        
    Returns:
        str: Base64 string compliant with HTTP JSON payloads.
    """
    _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return base64.b64encode(buf).decode('utf-8')


def save_evidence(frame, camera_id: str) -> str:
    """
    Persists contextual observation arrays locally for subsequent external validation.
    
    Parameters:
        frame (np.ndarray): The raw visual observation tensor.
        camera_id (str): Associated identifier linking the visual to a specific sensor.
        
    Returns:
        str: Fully qualified pathway corresponding to the allocated artifact.
    """
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{camera_id}_{ts}.jpg"
    filepath = EVIDENCE_DIR / filename
    cv2.imwrite(str(filepath), frame)
    return str(filepath)

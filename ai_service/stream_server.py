import sys
import os
import time
import argparse
import cv2
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, Response
from fastapi.responses import StreamingResponse
import uvicorn
import threading

# Add root folder to sys.path so we can import camera and detector modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_service.camera import open_source, VideoStream
from ai_service.detector import GarbageDetector

load_dotenv()

app = FastAPI(title="CleanCity YOLO Streaming Engine")

# Global variables for video stream and detector
cap = None
detector = None
args = None
reconnect_url = None

# Thread safety lock for frame reading
frame_lock = threading.Lock()

from pydantic import BaseModel

class SourceSchema(BaseModel):
    source: str
    url: str = None

@app.get("/")
def root():
    return {"status": "online", "message": "YOLO Video Ingestion Engine is running"}

@app.post("/switch-source")
def switch_source(req: SourceSchema):
    global cap, reconnect_url
    source = req.source.lower()
    url = req.url
    print(f"[SYSTEM] Request to switch source: {source} | URL: {url}")
    try:
        with frame_lock:
            if cap:
                cap.release()
            cap, source_label, reconnect_url = open_source(source, url=url)
            if not cap.isOpened():
                raise Exception("Failed to open source stream")
        print(f"[SYSTEM] Successfully switched to: {source_label}")
        return {"success": True, "message": f"Successfully switched to {source_label}"}
    except Exception as e:
        print(f"[ERROR] Switch source failed: {str(e)}")
        return {"success": False, "message": str(e)}

def generate_mjpeg_frames():
    global cap, detector, args, reconnect_url
    
    frame_count = 0
    process_every_n = 4 # Process every 4th frame to reduce load and latency (approx. 7-8 FPS inference)
    
    while True:
        with frame_lock:
            ret, frame = cap.read()
            
        if not ret:
            print("[SYSTEM] Camera feed lost. Reconnecting...")
            time.sleep(2)
            with frame_lock:
                cap.release()
                cap = VideoStream(reconnect_url)
            continue

        frame_count += 1
        
        # Resize frame for latency reduction
        h, w = frame.shape[:2]
        scale = 640.0 / w
        frame = cv2.resize(frame, (640, int(h * scale)))

        # Temporal skipping for CPU efficiency
        if frame_count % process_every_n != 0:
            # For skipped frames, we still want to encode and stream them to keep it smooth,
            # but without running expensive YOLO inference
            ret_code, jpeg = cv2.imencode('.jpg', frame)
            if not ret_code:
                continue
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
            time.sleep(0.04)
            continue

        # Run inference on frame
        result = detector.detect_frame(frame)
        annotated = result["frame"]
        analysis = result["analysis"]
        classification = analysis["classification"]
        
        # Overlay HUD on frame
        color = (0, 0, 255) if classification == "ILLEGAL" else (0, 200, 0) if classification == "LEGAL" else (100, 100, 100)
        text = "⚠ ILLEGAL DUMP" if classification == "ILLEGAL" else "✓ LEGAL DUMP" if classification == "LEGAL" else "MONITORING..."
        
        overlay = annotated.copy()
        cv2.rectangle(overlay, (0, 0), (640, 40), color, -1)
        cv2.addWeighted(overlay, 0.4, annotated, 0.6, 0, annotated)
        cv2.putText(annotated, text, (15, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Encode processed frame as JPEG
        ret_code, jpeg = cv2.imencode('.jpg', annotated)
        if not ret_code:
            continue
            
        # Yield the multipart frame
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
        
        # Introduce tiny delay to regulate output FPS (~25-30 FPS streaming output)
        time.sleep(0.03)

@app.get("/stream")
def video_stream():
    return StreamingResponse(
        generate_mjpeg_frames(), 
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

def main():
    global cap, detector, args, reconnect_url
    
    parser = argparse.ArgumentParser(description="YOLO Video Streaming Server")
    parser.add_argument("--source", default="youtube", choices=["webcam", "droidcam", "rtsp", "youtube", "video"])
    parser.add_argument("--url", default="https://www.youtube.com/@LofiGirl/live", help="Camera URL or YouTube stream link")
    parser.add_argument("--file", help="Video file path")
    parser.add_argument("--port", type=int, default=7861, help="FastAPI port")
    args = parser.parse_args()

    print(f"\n[SYSTEM] Initializing video source: {args.source}...")
    cap, source_label, reconnect_url = open_source(args.source, url=args.url, file=args.file)
    
    if not cap.isOpened():
        print("[ERROR] Failed to connect to visual source stream.")
        sys.exit(1)
        
    print(f"[SYSTEM] Stream successfully established: {source_label}")
    print("[SYSTEM] Loading YOLO detection model...")
    detector = GarbageDetector()
    print("[SYSTEM] YOLO Model loaded. Starting Web Server...")

    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")

if __name__ == "__main__":
    main()

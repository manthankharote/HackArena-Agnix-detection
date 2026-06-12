"""
Module: live_monitor.py
Role: Primary Real-Time Evaluation Monitoring Construct.
Description: Deploys dynamic classifier paradigms on continuous visual protocols.
Aggregates state thresholds, implements confidence heuristics, and dispatches artifacts.
"""

import argparse
import os
import sys
import time
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

import cv2

from camera import open_source, VideoStream, extract_youtube_stream
from detector import GarbageDetector
from utils import frame_to_base64, save_evidence


# ─── CONFIG ─────────────────────────────────────────────

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5000")
DETECTION_API_KEY = os.environ.get("DETECTION_API_KEY", "cleancity-detection-key")

PROCESS_EVERY_N = 6
FRAME_WIDTH = 640

ALERT_COOLDOWN = 60


# ─── BACKEND ────────────────────────────────────────────

def send_to_backend(data: dict):
    """
    Asynchronously relays JSON payload heuristics through REST endpoints.
    
    Parameters:
        data (dict): Compiled metrics encompassing observed spatial detections.
    """
    try:
        r = requests.post(
            f"{BACKEND_URL}/api/detections",
            json=data,
            headers={"x-api-key": DETECTION_API_KEY},
            timeout=5
        )
        print(f"[SYSTEM] Backend ingestion protocol: status code {r.status_code}")
    except Exception as e:
        print(f"[ERROR] Internal upstream exception handled: {e}")


# ─── MAIN LOOP ──────────────────────────────────────────

def run_monitor(args):
    """
    Orchestrates the synchronous ingestion, prediction, and notification loop.
    Iterates dynamically across continuous state frames generated from designated sources.
    
    Parameters:
        args (Namespace): Configuration structures provided at initialization.
    """

    print("\n[SYSTEM] Continuous Real-Time Evaluation Process Initiated.\n")

    cap, source_label, reconnect_url = open_source(
        args.source, url=args.url, file=args.file
    )

    if not cap.isOpened():
        print("[ERROR] Failed to map the source vector stream.")
        sys.exit(1)

    print(f"[SYSTEM] Visual Vector Stream: {source_label}")

    # Instantiate the defined underlying heuristic object classifiers.
    detector = GarbageDetector()

    frame_count = 0
    last_alert = 0
    consecutive_no_detection_count = 0

    try:
        while True:
            ret, frame = cap.read()

            if not ret:
                print("[SYSTEM] Vector stream missing. Executing reconnection heuristic...")
                cap.release()
                time.sleep(2)
                cap = VideoStream(reconnect_url)
                continue

            frame_count += 1

            # Execute spatial reduction transformation for latency mitigation.
            h, w = frame.shape[:2]
            scale = FRAME_WIDTH / w
            frame = cv2.resize(frame, (FRAME_WIDTH, int(h * scale)))

            # Implements the temporal skipping threshold heuristic parameter.
            if frame_count % PROCESS_EVERY_N != 0:
                continue

            # ── DETECTION ──
            result = detector.detect_frame(frame)

            detected = result["detected"]
            labels = result["labels"]
            total = result["total"]
            annotated = result["frame"]

            timestamp = datetime.now().strftime("%H:%M:%S")

            analysis = result["analysis"]
            classification = analysis["classification"]
            confidence_score = analysis["confidence_score"]

            import json
            print(f"[OBSERVATION] [{timestamp}] Classification: {classification} | Labels: {labels}")
            print("[SPATIAL ANALYSIS]", json.dumps(analysis, indent=2))

            if classification == "ILLEGAL":
                consecutive_no_detection_count = 0
                print(f"[ILLEGAL DUMP] [{timestamp}] Open area dumping detected!")

                if time.time() - last_alert > ALERT_COOLDOWN:
                    save_evidence(annotated, args.camera_id)
                    send_to_backend({
                        "imageBase64": frame_to_base64(annotated),
                        "cameraId": args.camera_id,
                        "cameraName": args.camera_name,
                        "ward": args.ward,
                        "latitude": args.lat,
                        "longitude": args.lng,
                        "detectedObjects": [{"label": l} for l in labels],
                        "total": total,
                        "confidence": result["analysis"]["confidence_score"],
                        "dumpType": "ILLEGAL"
                    })
                    last_alert = time.time()
                    print(f"[ALERT SENT] Next alert in {ALERT_COOLDOWN}s")
                else:
                    remaining = int(ALERT_COOLDOWN - (time.time() - last_alert))
                    print(f"[COOLDOWN] Next alert in {remaining}s")

            elif classification == "LEGAL":
                consecutive_no_detection_count = 0
                print(f"[LEGAL DUMP] [{timestamp}] Garbage near dustbin, no alert.")

            else:
                consecutive_no_detection_count += 1
                print(f"[NO EVENT] [{timestamp}] No dump detected. Streak: {consecutive_no_detection_count}")
                if consecutive_no_detection_count >= 5:
                    last_alert = 0
                    print("[RESET] Cooldown reset — garbage gone from scene.")

            # ── DISPLAY ──
            if args.display:

                # Synthesize localized Heads Up Display mechanisms across bounding areas.
                color = (0, 0, 255) if classification == "ILLEGAL" else (0, 200, 0) if classification == "LEGAL" else (100, 100, 100)
                text = "⚠ ILLEGAL DUMP DETECTED" if classification == "ILLEGAL" else "✓ LEGAL DUMP" if classification == "LEGAL" else "MONITORING..."

                overlay = annotated.copy()
                cv2.rectangle(overlay, (0, 0), (FRAME_WIDTH, 40), color, -1)
                cv2.addWeighted(overlay, 0.4, annotated, 0.6, 0, annotated)

                cv2.putText(annotated, text, (10, 28),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7,
                            (255, 255, 255), 2)

                display_frame = cv2.resize(annotated, (640, 360))
                cv2.imshow("Monitor Dashboard", display_frame)

                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

    except KeyboardInterrupt:
        print("\n[SYSTEM] Received intercept loop termination protocol.")

    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("[SYSTEM] Safely deallocated temporal handlers and array buffers.")


# ─── CLI ───────────────────────────────────────────────

if __name__ == "__main__":

    parser = argparse.ArgumentParser()

    parser.add_argument("--source", default="webcam",
                        choices=["webcam", "droidcam", "rtsp", "youtube", "video"])

    parser.add_argument("--url", help="camera URL")
    parser.add_argument("--file", help="video file")

    parser.add_argument("--camera-id", default="cam-001")
    parser.add_argument("--camera-name", default="Main Camera")
    parser.add_argument("--ward", default="Unassigned")

    parser.add_argument("--lat", type=float, default=18.5204)
    parser.add_argument("--lng", type=float, default=73.8567)

    parser.add_argument("--no-display", dest="display", action="store_false")
    parser.set_defaults(display=True)

    args = parser.parse_args()

    run_monitor(args)
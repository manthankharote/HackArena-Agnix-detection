"""
LIVE DEMO SCRIPT - Screen Capture Integration
=============================================
This script continuously captures the screen (e.g., a YouTube Live CCTV feed),
sends the frames to the Roboflow Vision API, and triggers WhatsApp alerts via the Node.js backend.
"""

import time
import os
from PIL import ImageGrab
from dotenv import load_dotenv

# Import our custom services
from ai_service.vision_service import detect_garbage_in_image
try:
    from ai_service.whatsapp_notifier import send_alert
except ImportError:
    from whatsapp_notifier import send_alert

load_dotenv()

def main():
    print("\n[SYSTEM] Starting LIVE YouTube CCTV Monitor...")
    print("=" * 60)
    print("👉 ACTION REQUIRED: Arrange your screen so the YouTube video is visible.")
    print("Starting in 5 seconds...\n")
    time.sleep(5)

    alert_cooldown = 45 # Seconds to wait before sending another WhatsApp message
    last_alert_time = 0

    try:
        while True:
            # 1. Grab the current screen
            screenshot = ImageGrab.grab()
            screenshot = screenshot.convert('RGB')
            temp_path = "live_frame.jpg"
            
            # Save it temporarily (low quality to send faster to API)
            screenshot.save(temp_path, quality=60)
            
            print("[OBSERVATION] Capturing live frame from screen...")

            # 2. Send to Roboflow
            is_garbage, confidence = detect_garbage_in_image(temp_path)

            # 3. Decision & Alert Logic
            if is_garbage:
                current_time = time.time()
                if current_time - last_alert_time > alert_cooldown:
                    print(f"[POLICY] THRESHOLD MET ({confidence:.1f}%) -> Trigger Authority Alert!")
                    send_alert(location="Live CCTV Monitor (Cam-01)", confidence=confidence)
                    last_alert_time = current_time
                    print(f"[SYSTEM] Cooling down for {alert_cooldown} seconds to prevent WhatsApp spam...")
                else:
                    print("[POLICY] Garbage detected, but alert is on cooldown. Skipping message.")
            else:
                print("[POLICY] NOMINAL STATE -> Continue Monitoring")

            print("-" * 60)
            
            # Wait 4 seconds before capturing the next frame (saves Roboflow API limits)
            time.sleep(4)

    except KeyboardInterrupt:
        print("\n[SYSTEM] Live Monitoring Stopped by User.")
        if os.path.exists("live_frame.jpg"):
            os.remove("live_frame.jpg")

if __name__ == "__main__":
    main()
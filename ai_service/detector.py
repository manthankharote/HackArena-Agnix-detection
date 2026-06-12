"""
Module: detector.py
Role: Placeholder for Object Detection Algorithms.
Description: Outlines the baseline classifier architecture. Serves as a stub 
for integrating advanced heuristics in bounding box and classification schemas.
"""
from ultralytics import YOLO

class GarbageDetector:
    """
    Simulation interface for spatial detection algorithms.
    """
    def __init__(self, model_path=None):
        """
        Initializes parameter weights locally or across network streams.
        """
        import os
        if model_path is None:
            # Default to best.pt in the same directory as this file
            model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "best.pt")
        self.model = YOLO(model_path)

    def detect_frame(self, frame):
        """
        Evaluates the frame to deduce violation states using spatial relationships.
        """
        results = self.model(frame, verbose=False, conf=0.15)
        result = results[0]
        
        persons = []
        garbages = []
        dustbins = []
        
        all_labels = []
        
        # Parse detections
        for i in range(len(result.boxes)):
            box = result.boxes[i]
            cls_id = int(box.cls[0])
            label = result.names[cls_id].lower()
            conf = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            
            all_labels.append(label)
            
            cx = (x1 + x2) / 2
            cy = (y1 + y2) / 2
            
            det = {"label": label, "conf": conf, "cx": cx, "cy": cy, "y1": y1, "y2": y2}
            
            if label == "person":
                persons.append(det)
            elif label == "garbage":
                garbages.append(det)
            elif label == "dustbin":
                dustbins.append(det)

        person_detected = len(persons) > 0
        garbage_detected = len(garbages) > 0
        dustbin_detected = len(dustbins) > 0
        
        event_detected = False
        classification = "NO_EVENT"
        reason = "No person or no garbage detected."
        confidence_score = 0.0
        distance = None
        
        import math
        
        if person_detected and garbage_detected:
            # Calculate distance between the first garbage and nearest dustbin
            # For simplicity, using max confidence garbage if multiple, but here just first
            g = garbages[0]
            p = persons[0]
            g_conf = g["conf"]
            p_conf = p["conf"]
            
            garbage_center_y = (g["y1"] + g["y2"]) / 2
            person_bottom_y = p["y2"]
            
            if garbage_center_y < (person_bottom_y - 100):
                event_detected = False
                classification = "HOLDING"
                reason = "Garbage appears to be held by person, not dumped yet."
                confidence_score = (g_conf + p_conf) / 2.0
            else:
                if dustbin_detected:
                    # Find nearest dustbin
                    nearest_dist = float('inf')
                    nearest_d_conf = 0.0
                    for d in dustbins:
                        dist = math.sqrt((g["cx"] - d["cx"])**2 + (g["cy"] - d["cy"])**2)
                        if dist < nearest_dist:
                            nearest_dist = dist
                            nearest_d_conf = d["conf"]
                    
                    distance = nearest_dist
                    # Confidence score can be average of all involved
                    confidence_score = (g_conf + p_conf + nearest_d_conf) / 3.0
                    
                    if distance <= 200:
                        event_detected = True
                        classification = "LEGAL"
                        reason = f"Garbage is near dustbin (distance: {distance:.1f}px <= 200px)."
                    else:
                        event_detected = True
                        classification = "ILLEGAL"
                        reason = f"Nearest dustbin is too far (distance: {distance:.1f}px > 200px)."
                else:
                    event_detected = True
                    classification = "ILLEGAL"
                    reason = "Person and garbage detected, but no dustbin present."
                    confidence_score = (g_conf + p_conf) / 2.0
        elif person_detected or garbage_detected:
            # Set confidence to whatever was detected
            if person_detected:
                confidence_score = persons[0]["conf"]
            if garbage_detected:
                confidence_score = garbages[0]["conf"]
        else:
            confidence_score = 1.0 # Certain there's nothing
            
        spatial_analysis = {
            "event_detected": event_detected,
            "classification": classification,
            "reason": reason,
            "confidence_score": round(confidence_score, 2),
            "person_detected": person_detected,
            "garbage_detected": garbage_detected,
            "dustbin_detected": dustbin_detected,
            "garbage_to_dustbin_distance_px": round(distance, 1) if distance is not None else None
        }

        # Keep the original output format structure to not break `live_monitor.py`
        # but attach our new spatial payload
        return {
            "detected": len(all_labels) > 0,
            "labels": all_labels,
            "total": len(all_labels),
            "frame": result.plot(),
            "analysis": spatial_analysis
        }

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
        
        # Track history dictionaries for Behavior Detection
        self.person_tracks = {}
        self.garbage_tracks = {}
        self.next_person_id = 0
        self.next_garbage_id = 0

    def _update_tracks(self, current_persons, current_garbages):
        """
        Updates internal tracking dicts for persons and garbage detections using simple centroid distance.
        """
        import math

        # --- Update Person Tracks ---
        matched_person_indices = set()
        person_ids_to_keep = set()

        for track_id, track in list(self.person_tracks.items()):
            min_dist = float('inf')
            best_idx = -1
            for idx, p in enumerate(current_persons):
                if idx in matched_person_indices:
                    continue
                dist = math.hypot(p["cx"] - track["last_centroid"][0], p["cy"] - track["last_centroid"][1])
                if dist < min_dist:
                    min_dist = dist
                    best_idx = idx

            # Match criteria: threshold of 150px
            if best_idx != -1 and min_dist < 150.0:
                p = current_persons[best_idx]
                track["last_centroid"] = (p["cx"], p["cy"])
                track["history"].append((p["cx"], p["cy"]))
                if len(track["history"]) > 30:
                    track["history"] = track["history"][-30:]
                track["disappeared"] = 0
                track["conf"] = p["conf"]
                track["box"] = (p["x1"], p["y1"], p["x2"], p["y2"])
                matched_person_indices.add(best_idx)
                person_ids_to_keep.add(track_id)
            else:
                track["disappeared"] += 1
                if track["disappeared"] <= 10:
                    person_ids_to_keep.add(track_id)

        self.person_tracks = {tid: self.person_tracks[tid] for tid in person_ids_to_keep}

        for idx, p in enumerate(current_persons):
            if idx not in matched_person_indices:
                track_id = self.next_person_id
                self.next_person_id += 1
                self.person_tracks[track_id] = {
                    "id": track_id,
                    "last_centroid": (p["cx"], p["cy"]),
                    "history": [(p["cx"], p["cy"])],
                    "disappeared": 0,
                    "conf": p["conf"],
                    "box": (p["x1"], p["y1"], p["x2"], p["y2"])
                }

        # --- Update Garbage Tracks ---
        matched_garbage_indices = set()
        garbage_ids_to_keep = set()

        for track_id, track in list(self.garbage_tracks.items()):
            min_dist = float('inf')
            best_idx = -1
            for idx, g in enumerate(current_garbages):
                if idx in matched_garbage_indices:
                    continue
                dist = math.hypot(g["cx"] - track["last_centroid"][0], g["cy"] - track["last_centroid"][1])
                if dist < min_dist:
                    min_dist = dist
                    best_idx = idx

            if best_idx != -1 and min_dist < 120.0:
                g = current_garbages[best_idx]
                track["last_centroid"] = (g["cx"], g["cy"])
                track["history"].append((g["cx"], g["cy"]))
                if len(track["history"]) > 30:
                    track["history"] = track["history"][-30:]
                track["disappeared"] = 0
                track["conf"] = g["conf"]
                track["box"] = (g["x1"], g["y1"], g["x2"], g["y2"])
                matched_garbage_indices.add(best_idx)
                garbage_ids_to_keep.add(track_id)
            else:
                track["disappeared"] += 1
                if track["disappeared"] <= 15:
                    garbage_ids_to_keep.add(track_id)

        self.garbage_tracks = {gid: self.garbage_tracks[gid] for gid in garbage_ids_to_keep}

        for idx, g in enumerate(current_garbages):
            if idx not in matched_garbage_indices:
                track_id = self.next_garbage_id
                self.next_garbage_id += 1
                self.garbage_tracks[track_id] = {
                    "id": track_id,
                    "last_centroid": (g["cx"], g["cy"]),
                    "history": [(g["cx"], g["cy"])],
                    "disappeared": 0,
                    "state": "unknown", # unknown, carrying, dropped, separated
                    "carrying_person_id": None,
                    "stationary_frames": 0,
                    "conf": g["conf"],
                    "box": (g["x1"], g["y1"], g["x2"], g["y2"])
                }

        # --- Update Garbage Track Behavior States ---
        for gid, g_track in self.garbage_tracks.items():
            g_cx, g_cy = g_track["last_centroid"]

            # Phase 1: Carrying detection
            if g_track["state"] == "unknown":
                closest_pid = None
                min_p_dist = float('inf')
                for pid, p_track in self.person_tracks.items():
                    dist = math.hypot(p_track["last_centroid"][0] - g_cx, p_track["last_centroid"][1] - g_cy)
                    if dist < min_p_dist:
                        min_p_dist = dist
                        closest_pid = pid
                
                if closest_pid is not None and min_p_dist < 100.0:
                    g_track["state"] = "carrying"
                    g_track["carrying_person_id"] = closest_pid
                    print(f"[BEHAVIOR] Phase 1 (Carrying): Garbage ID {gid} is being carried by Person ID {closest_pid} (distance: {min_p_dist:.1f}px)")

            # Phase 2: Transition from Carrying to Dropped (Stationary)
            elif g_track["state"] == "carrying":
                if len(g_track["history"]) >= 3:
                    last_three = g_track["history"][-3:]
                    is_still = True
                    for c1 in last_three:
                        for c2 in last_three:
                            if math.hypot(c1[0] - c2[0], c1[1] - c2[1]) > 6.0:
                                is_still = False
                                break
                    if is_still:
                        g_track["stationary_frames"] += 1
                    else:
                        g_track["stationary_frames"] = max(0, g_track["stationary_frames"] - 1)
                
                if g_track["stationary_frames"] >= 4:
                    g_track["state"] = "dropped"
                    print(f"[BEHAVIOR] Phase 2 (Dropped): Garbage ID {gid} became stationary. State set to DROPPED.")

            # Phase 3: Separation & Alert
            elif g_track["state"] == "dropped":
                pid = g_track["carrying_person_id"]
                p_track = self.person_tracks.get(pid) if pid is not None else None

                # Fallback to closest person track if original carrier is lost
                if p_track is None:
                    closest_pid = None
                    min_p_dist = float('inf')
                    for pid_alt, pt in self.person_tracks.items():
                        dist = math.hypot(pt["last_centroid"][0] - g_cx, pt["last_centroid"][1] - g_cy)
                        if dist < min_p_dist:
                            min_p_dist = dist
                            closest_pid = pid_alt
                    if closest_pid is not None:
                        p_track = self.person_tracks[closest_pid]
                
                if p_track is not None:
                    dist_to_person = math.hypot(p_track["last_centroid"][0] - g_cx, p_track["last_centroid"][1] - g_cy)
                    if dist_to_person > 150.0:
                        g_track["state"] = "separated"
                        print(f"[ALERT] Illegal Dumping Detected! Person walked away from Garbage ID {gid} (Distance: {dist_to_person:.1f}px)")
                else:
                    g_track["state"] = "separated"
                    print(f"[ALERT] Illegal Dumping Detected! Person who dropped Garbage ID {gid} left the frame.")

    def detect_frame(self, frame):
        """
        Evaluates the frame to deduce violation states using spatial relationships and temporal tracking.
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
            
            det = {"label": label, "conf": conf, "cx": cx, "cy": cy, "x1": x1, "y1": y1, "x2": x2, "y2": y2}
            
            if label == "person":
                persons.append(det)
            elif label == "garbage":
                garbages.append(det)
            elif label == "dustbin":
                dustbins.append(det)

        person_detected = len(persons) > 0
        garbage_detected = len(garbages) > 0
        dustbin_detected = len(dustbins) > 0

        # Update centroid tracking & behavior state machine
        self._update_tracks(persons, garbages)
        
        event_detected = False
        classification = "NO_EVENT"
        reason = "Monitoring environment..."
        confidence_score = 0.0
        distance = None
        
        # Analyze state of tracked garbage
        has_separated = False
        has_dropped = False
        has_carrying = False
        active_gid = None

        for gid, g_track in self.garbage_tracks.items():
            if g_track["state"] == "separated":
                has_separated = True
                active_gid = gid
                break
            elif g_track["state"] == "dropped":
                has_dropped = True
                active_gid = gid
            elif g_track["state"] == "carrying":
                has_carrying = True
                active_gid = gid

        import math

        if has_separated and active_gid is not None:
            g_cx, g_cy = self.garbage_tracks[active_gid]["last_centroid"]
            g_conf = self.garbage_tracks[active_gid]["conf"]

            if dustbin_detected:
                nearest_dist = float('inf')
                nearest_d_conf = 0.0
                for d in dustbins:
                    dist = math.hypot(g_cx - d["cx"], g_cy - d["cy"])
                    if dist < nearest_dist:
                        nearest_dist = dist
                        nearest_d_conf = d["conf"]
                
                distance = nearest_dist
                confidence_score = (g_conf + nearest_d_conf) / 2.0
                
                if distance <= 200.0:
                    classification = "LEGAL"
                    reason = f"Garbage dropped near dustbin (distance: {distance:.1f}px <= 200px)."
                    event_detected = True
                else:
                    classification = "ILLEGAL"
                    reason = f"Garbage dropped far from dustbin (distance: {distance:.1f}px > 200px)."
                    event_detected = True
                    print("[ALERT] Illegal Dumping Detected!")
            else:
                classification = "ILLEGAL"
                reason = "Garbage dropped, but no dustbin present in the area."
                event_detected = True
                confidence_score = g_conf
                print("[ALERT] Illegal Dumping Detected!")

        elif has_dropped:
            classification = "HOLDING"
            reason = "Garbage is dropped but the person is still in close proximity."
            confidence_score = self.garbage_tracks[active_gid]["conf"]

        elif has_carrying:
            classification = "HOLDING"
            reason = "Person is currently carrying the garbage."
            confidence_score = self.garbage_tracks[active_gid]["conf"]

        else:
            # Fallback behavior if detections exist but state machine hasn't locked on
            if person_detected or garbage_detected:
                if person_detected:
                    confidence_score = persons[0]["conf"]
                if garbage_detected:
                    confidence_score = garbages[0]["conf"]
            else:
                confidence_score = 1.0

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

        # Draw overlays on frame to make it dynamic and visually premium
        annotated = result.plot()
        import cv2

        # Draw Person tracking circles and boxes (patience logic to avoid flickering)
        for pid, p_track in self.person_tracks.items():
            cx, cy = int(p_track["last_centroid"][0]), int(p_track["last_centroid"][1])
            
            # Bounding box persistence: If missed in the current frame, draw the last known box
            if p_track["disappeared"] > 0 and "box" in p_track:
                x1, y1, x2, y2 = map(int, p_track["box"])
                cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 255), 2)
                
            cv2.circle(annotated, (cx, cy), 6, (0, 255, 255), -1)
            cv2.putText(annotated, f"Person {pid}", (cx - 15, cy - 12),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 255), 1, cv2.LINE_AA)

        # Draw Garbage tracking circles, boxes & connections (patience logic to avoid flickering)
        for gid, g_track in self.garbage_tracks.items():
            cx, cy = int(g_track["last_centroid"][0]), int(g_track["last_centroid"][1])
            state = g_track["state"]
            
            # Select color based on state
            if state == "carrying":
                color = (0, 255, 0)      # Green (Carried)
            elif state == "dropped":
                color = (0, 165, 255)    # Orange (Dropped/Stationary)
            elif state == "separated":
                color = (0, 0, 255)      # Red (Separated - Alert)
            else:
                color = (200, 200, 200)  # Gray (Unknown)

            # Bounding box persistence: If missed in the current frame, draw the last known box
            if g_track["disappeared"] > 0 and "box" in g_track:
                x1, y1, x2, y2 = map(int, g_track["box"])
                cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

            cv2.circle(annotated, (cx, cy), 6, color, -1)
            cv2.putText(annotated, f"Garbage {gid} ({state.upper()})", (cx - 20, cy - 12),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv2.LINE_AA)

            # Draw separation distance line to carrier if tracked
            pid = g_track["carrying_person_id"]
            if pid is not None and pid in self.person_tracks:
                px, py = int(self.person_tracks[pid]["last_centroid"][0]), int(self.person_tracks[pid]["last_centroid"][1])
                dist = math.hypot(px - cx, py - cy)
                cv2.line(annotated, (cx, cy), (px, py), (150, 150, 150), 1, cv2.LINE_AA)
                cv2.putText(annotated, f"{dist:.0f}px", ((cx + px)//2, (cy + py)//2),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.35, (150, 150, 150), 1, cv2.LINE_AA)

        return {
            "detected": len(all_labels) > 0,
            "labels": all_labels,
            "total": len(all_labels),
            "frame": annotated,
            "analysis": spatial_analysis
        }

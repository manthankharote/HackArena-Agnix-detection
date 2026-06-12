"""
Module: camera.py
Role: Remote Visual Sensor Interfacing.
Description: Implements real-time VideoStream bindings supporting multiple 
protocols with embedded multithreading to eliminate inference latency bottlenecks.
"""



import os
# Suppress underlying decoder verbosity to ensure pristine validator extraction.
os.environ["OPENCV_FFMPEG_LOGLEVEL"] = "-8"
os.environ["OPENCV_LOG_LEVEL"] = "OFF"

import cv2
import sys
import time
import threading
import subprocess


def extract_youtube_stream(url):
    """
    Translates raw YouTube identifiers into direct RTSP broadcast protocols.
    
    Parameters:
        url (str): The external remote streaming link.
        
    Returns:
        tuple: Extracted source URL map and boolean indicating live status.
    """
    print(f"[SYSTEM] Extracting YouTube stream: {url}")
    try:
        cmd = [
            "yt-dlp",
            "-f", "best[height<=480][ext=mp4]/best[height<=480]/worst",
            "-g", "--no-playlist",
            url,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        stream_url = result.stdout.strip()

        # Validate whether the broadcast is an ongoing live session.
        cmd_live = ["yt-dlp", "--get-filename", "-o", "%(is_live)s", url]
        is_live = subprocess.run(cmd_live, capture_output=True, text=True).stdout.strip() == "True"

        return stream_url, is_live
    except Exception as e:
        print(f"[ERROR] Subprocess yt-dlp failed during extraction: {e}")
        return None, False


class VideoStream:
    """
    Asynchronous frame acquisition buffer running on a decoupled thread.
    Continuously acquires state configurations, ensuring the primary logic process 
    observes the absolute most recent image sensor vector without I/O blocking.
    """

    def __init__(self, src, backend=None):
        """
        Preallocates streaming handles corresponding to requested inputs.
        """
        if backend is not None:
            self.stream = cv2.VideoCapture(src, backend)
        elif isinstance(src, str) and (src.startswith("http") or src.startswith("rtsp")):
            self.stream = cv2.VideoCapture(src, cv2.CAP_FFMPEG)
        else:
            self.stream = cv2.VideoCapture(src)

        self.stream.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self.grabbed = False
        self.frame = None
        self.lock = threading.Lock()
        self.stopped = False

        if self.stream.isOpened():
            self.grabbed, self.frame = self.stream.read()
            self.thread = threading.Thread(target=self._update, daemon=True)
            self.thread.start()

    def _update(self):
        """
        A background process looping to synchronize the internal array buffers.
        """
        while not self.stopped:
            try:
                grabbed, frame = self.stream.read()
                with self.lock:
                    self.grabbed = grabbed
                    self.frame = frame
                if not grabbed:
                    time.sleep(0.1)
            except Exception:
                with self.lock:
                    self.grabbed = False
                time.sleep(0.5)

    def read(self):
        """
        Retrieves a serialized copy of the current state vector.
        """
        with self.lock:
            if self.frame is not None:
                return self.grabbed, self.frame.copy()
            return False, None

    def isOpened(self):
        """
        Validates socket readiness configurations.
        """
        return self.stream.isOpened()

    def release(self):
        """
        Safely disposes thread allocations and terminates sensor handles.
        """
        self.stopped = True
        self.stream.release()

    def set(self, prop, val):
        """
        Modifies localized configuration parameters on the capture class.
        """
        self.stream.set(prop, val)


def open_source(source, url=None, file=None):
    """
    Interrogates spatial logic environments to instantiate appropriate drivers.

    Parameters:
        source (str): Identifier defining "webcam", "droidcam", "rtsp", "youtube", or "video".
        url (str): Remote socket targeting droidcam/rtsp/youtube inputs.
        file (str): Local pathway targeting discrete video artifact mappings.
        
    Returns:
        tuple: Generated VideoStream architecture, descriptive labels, and reconnect targets.
    """
    if source == "webcam":
        cap = None
        backends = [
            (cv2.CAP_DSHOW, "DirectShow"),
            (cv2.CAP_MSMF, "MSMF"),
            (cv2.CAP_ANY, "Auto"),
        ]
        for backend, name in backends:
            for idx in range(3):
                print(f"[SYSTEM] Validating local sensor arrays: index {idx} ({name})...")
                test = cv2.VideoCapture(idx, backend)
                if test.isOpened():
                    ret, frm = test.read()
                    test.release()
                    if ret and frm is not None:
                        cap = VideoStream(idx, backend)
                        print(f"[SYSTEM] Hardware sensor established: index {idx} ({name})")
                        return cap, f"Webcam (index {idx})", str(idx)
                else:
                    test.release()

        print("\n[ERROR] Hardware sensor array initialization failed.")
        print("[DEBUG] Manual intervention recommended for fallback interfaces.")
        sys.exit(1)

    elif source == "droidcam":
        if not url:
            print("[ERROR] Parameter '--url' strictly required for DroidCam architectures.")
            sys.exit(1)
        cap = VideoStream(url)
        if not cap.isOpened():
            for suffix in ["/video", "/mjpegfeed"]:
                test_url = url.rstrip('/') + suffix
                print(f"[SYSTEM] Probing alternative sockets: {test_url}")
                cap = VideoStream(test_url)
                if cap.isOpened():
                    url = test_url
                    break
        return cap, f"DroidCam ({url})", url

    elif source == "rtsp":
        if not url:
            print("[ERROR] Parameter '--url' strictly required for RTSP protocols.")
            sys.exit(1)
        return VideoStream(url), f"RTSP ({url})", url

    elif source == "youtube":
        if not url:
            print("[ERROR] Parameter '--url' strictly required for YouTube routing.")
            sys.exit(1)
        stream_url, is_live = extract_youtube_stream(url)
        if not stream_url:
            print("[ERROR] Deserialization failure across upstream extractors.")
            sys.exit(1)
        print(f"[SYSTEM] Direct stream target acquired successfully.")
        print(f"[SYSTEM] Source paradigm: {'Live Broadcast' if is_live else 'Pre-rendered Broadcast'}")
        return VideoStream(stream_url), f"YouTube ({url})", url

    elif source == "video":
        if not file:
            print("[ERROR] Parameter '--file' strictly required for discrete media access.")
            sys.exit(1)
        return VideoStream(file), f"Video ({file})", file

    else:
        print(f"[ERROR] Unrecognized mapping designation encountered: {source}")
        sys.exit(1)

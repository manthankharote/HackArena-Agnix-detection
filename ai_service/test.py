import numpy as np
from detector import GarbageDetector

if __name__ == "__main__":
    detector = GarbageDetector()
    print("Model loaded successfully.")
    
    # Create a dummy image
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    res = detector.detect_frame(dummy_frame)
    
    import json
    print("\n[SPATIAL ANALYSIS EXECUTION RESULT]")
    print(json.dumps(res["analysis"], indent=2))
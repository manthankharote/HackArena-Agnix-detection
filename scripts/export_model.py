import os
from ultralytics import YOLO

def main():
    # Construct the absolute path to best.pt
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, "..", "ai_service", "best.pt")
    
    print(f"Loading YOLO model from: {model_path}")
    model = YOLO(model_path)
    
    print("Exporting model to ONNX format...")
    # Exporting the model to ONNX
    # This will automatically create best.onnx in the same directory as best.pt
    export_path = model.export(format="onnx")
    
    print(f"ONNX Model exported successfully to: {export_path}")

if __name__ == "__main__":
    main()

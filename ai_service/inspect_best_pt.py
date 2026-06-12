from ultralytics import YOLO


def inspect_model(model_path=None):
    if model_path is None:
        import os
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "best.pt")
    print("\n" + "="*50)
    print(f"🔍 INSPECTING MODEL: {model_path}")
    print("="*50)
    
    try:
        model = YOLO(model_path)
        
        # 1. Class Information
        print(f"\n🏷️  CLASS NAMES ({len(model.names)}):")
        for idx, name in model.names.items():
            print(f"   [{idx}] : {name}")
            
        # 2. Model Architecture
        print(f"\n🏗️  MODEL INFO:")
        print(f"   - Task type: {model.task}")
        if hasattr(model, 'ckpt'):
            # Some info might be in the checkpoint
            ckpt = model.ckpt
            if 'epoch' in ckpt:
                print(f"   - Trained for: {ckpt['epoch']} epochs")
            if 'date' in ckpt:
                print(f"   - Created on: {ckpt['date']}")
                
        # 3. Training config (if available)
        if hasattr(model, 'overrides'):
            imgsz = model.overrides.get('imgsz', 'default (640)')
            print(f"   - Input image size: {imgsz}")
            
        print("\n" + "="*50)
        
    except Exception as e:
        print(f"❌ Error inspecting model: {e}")

if __name__ == "__main__":
    inspect_model()

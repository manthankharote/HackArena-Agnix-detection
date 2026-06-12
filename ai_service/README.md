# AI Environment for Illegal Dumping Detection

## Problem Statement
Municipalities struggle to catch and prevent illegal garbage dumping using manual CCTV surveillance, which is computationally exhaustive and subjective. Without an automated methodology to grade system responses, evaluating AI inference patterns over time remains difficult.

## Solution Overview
This repository hosts an **OpenEnv-compatible** Python framework that integrates seamlessly with a custom YOLOv8 model. The environment evaluates agent decision-making across simulated camera streams—grading whether the system accurately alerts, logs, or safely ignores community areas based on real-time visual ground truth.

## Core Tasks
The environment simulates three layered challenge tiers:
1. **Garbage Detection (Easy):** Identify if static garbage is present in the current frame buffer.
2. **Dumping Detection (Medium):** Identify dynamic scenarios where individuals are actively engaging in illegal dumping.
3. **Risk Prediction (Hard):** Analyze the scene context to predict the likelihood of future municipal infractions.

## I/O Specifications

### Action Space
Discrete action space `Discrete(3)` dictating the agent's response to an observation:
- `0`: **Ignore** - Take no action and conserve resources.
- `1`: **Detect** - Run AI validation protocol but hold municipal alerts.
- `2`: **Alert** - Trigger an official dumping violation alert.

### Observation Space
Observations return immediate structural matrices (`numpy.ndarray`) representing the camera frame, backed by an optional JSON schema reporting:
- Visual bounding boxes (`bbox`, `confidence`, `label`).
- Contextual environment flags (`has_garbage`, `is_dumping`, `high_risk`).

### Reward Logic
Agent rewards are granted based on the mapping of its action against the environmental truth:
- **Correct (+1.0):** Alerting when garbage is present, or safely ignoring clear frames.
- **Partial (+0.5):** Opting to run detection routines when garbage is present, failing to escalate to authorities but acknowledging the target.
- **Wrong (0.0):** Ignoring an active dumping event, or firing false-positive alerts on clean sites.

---

## How to Run

### Option 1: Docker (Recommended)
You can run the environment in a fully containerized, headless setup:
```bash
# 1. Build the lightweight image
docker build -t openenv-garbage .

# 2. Run the inference validations
docker run --rm openenv-garbage
```

### Option 2: Local Python Runtime
Ensure you are running Python 3.10+.
```bash
# 1. Install required packages
pip install -r requirements.txt

# 2. Execute inference script
python inference.py
```

---
title: Illegal Garbage Dumping Detection
emoji: 🗑️
colorFrom: red
colorTo: yellow
sdk: docker
pinned: false
---

<div align="center">
  <img src="https://res.cloudinary.com/dim2u2lq2/image/upload/v1775763280/banner_nyjov0.png" alt="AgniX Banner" width="100%">
</div>

# 🗑️ AgniX: Autonomous AI Agent for Illegal Dumping Detection

Team AgniX presents an autonomous, AI-powered municipal surveillance system designed to help city authorities and municipal corporations detect, analyze, and eliminate illegal garbage dumping in real-time.

---

## 🚀 Live Links & Project Assets
- **🤖 Live Environment (Hugging Face):** [AgniX OpenEnv Space](https://huggingface.co/spaces/manthankharote/illegal-dumping-env)
- **🎯 Core Objective:** Automate municipal reporting, reduce manual CCTV monitoring, and enable zero-latency response to civic violations.

---

## 📸 The System in Action (Visual Proof)

### 1. Real-World Utility: Automated WhatsApp Alerts
*Instead of just logging data to a terminal, our system integrates with a Node.js backend utilizing **whatsapp-web.js** to dispatch real-time WhatsApp alerts to municipal authorities the moment illegal dumping is verified.*

<img src="https://res.cloudinary.com/dim2u2lq2/image/upload/v1776021008/Screenshot_20260413_003738_cnigc1.jpg" alt="WhatsApp Alert" width="400">

### 2. Technical Compliance: Automated Checks Passed
*Our environment and agent logic have successfully passed all strict criteria for **Phase 1 (Automated Validation)** and **Phase 2 (Agentic Evaluation)**, proving our system's Docker stability, deterministic grading, and OpenEnv spec compliance.*

<img src="https://res.cloudinary.com/dim2u2lq2/image/upload/v1776020741/Screenshot_2026-04-13_003335_fuezjs.png" alt="Validation Success" width="800">

---

## 🧠 Technical Architecture

Our system bridges the gap between passive computer vision and active reinforcement learning:

1. **👀 Vision Engine (Observation):** A custom-trained `YOLOv11` model scans CCTV feeds/images for waste anomalies (garbage bags, construction debris).
2. **🤖 RL Framework (Environment):** Built strictly on the **OpenEnv** framework. It manages state transitions and provides sensory inputs to the agent.
3. **🧠 Reasoning (Policy):** The agent evaluates the spatial risk and uses **LiteLLM proxy** to validate context before executing an action.
4. **⚡ Action (Communication):** Upon identifying a high-risk dumping event, the agent executes Action 2 (Alert), triggering a localized webhook.
5. **📲 Dispatch (Utility):** The **whatsapp-web.js** engine formats the payload and sends an instant WhatsApp message with the zone and confidence score.

---

## 🌟 Why This Matters (The Impact)
- **Zero-Latency Monitoring:** 24/7 automated observation of public spaces without human fatigue.
- **Contextual Awareness:** The agent distinguishes between a clean street and active dumping violations.
- **Immediate Response:** Reduces authority response time from days to mere seconds, bridging the gap between AI detection and human action.

---

## 📦 Local Setup & Validation

```bash
# 1. Clone the repository
git clone [https://github.com/manthankharote/Illegal-Dumping-Detection.git](https://github.com/manthankharote/Illegal-Dumping-Detection.git)
cd Illegal-Dumping-Detection

# 2. Install dependencies
pip install -r requirements.txt



# CartSyncAI Local LLM Model Registry

This document lists the local AI models loaded via Ollama, along with resource footprints, limits, and system workloads.

---

## 1. Model Specifications & Recommendation Matrix

| Model Identifier | Purpose within System | Expected RAM | Expected VRAM | Context Window | Recommended Use Case |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **`qwen3:8b`** | Primary Supervisor Agent | ~8.0 GB | ~5.8 GB | 32,768 tokens | Orchestrating multi-turn styling recommendations, managing try-ons, and generating general answers. |
| **`qwen3:4b`** | Fast Sizing Classifier | ~4.5 GB | ~3.1 GB | 32,768 tokens | Fast parallel execution of body shape matching, size chart parsing, and fit scoring. |
| **`qwen2.5-coder:7b`**| Development & Automation | ~7.2 GB | ~5.2 GB | 128,000 tokens | Handling local developer diagnostic commands, system health audits, and self-repair scripting. |
| **`nomic-embed-text`**| Semantic Text Search | ~1.2 GB | ~0.5 GB | 8,192 tokens | Generating garment descriptions and query text embedding vectors for catalog recommendation searches. |
| **`llama3.1:8b`** | Secondary Supervisor / Agent | ~8.2 GB | ~6.1 GB | 128,000 tokens | Redundant pipeline processing, long-term memory summarization, and detailed styling dialogs. |
| **`llava:7b`** | Vision Model | ~8.0 GB | ~5.5 GB | 4,096 tokens | Optional image understanding, garment color/pattern extraction, and silhouette analysis. |

---

## 2. Resource Constraints (RTX 5060 8GB / 24GB System RAM)

* **VRAM Allocations:**
  * To run models simultaneously without thrashing VRAM, the active model is loaded into GPU memory, while inactive models are offloaded by Ollama.
  * `qwen3:8b` ($5.8$ GB) and `nomic-embed-text` ($0.5$ GB) can fit concurrently on the RTX 5060 ($8.0$ GB limit).
* **System RAM Allocations:**
  * 24GB system RAM is more than sufficient to cache all models in disk cache for near-instant switching.

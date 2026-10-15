# CartSync v0.2: AI Stylist & Intelligence (Roadmap)

## Overview
With v0.1 Foundation Complete, the focus shifts entirely from architecture mapping to **User Experience, Polish, and Intelligence**. We are deferring Commerce and Virtual Try-On to focus exclusively on creating a delightful user experience around measurements and the AI Stylist.

## Track 1: Stabilization Sprint (Engineering Quality)
*To be executed concurrently with feature development.*

1. **Alembic Database Migrations**: Replace automatic table creation with versioned migrations.
2. **Structured Logging**: Implement JSON logging (request_id, user_id, latency, status) across FastAPI.
3. **Request Correlation IDs**: Propagate a unique request ID from Browser → Next.js → FastAPI.
4. **Rate Limiting**: Protect authentication and measurement APIs.
5. **Security Hardening**: Enforce Strict HttpOnly cookies, CSP headers, and audit logging.
6. **Background Jobs**: Prepare for Async Measurement extraction (Upload → Queue → Worker).
7. **CI/CD Pipeline**: GitHub actions for API versions, formatting, and linting.

## Track 2: Milestone 2 Sprints

### Sprint 1: Professional Dashboard
* **Goal**: Transform the UI from raw data to an actual product.
* **Features**:
  * Body Measurement Summary & Confidence visualization.
  * Profile Completion & Recent Activity feeds.
  * Measurement History tracking.

### Sprint 2: AI Stylist (First Version)
* **Goal**: Connect the AI Stylist to the Knowledge Graph for explainability.
* **Features**:
  * "What size should I wear?" deterministic Q&A.
  * "Which brands fit me best?"
  * Explainable recommendations built on top of the Knowledge Graph.

### Sprint 3: Product Engine
* **Goal**: First deterministic recommendation engine.
* **Features**:
  * Input: Effective measurements + Brand affinity + Preferences.
  * Output: Recommended size, fit explanation, confidence, alternative sizes.

### Sprint 4: Real Measurement Engine
* **Goal**: Replace the mocked math pipeline with real Computer Vision models.
* **Features**:
  * Camera pipeline integration.
  * Pose estimation & Landmark extraction.
  * Scale estimation & Calibration.

## Versioning Path
* **v0.1**: Foundation ✅
* **v0.2**: AI Stylist & Knowledge Graph UX 🎯 *(Current Focus)*
* **v0.3**: Camera Measurement
* **v0.4**: Virtual Try-On
* **v0.5**: Commerce
* **v1.0**: Production Release

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from config.settings import settings
from api.routes import jobs, dashboard
from api.middleware import logging_middleware

app = FastAPI(
    title=settings.runtime.API_TITLE,
    version=settings.runtime.API_VERSION,
    description="Backend API for AI Measurement Processing pipeline"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to actual frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Middlewares
app.add_middleware(BaseHTTPMiddleware, dispatch=logging_middleware)

# Routes
app.include_router(jobs.router)
app.include_router(dashboard.router)

@app.get("/health", tags=["system"])
async def health_check():
    """Liveness probe"""
    return {"status": "healthy", "version": settings.runtime.API_VERSION}

@app.get("/ready", tags=["system"])
async def readiness_check():
    """Readiness probe"""
    return {"status": "ready", "models_loaded": True}

@app.get("/metrics", tags=["system"])
async def metrics_check():
    """System metrics probe"""
    return {"status": "healthy", "queue_depth": 0, "active_workers": 0}

@app.get("/version", tags=["system"])
async def version_check():
    """Model versions probe"""
    return {
        "api": settings.runtime.API_VERSION,
        "models": {
            "mediapipe": settings.models.MEDIAPIPE_VERSION,
            "depth": settings.models.DEPTH_MODEL,
            "engine": settings.models.MEASUREMENT_ENGINE_VERSION,
            "avatar": settings.models.AVATAR_MODEL
        }
    }

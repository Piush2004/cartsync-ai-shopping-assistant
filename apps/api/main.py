import math
from fastapi import FastAPI
from routers import auth, measurement, graph, stylist, product_intelligence, conversation, testing, compute, vton, link_import
import models
import logging
import uuid
import time
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from contextvars import ContextVar
from pythonjsonlogger import jsonlogger

# Context variable for correlation ID
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")

# Setup JSON Logger
logger = logging.getLogger("cartsync")
logger.setLevel(logging.INFO)
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s')
logHandler.setFormatter(formatter)
if not logger.handlers:
    logger.addHandler(logHandler)

# Base.metadata.create_all(bind=engine)  # Now managed by Alembic

from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.rate_limit import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

app = FastAPI(title="CartSync AI", version="0.1.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# NOTE: allow_origins=["*"] combined with allow_credentials=True is a real
# vulnerability, not a dev convenience: Starlette reflects the request's Origin
# header back verbatim in that combination, so any site can make cookie/token
# bearing requests to this API from a victim's browser. Origins must be an
# explicit allowlist whenever credentials are allowed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ALLOWED_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(measurement.router, prefix="/api/v1/measurement", tags=["measurement"])
app.include_router(graph.router, prefix="/api/v1/graph", tags=["graph"])
app.include_router(stylist.router, prefix="/api/v1/stylist", tags=["stylist"])
app.include_router(product_intelligence.router, prefix="/api/v1/product-intelligence", tags=["product_intelligence"])
app.include_router(conversation.router, prefix="/api/v1/conversation", tags=["conversation"])
app.include_router(testing.router, prefix="/api/v1/testing", tags=["testing"])
app.include_router(compute.router, prefix="/api/v1/compute", tags=["compute"])
app.include_router(vton.router, prefix="/api/v1/vton", tags=["vton"])
app.include_router(link_import.router, prefix="/api/v1/link-import", tags=["link_import"])

def _sanitize_non_finite(obj):
    # Request bodies may contain non-standard NaN/Infinity JSON literals (the
    # stdlib json parser accepts them on the way in). Starlette's JSONResponse
    # rejects them with allow_nan=False on the way out, which turns a validation
    # error into an unhandled 500 the moment the offending value is echoed back
    # in the error detail. Stringify them so the error response can always render.
    if isinstance(obj, float) and not math.isfinite(obj):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _sanitize_non_finite(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize_non_finite(v) for v in obj]
    return obj


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": _sanitize_non_finite(jsonable_encoder(exc.errors()))},
    )


@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    # Retrieve or generate request ID
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request_id_ctx.set(req_id)
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Log the request details
    logger.info("Request processed", extra={
        "request_id": req_id,
        "method": request.method,
        "url": str(request.url),
        "status": response.status_code,
        "latency_ms": round(process_time * 1000, 2)
    })
    
    response.headers["X-Request-ID"] = req_id
    return response

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}

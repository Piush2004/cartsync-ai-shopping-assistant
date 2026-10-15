import time
from fastapi import Request
from utils.logger import logger

async def logging_middleware(request: Request, call_next):
    start_time = time.time()
    
    # Process request
    try:
        response = await call_next(request)
        process_time_ms = (time.time() - start_time) * 1000
        
        logger.info(
            "API Request", 
            method=request.method, 
            url=str(request.url),
            status_code=response.status_code,
            duration_ms=round(process_time_ms, 2)
        )
        
        return response
    except Exception as e:
        process_time_ms = (time.time() - start_time) * 1000
        logger.error(
            "API Request Failed", 
            method=request.method, 
            url=str(request.url),
            error=str(e),
            duration_ms=round(process_time_ms, 2)
        )
        raise

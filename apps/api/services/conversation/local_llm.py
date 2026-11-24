from typing import Optional

import httpx

from core.config import settings

# Short: the model only rewords facts it was handed, it does not reason
# its way to a size.
_MAX_TOKENS = 220


def ask_local_model(prompt: str) -> Optional[str]:
    """
    Asks the local Ollama model to word an answer. Returns None on any
    failure (Ollama not running, model missing, timeout, empty reply) so
    the caller falls back to the rules-based answer -- the chat must always
    answer, the model only makes the wording better when it is reachable.
    """
    if not settings.LOCAL_LLM_URL:
        return None
    try:
        response = httpx.post(
            f"{settings.LOCAL_LLM_URL.rstrip('/')}/api/generate",
            json={
                "model": settings.LOCAL_LLM_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"num_predict": _MAX_TOKENS, "temperature": 0.3},
            },
            timeout=settings.LOCAL_LLM_TIMEOUT_SECONDS,
        )
        if response.status_code != 200:
            return None
        text = (response.json().get("response") or "").strip()
        return text or None
    except (httpx.HTTPError, ValueError):
        return None

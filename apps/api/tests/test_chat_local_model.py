"""
Tests for the stylist chat's local-model path. No test here talks to a real
model: the engine takes the model as a plain callable, and conftest.py turns
the real one off for every test.
"""
import uuid

import httpx

from conftest import register_and_login
from core.config import settings
from models.graph import BrandAffinity, UserPreference
from models.user import User
from services.conversation import ConversationEngine
from services.conversation import local_llm


def _ask(llm):
    return ConversationEngine.process_message(
        question="What size should I buy?",
        history=[],
        user_profile={"preferred_fit": "Regular", "favorite_brands": []},
        get_stylist_rec=lambda: {"size": "M", "confidence": 0.9},
        get_product_rec=lambda: [],
        llm=llm,
    )


def test_model_answer_is_used_when_the_model_replies():
    response = _ask(lambda prompt: "Go for a medium.")
    assert response.answer == "Go for a medium."
    assert response.answered_by == "model"


def test_falls_back_to_rules_when_the_model_returns_nothing():
    response = _ask(lambda prompt: None)
    assert "size M" in response.answer
    assert response.answered_by == "rules"


def test_falls_back_to_rules_when_no_model_is_given():
    assert _ask(None).answered_by == "rules"


def test_model_is_handed_the_size_and_told_not_to_change_it():
    seen = {}

    def capture(prompt):
        seen["prompt"] = prompt
        return "ok"

    _ask(capture)
    assert "Size: M" in seen["prompt"]
    assert "do not change it" in seen["prompt"]


def test_ask_local_model_returns_none_when_ollama_is_unreachable(monkeypatch):
    monkeypatch.setattr(settings, "LOCAL_LLM_URL", "http://localhost:11434")

    def refuse(*args, **kwargs):
        raise httpx.ConnectError("connection refused")

    monkeypatch.setattr(local_llm.httpx, "post", refuse)
    assert local_llm.ask_local_model("hi") is None


def test_ask_local_model_returns_none_when_turned_off(monkeypatch):
    monkeypatch.setattr(settings, "LOCAL_LLM_URL", "")
    assert local_llm.ask_local_model("hi") is None


def test_chat_does_not_crash_for_a_user_with_a_saved_fit_preference_and_brand(auth_client, db_session):
    # Regression: the router read p.category / p.value / b.brand_name, which
    # don't exist on these models, so chat 500'd for exactly the users who
    # had set the app up properly.
    email = "chat-with-prefs@example.com"
    token = register_and_login(auth_client, email=email)
    user = db_session.query(User).filter(User.email == email).first()
    db_session.add(UserPreference(id=str(uuid.uuid4()), user_id=user.id, fit_preference="Relaxed"))
    db_session.add(BrandAffinity(id=str(uuid.uuid4()), user_id=user.id, brand_id="zara", affinity_score=0.9))
    db_session.commit()

    resp = auth_client.post(
        "/api/v1/conversation/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"question": "What size should I buy?"},
    )

    assert resp.status_code == 200, resp.text
    assert resp.json()["answered_by"] == "rules"

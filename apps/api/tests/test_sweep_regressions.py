"""
Regressions found by a full run-through of the website and the phone app.

* Product list returned a 500 once a fit preference or favourite brand was saved.
* The website's manual measurement form lost hips and shoulders.
* The stylist chat told people with saved measurements to add them, could not
  read their chest back, and got the direction of a brand size wrong.
"""
import uuid

import pytest

from models.graph import BrandAffinity, UserPreference
from models.measurement import EffectiveMeasurement
from routers import conversation as conversation_router
from services.conversation import ConversationEngine
from services.conversation.prompt_builder import PromptBuilder, _brand_facts
from services.conversation.types import AIContext, Intent

USER = "fixture-test-user"


def _seed(db_session, chest=98.0, waist=82.0):
    db_session.add(EffectiveMeasurement(
        id=str(uuid.uuid4()), user_id=USER,
        chest_circumference=chest, waist_circumference=waist,
        hip_circumference=100.0, inseam=80.0, shoulder_width=45.0,
        confidence_score=1.0,
    ))
    db_session.commit()


# ---------- product list ----------
def test_product_list_works_with_a_saved_fit_preference(client, db_session):
    _seed(db_session)
    db_session.add(UserPreference(id=str(uuid.uuid4()), user_id=USER, fit_preference="Relaxed"))
    db_session.commit()
    resp = client.get("/api/v1/product-intelligence/recommendations")
    assert resp.status_code == 200, resp.text
    products = {p["product"]["id"]: p for p in resp.json()["products"]}
    # The saved preference now counts: a relaxed product outscores a slim one.
    assert products["nike_air_tee"]["fit_score"] > products["nike_pro_tight"]["fit_score"]
    assert any("relaxed" in r.lower() for r in products["nike_air_tee"]["reason"])


def test_product_list_works_with_a_favourite_brand_and_matches_it_in_any_case(client, db_session):
    _seed(db_session)
    # brand_id is stored lowercase; the catalog says "Zara".
    db_session.add(BrandAffinity(id=str(uuid.uuid4()), user_id=USER, brand_id="zara", affinity_score=0.9))
    db_session.commit()
    resp = client.get("/api/v1/product-intelligence/recommendations")
    assert resp.status_code == 200, resp.text
    products = {p["product"]["id"]: p for p in resp.json()["products"]}
    assert any("favorite brand Zara" in r for r in products["zara_essential_tee"]["reason"])
    assert products["zara_essential_tee"]["fit_score"] > products["nike_pro_tight"]["fit_score"]


def test_product_list_ignores_a_weak_brand_affinity(client, db_session):
    _seed(db_session)
    db_session.add(BrandAffinity(id=str(uuid.uuid4()), user_id=USER, brand_id="zara", affinity_score=0.2))
    db_session.add(BrandAffinity(id=str(uuid.uuid4()), user_id=USER, brand_id="nike", affinity_score=None))
    db_session.commit()
    resp = client.get("/api/v1/product-intelligence/recommendations")
    assert resp.status_code == 200, resp.text
    for p in resp.json()["products"]:
        assert not any("favorite brand" in r for r in p["reason"])


# ---------- measurements from the website form ----------
def test_plural_hips_and_shoulders_from_the_old_website_form_are_kept(client, db_session):
    resp = client.post("/api/v1/measurement/extract", json={
        "source_type": "manual_entry",
        "raw_data": {"height": 172, "chest": 98, "waist": 82, "hips": 100, "shoulders": 45, "inseam": 80},
    })
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["hip_circumference"] == 100
    assert body["shoulder_width"] == 45


def test_singular_hip_and_shoulder_still_work_and_win_over_plural(client, db_session):
    resp = client.post("/api/v1/measurement/extract", json={
        "source_type": "manual",
        "raw_data": {"chest": 98, "waist": 82, "hip": 101, "hips": 55, "shoulder": 46, "shoulders": 55},
    })
    assert resp.status_code == 200, resp.text
    assert resp.json()["hip_circumference"] == 101
    assert resp.json()["shoulder_width"] == 46


def test_missing_hip_and_shoulder_stay_empty_not_invented(client, db_session):
    resp = client.post("/api/v1/measurement/extract", json={
        "source_type": "manual", "raw_data": {"chest": 98, "waist": 82},
    })
    assert resp.status_code == 200, resp.text
    assert resp.json()["hip_circumference"] is None
    assert resp.json()["shoulder_width"] is None


# ---------- the stylist chat ----------
def _capture_prompt(monkeypatch):
    seen = {}

    def fake_model(prompt):
        seen["prompt"] = prompt
        return "ok"

    monkeypatch.setattr(conversation_router, "ask_local_model", fake_model)
    return seen


def _chat(client, question):
    resp = client.post("/api/v1/conversation/chat", json={"question": question})
    assert resp.status_code == 200, resp.text
    return resp


@pytest.mark.parametrize("question", [
    "I want oversized clothes",        # "preferences" intent used to skip the size
    "What is my chest size?",
    "Why did my size change?",         # "measurement" intent
    "Hello there",                     # "general" intent
])
def test_every_kind_of_question_gets_the_shoppers_size(client, db_session, monkeypatch, question):
    _seed(db_session)
    seen = _capture_prompt(monkeypatch)
    _chat(client, question)
    prompt = seen["prompt"]
    assert "Size: N/A" not in prompt
    assert "Not saved yet" not in prompt


def test_the_prompt_carries_the_body_measurements(client, db_session, monkeypatch):
    _seed(db_session)
    seen = _capture_prompt(monkeypatch)
    _chat(client, "What is my chest size?")
    assert "chest 98 cm" in seen["prompt"]
    assert "waist 82 cm" in seen["prompt"]
    assert "hip 100 cm" in seen["prompt"]
    assert "shoulder 45 cm" in seen["prompt"]


def test_brand_sizes_are_worked_out_in_code_and_zara_is_a_size_up(client, db_session, monkeypatch):
    _seed(db_session)
    seen = _capture_prompt(monkeypatch)
    _chat(client, "Which size in a hoodie at Zara?")
    prompt = seen["prompt"]

    order = ["XS", "S", "M", "L", "XL", "XXL"]
    uniqlo = next(s for s in order if f"size in Uniqlo is {s}." in prompt)
    zara = next(s for s in order if f"size in Zara is {s}." in prompt)
    # Zara runs small, so the shopper needs the size ABOVE their Uniqlo size.
    # (The model used to say the size below.)
    assert order.index(zara) == order.index(uniqlo) + 1


def test_size_up_option_is_given_for_looser_fits(client, db_session, monkeypatch):
    _seed(db_session)
    seen = _capture_prompt(monkeypatch)
    _chat(client, "I want oversized clothes")
    prompt = seen["prompt"]
    size = next(l for l in prompt.splitlines() if l.startswith("Size: ")).split(": ")[1]
    up = next(l for l in prompt.splitlines() if l.startswith("Size-up option: ")).split(": ")[1]
    order = ["XS", "S", "M", "L", "XL", "XXL"]
    assert order.index(up) == order.index(size) + 1


def test_without_measurements_the_model_is_told_so_and_asked_to_say_it(client, db_session, monkeypatch):
    seen = _capture_prompt(monkeypatch)
    _chat(client, "I want oversized clothes")
    prompt = seen["prompt"]
    assert "Size: N/A" in prompt
    assert "Body measurements: Not saved yet." in prompt


def test_rules_answer_still_works_with_the_model_off(client, db_session, monkeypatch):
    _seed(db_session)
    monkeypatch.setattr(conversation_router, "ask_local_model", lambda prompt: None)
    body = _chat(client, "What size should I buy?").json()
    assert body["answered_by"] == "rules"
    assert "I recommend size" in body["answer"]


def test_engine_asks_for_the_size_even_for_a_preferences_question():
    calls = []

    def get_size():
        calls.append(1)
        return {"size": "L", "confidence": 0.9}

    ConversationEngine.process_message(
        question="I want oversized clothes", history=[],
        user_profile={"preferred_fit": "Regular", "favorite_brands": []},
        get_stylist_rec=get_size, get_product_rec=lambda: [], llm=None,
    )
    assert calls == [1]


def test_engine_asks_for_the_size_only_once_for_a_sizing_question():
    calls = []

    def get_size():
        calls.append(1)
        return {"size": "L", "confidence": 0.9}

    ConversationEngine.process_message(
        question="What size should I buy?", history=[],
        user_profile={"preferred_fit": "Regular", "favorite_brands": []},
        get_stylist_rec=get_size, get_product_rec=lambda: [], llm=None,
    )
    assert calls == [1]


# ---------- prompt pieces ----------
def test_brand_facts_without_sizes_keep_the_old_wording():
    text = _brand_facts()
    assert "Zara runs small, so go one size up." in text
    assert "Uniqlo is true to size." in text


def test_brand_facts_with_sizes_state_the_size():
    text = _brand_facts({"Zara": "XL", "Uniqlo": "L"})
    assert "The shopper's size in Zara is XL." in text
    assert "The shopper's size in Uniqlo is L." in text
    assert "go one size" not in text


def test_old_style_stylist_dict_still_builds_a_prompt():
    # Callers that only pass size + confidence (as older tests do) must keep working.
    ctx = AIContext(
        user_profile={"preferred_fit": "Regular", "favorite_brands": []},
        stylist_recommendation={"size": "M", "confidence": 0.9},
        product_recommendations=None,
        conversation_history=[],
        intent=Intent(category="sizing", confidence=0.9),
    )
    prompt = PromptBuilder.build_prompt(ctx, "What size?")
    assert "Size: M" in prompt
    assert "Size-up option: N/A" in prompt
    assert "Body measurements: Not saved yet." in prompt

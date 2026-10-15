from services.conversation.intent_detector import IntentDetector
from services.conversation.tool_router import ToolRouter

def test_intent_sizing():
    intent = IntentDetector.detect("What size should I buy?")
    assert intent.category == "sizing"
    routes = ToolRouter.route(intent)
    assert "StylistEngine" in routes

def test_intent_product():
    intent = IntentDetector.detect("Can you recommend a good shirt?")
    assert intent.category == "product"
    routes = ToolRouter.route(intent)
    assert "ProductIntelligenceEngine" in routes

def test_intent_brand():
    intent = IntentDetector.detect("Does Zara fit me?")
    assert intent.category == "brand"
    routes = ToolRouter.route(intent)
    assert "BrandEngine" in routes

def test_intent_preferences():
    intent = IntentDetector.detect("I want oversized clothes")
    assert intent.category == "preferences"
    routes = ToolRouter.route(intent)
    assert "PreferenceEngine" in routes

def test_intent_general():
    intent = IntentDetector.detect("Hello!")
    assert intent.category == "general"
    routes = ToolRouter.route(intent)
    assert "KnowledgeGraph" in routes

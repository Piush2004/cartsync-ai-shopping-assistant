from typing import List, Dict, Any
from .types import Message, ConversationResponse
from .intent_detector import IntentDetector
from .tool_router import ToolRouter
from .context_builder import ContextBuilder
from .prompt_builder import PromptBuilder
from .response_formatter import ResponseFormatter

class ConversationEngine:
    @staticmethod
    def process_message(
        question: str, 
        history: List[Message],
        user_profile: Dict[str, Any],
        get_stylist_rec=None, 
        get_product_rec=None
    ) -> ConversationResponse:
        
        # 1. Intent Detection
        intent = IntentDetector.detect(question)
        
        # 2. Tool Routing
        routes = ToolRouter.route(intent)
        
        stylist_data = None
        product_data = None
        
        # Simulate invoking the engines
        if "StylistEngine" in routes and get_stylist_rec:
            stylist_data = get_stylist_rec()
            
        if "ProductIntelligenceEngine" in routes and get_product_rec:
            product_data = get_product_rec()
            
        # 3. Context Builder
        context = ContextBuilder.build(
            user_profile=user_profile,
            intent=intent,
            history=history,
            stylist_rec=stylist_data,
            product_recs=product_data
        )
        
        # 4. Prompt Builder
        prompt = PromptBuilder.build_prompt(context, question)
        
        # 5. LLM (Mocked for now)
        # In production, this would call OpenAI or Gemini with the `prompt`.
        # Here we simulate the LLM's natural language response based on the structured data it receives.
        if intent.category == "product" and product_data:
            top_prod = product_data[0]
            answer = f"Based on your measurements and preference for {user_profile.get('preferred_fit', 'your fit')}, I'd recommend the {top_prod['name']}. It has a {top_prod['score']}% fit score."
        elif intent.category == "sizing" and stylist_data:
            answer = f"I recommend size {stylist_data['size']}. My confidence is {stylist_data['confidence']} based on your history."
        else:
            answer = f"I understand you're asking about {intent.category}. I've checked your profile and preferences to help guide you."
            
        # 6. Response Formatter
        return ResponseFormatter.format(raw_llm_response=answer, intent=intent, sources=routes)

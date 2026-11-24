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
        get_product_rec=None,
        llm=None,
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

        # The shopper's size is needed to answer almost anything ("I want
        # oversized clothes", "what is my chest?"). It used to be fetched only
        # for sizing/product/brand questions, so the model got "Size: N/A" for
        # the rest and told people with saved measurements to add them.
        if stylist_data is None and get_stylist_rec:
            stylist_data = get_stylist_rec()
            
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
        
        # 5. Rules-based answer. Always computed: it is what the user gets
        # when no language model is reachable.
        if intent.category == "product" and product_data:
            top_prod = product_data[0]
            answer = f"Based on your measurements and preference for {user_profile.get('preferred_fit', 'your fit')}, I'd recommend the {top_prod['name']}. It has a {top_prod['score']}% fit score."
        elif intent.category == "sizing" and stylist_data:
            answer = f"I recommend size {stylist_data['size']}. My confidence is {stylist_data['confidence']} based on your history."
        else:
            answer = f"I understand you're asking about {intent.category}. I've checked your profile and preferences to help guide you."
            
        # 6. Let the language model word the answer when one is available.
        # `answer` above stays as the fallback: `llm` returns None whenever
        # the model can't be reached, and the chat still has to answer.
        answered_by = "rules"
        if llm is not None:
            model_answer = llm(prompt)
            if model_answer:
                answer = model_answer
                answered_by = "model"

        # 7. Response Formatter
        response = ResponseFormatter.format(raw_llm_response=answer, intent=intent, sources=routes)
        response.answered_by = answered_by
        return response

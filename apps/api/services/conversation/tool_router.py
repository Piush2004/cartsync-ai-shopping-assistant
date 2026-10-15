from typing import Dict, Any, Optional, List
from .types import Intent

# In a real setup, this would invoke the specific services. 
# For now, we will return flags indicating which services the context builder should pull from.
class ToolRouter:
    @staticmethod
    def route(intent: Intent) -> List[str]:
        routes = []
        if intent.category == "sizing":
            routes.append("StylistEngine")
        elif intent.category == "product":
            routes.append("ProductIntelligenceEngine")
            routes.append("StylistEngine") # Need size for product
        elif intent.category == "brand":
            routes.append("BrandEngine")
            routes.append("StylistEngine")
        elif intent.category == "preferences":
            routes.append("PreferenceEngine")
        elif intent.category == "measurement":
            routes.append("KnowledgeGraph")
        else:
            routes.append("KnowledgeGraph")
            
        return routes

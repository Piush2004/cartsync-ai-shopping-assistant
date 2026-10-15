import { AgentRequest, AgentResponse, UserIntent, ChatMessage } from '../utils/types';
import { CatalogAgent } from './catalog';
import { db, admin } from '../utils/firebaseAdmin';

/**
 * Intent classification logic.
 */
export function classifyIntent(message: string): UserIntent {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.match(/(search|find|show me|browse|looking for)/)) {
    return 'search';
  }
  if (lowerMsg.match(/(size|fit|measurement|what size)/)) {
    return 'size';
  }
  if (lowerMsg.match(/(try on|try it|wear|how do i look|virtual)/)) {
    return 'tryon';
  }
  
  return 'general';
}

export class SupervisorAgent {
  uid: string;
  sessionId: string;

  constructor(uid: string, sessionId: string) {
    this.uid = uid;
    this.sessionId = sessionId;
  }

  /**
   * Routes the incoming request to the appropriate sub-agent and records the conversation.
   */
  async handleRequest(request: AgentRequest): Promise<AgentResponse> {
    const intent = request.intent || classifyIntent(request.message);
    let response: AgentResponse;

    switch (intent) {
      case 'search': {
        const catalogAgent = new CatalogAgent();
        const products = await catalogAgent.search(request.message);
        response = catalogAgent.formatResponse(products);
        break;
      }
      case 'size': {
        // Fallback or require specific structured request via separate API
        response = {
          agentId: 'sizing',
          message: 'To get a precise size recommendation, please use the Sizing panel on a product card.',
        };
        break;
      }
      case 'tryon': {
         // Fallback or require specific structured request via separate API
        response = {
          agentId: 'vton',
          message: 'To try this on, please use the "Try On" button on a product card or visit the Studio.',
        };
        break;
      }
      case 'general':
      default: {
        response = {
          agentId: 'supervisor',
          message: "I can help you find outfits, recommend sizes based on your measurements, or let you try clothes on virtually! What are you looking for today?",
        };
        break;
      }
    }

    await this.saveConversationTurn(request.message, response);
    return response;
  }

  /**
   * Saves the user's message and the agent's response to Firestore.
   */
  private async saveConversationTurn(userMessage: string, agentResponse: AgentResponse) {
    const sessionRef = db.collection('users').doc(this.uid).collection('sessions').doc(this.sessionId);
    
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: userMessage,
        timestamp: admin.firestore.Timestamp.now()
      },
      {
        role: 'assistant',
        content: agentResponse.message,
        timestamp: admin.firestore.Timestamp.now(),
        agentId: agentResponse.agentId,
        products: agentResponse.products,
        sizing: agentResponse.sizing,
        vtonResult: agentResponse.vtonResult
      }
    ];

    await sessionRef.set({
      messages: admin.firestore.FieldValue.arrayUnion(...messages),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
}

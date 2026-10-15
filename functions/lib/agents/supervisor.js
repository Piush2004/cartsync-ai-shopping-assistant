"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupervisorAgent = void 0;
exports.classifyIntent = classifyIntent;
const catalog_1 = require("./catalog");
const firebaseAdmin_1 = require("../utils/firebaseAdmin");
/**
 * Intent classification logic.
 */
function classifyIntent(message) {
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
class SupervisorAgent {
    constructor(uid, sessionId) {
        this.uid = uid;
        this.sessionId = sessionId;
    }
    /**
     * Routes the incoming request to the appropriate sub-agent and records the conversation.
     */
    async handleRequest(request) {
        const intent = request.intent || classifyIntent(request.message);
        let response;
        switch (intent) {
            case 'search': {
                const catalogAgent = new catalog_1.CatalogAgent();
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
    async saveConversationTurn(userMessage, agentResponse) {
        const sessionRef = firebaseAdmin_1.db.collection('users').doc(this.uid).collection('sessions').doc(this.sessionId);
        const messages = [
            {
                role: 'user',
                content: userMessage,
                timestamp: firebaseAdmin_1.admin.firestore.Timestamp.now()
            },
            {
                role: 'assistant',
                content: agentResponse.message,
                timestamp: firebaseAdmin_1.admin.firestore.Timestamp.now(),
                agentId: agentResponse.agentId,
                products: agentResponse.products,
                sizing: agentResponse.sizing,
                vtonResult: agentResponse.vtonResult
            }
        ];
        await sessionRef.set({
            messages: firebaseAdmin_1.admin.firestore.FieldValue.arrayUnion(...messages),
            updatedAt: firebaseAdmin_1.admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
}
exports.SupervisorAgent = SupervisorAgent;
//# sourceMappingURL=supervisor.js.map
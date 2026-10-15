"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryAgent = exports.MemoryAgent = void 0;
const firebase_1 = require("../config/firebase");
const admin = __importStar(require("firebase-admin"));
class MemoryAgent {
    /**
     * Retrieves conversation history for a given chat session.
     */
    async getSessionHistory(sessionId) {
        try {
            const doc = await firebase_1.db.collection('chatSessions').doc(sessionId).get();
            if (doc.exists) {
                return doc.data()?.messages || [];
            }
        }
        catch (e) {
            console.error(`[MemoryAgent] Error fetching session history for ${sessionId}:`, e);
        }
        return [];
    }
    /**
     * Appends user or stylist responses into the chat session records.
     */
    async recordMessage(sessionId, uid, role, content) {
        const now = new Date().toISOString();
        const message = { role, content, timestamp: now };
        const sessionRef = firebase_1.db.collection('chatSessions').doc(sessionId);
        try {
            const doc = await sessionRef.get();
            if (doc.exists) {
                await sessionRef.update({
                    messages: admin.firestore.FieldValue.arrayUnion(message),
                    updatedAt: now
                });
            }
            else {
                const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(); // 30-day retention
                await sessionRef.set({
                    sessionId,
                    uid,
                    title: content.substring(0, 40) + '...',
                    messages: [message],
                    createdAt: now,
                    updatedAt: now,
                    expiresAt
                });
            }
        }
        catch (e) {
            console.error(`[MemoryAgent] Error saving chat message in ${sessionId}:`, e);
        }
    }
    /**
     * Generates or updates the chat summary metadata inside the chatSummaries collection.
     */
    async generateOrUpdateSummary(uid, summaryText, extractedPreferences = [], stylistNotes = '') {
        const now = new Date().toISOString();
        const summaryId = `summary-${uid.substring(0, 8)}`;
        const expiresAt = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(); // 365-day retention
        const summaryRef = firebase_1.db.collection('chatSummaries').doc(summaryId);
        try {
            await summaryRef.set({
                summaryId,
                uid,
                summaryText,
                extractedPreferences,
                stylistNotes,
                createdAt: now,
                updatedAt: now,
                expiresAt,
                version: '1.0.0',
                confidence: 0.95
            }, { merge: true });
            console.log(`[MemoryAgent] Chat summary updated for user: ${uid}`);
        }
        catch (e) {
            console.error(`[MemoryAgent] Error saving chat summary:`, e);
        }
    }
}
exports.MemoryAgent = MemoryAgent;
exports.memoryAgent = new MemoryAgent();
//# sourceMappingURL=memory.agent.js.map
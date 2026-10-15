import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export class MemoryAgent {
  /**
   * Retrieves conversation history for a given chat session.
   */
  async getSessionHistory(sessionId: string): Promise<Array<{ role: string; content: string; timestamp: string }>> {
    try {
      const doc = await db.collection('chatSessions').doc(sessionId).get();
      if (doc.exists) {
        return doc.data()?.messages || [];
      }
    } catch (e) {
      console.error(`[MemoryAgent] Error fetching session history for ${sessionId}:`, e);
    }
    return [];
  }

  /**
   * Appends user or stylist responses into the chat session records.
   */
  async recordMessage(sessionId: string, uid: string, role: 'user' | 'assistant' | 'system', content: string): Promise<void> {
    const now = new Date().toISOString();
    const message = { role, content, timestamp: now };
    const sessionRef = db.collection('chatSessions').doc(sessionId);
    
    try {
      const doc = await sessionRef.get();
      if (doc.exists) {
        await sessionRef.update({
          messages: admin.firestore.FieldValue.arrayUnion(message),
          updatedAt: now
        });
      } else {
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
    } catch (e) {
      console.error(`[MemoryAgent] Error saving chat message in ${sessionId}:`, e);
    }
  }

  /**
   * Generates or updates the chat summary metadata inside the chatSummaries collection.
   */
  async generateOrUpdateSummary(
    uid: string,
    summaryText: string,
    extractedPreferences: string[] = [],
    stylistNotes: string = ''
  ): Promise<void> {
    const now = new Date().toISOString();
    const summaryId = `summary-${uid.substring(0, 8)}`;
    const expiresAt = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(); // 365-day retention
    
    const summaryRef = db.collection('chatSummaries').doc(summaryId);
    
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
    } catch (e) {
      console.error(`[MemoryAgent] Error saving chat summary:`, e);
    }
  }
}

export const memoryAgent = new MemoryAgent();

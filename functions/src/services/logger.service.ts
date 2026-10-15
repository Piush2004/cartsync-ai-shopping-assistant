import { db } from '../config/firebase';

export class LoggerService {
  async logError(context: string, error: Error | string, uid?: string) {
    console.error(`[${context}]`, error);
    await db.collection('agentLogs').add({
      level: 'ERROR',
      context,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? null : error.stack,
      uid: uid || 'system',
      timestamp: new Date().toISOString()
    }).catch(e => console.error("Failed to write log to Firestore", e));
  }

  async logInfo(context: string, message: string, uid?: string) {
    console.log(`[${context}]`, message);
    await db.collection('agentLogs').add({
      level: 'INFO',
      context,
      message,
      uid: uid || 'system',
      timestamp: new Date().toISOString()
    }).catch(e => console.error("Failed to write log to Firestore", e));
  }
}

export const loggerService = new LoggerService();

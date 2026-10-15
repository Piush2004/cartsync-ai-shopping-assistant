import { db } from '../config/firebase';
import { Transaction, TransactionAction } from '../types/transaction.types';
import { randomUUID } from 'crypto';

export class CreditService {
  /**
   * Deducts credits using a Firestore Transaction to prevent double spending.
   */
  async commitCredit(uid: string, action: TransactionAction, cost: number, jobId?: string): Promise<boolean> {
    const userRef = db.collection('users').doc(uid);
    const txRef = db.collection('transactions').doc(randomUUID());

    try {
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error('User does not exist');
        }

        const currentCredits = userDoc.data()?.credits || 0;
        if (currentCredits < cost) {
          throw new Error('Insufficient credits');
        }

        transaction.update(userRef, {
          credits: currentCredits - cost,
          updatedAt: new Date().toISOString()
        });

        const txData: Transaction = {
          txId: txRef.id,
          uid,
          action,
          amount: -cost,
          jobId,
          timestamp: new Date().toISOString()
        };
        transaction.set(txRef, txData);
      });
      return true;
    } catch (e) {
      console.error('Transaction failed:', e);
      return false;
    }
  }

  /**
   * Refunds credits atomically (e.g. if VTON fails).
   */
  async refundCredit(uid: string, cost: number, jobId?: string): Promise<boolean> {
    const userRef = db.collection('users').doc(uid);
    const txRef = db.collection('transactions').doc(randomUUID());

    try {
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) return;

        const currentCredits = userDoc.data()?.credits || 0;

        transaction.update(userRef, {
          credits: currentCredits + cost,
          updatedAt: new Date().toISOString()
        });

        const txData: Transaction = {
          txId: txRef.id,
          uid,
          action: 'REFUND_ERROR',
          amount: cost,
          jobId,
          timestamp: new Date().toISOString()
        };
        transaction.set(txRef, txData);
      });
      return true;
    } catch (e) {
      console.error('Refund failed:', e);
      return false;
    }
  }
}

export const creditService = new CreditService();

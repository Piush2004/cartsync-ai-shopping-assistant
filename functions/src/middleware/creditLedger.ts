import { db, admin } from '../utils/firebaseAdmin';
import { CreditLog } from '../utils/types';

/**
 * Atomically deducts a credit from a user's balance.
 */
export async function deductCredit(
  uid: string,
  amount: number,
  reason: string,
  functionName: string
): Promise<{ success: boolean; newBalance: number }> {
  const userRef = db.collection('users').doc(uid);
  const logRef = userRef.collection('creditLogs').doc();

  return db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new Error(`User ${uid} not found`);
    }

    const currentCredits = userDoc.data()?.credits || 0;
    if (currentCredits < amount) {
      return { success: false, newBalance: currentCredits };
    }

    const newBalance = currentCredits - amount;

    // Update balance
    transaction.update(userRef, {
      credits: newBalance,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create log entry
    const logEntry: CreditLog = {
      type: 'DEDUCTION',
      amount,
      reason,
      functionName,
      timestamp: admin.firestore.Timestamp.now(),
      balanceAfter: newBalance,
    };
    transaction.set(logRef, logEntry);

    return { success: true, newBalance };
  });
}

/**
 * Atomically refunds a credit to a user's balance.
 */
export async function refundCredit(
  uid: string,
  amount: number,
  reason: string,
  functionName: string
): Promise<{ success: boolean; newBalance: number }> {
  const userRef = db.collection('users').doc(uid);
  const logRef = userRef.collection('creditLogs').doc();

  return db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new Error(`User ${uid} not found`);
    }

    const currentCredits = userDoc.data()?.credits || 0;
    const newBalance = currentCredits + amount;

    // Update balance
    transaction.update(userRef, {
      credits: newBalance,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create log entry
    const logEntry: CreditLog = {
      type: 'REFUND',
      amount,
      reason,
      functionName,
      timestamp: admin.firestore.Timestamp.now(),
      balanceAfter: newBalance,
    };
    transaction.set(logRef, logEntry);

    return { success: true, newBalance };
  });
}

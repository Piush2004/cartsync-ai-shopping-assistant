"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deductCredit = deductCredit;
exports.refundCredit = refundCredit;
const firebaseAdmin_1 = require("../utils/firebaseAdmin");
/**
 * Atomically deducts a credit from a user's balance.
 */
async function deductCredit(uid, amount, reason, functionName) {
    const userRef = firebaseAdmin_1.db.collection('users').doc(uid);
    const logRef = userRef.collection('creditLogs').doc();
    return firebaseAdmin_1.db.runTransaction(async (transaction) => {
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
            updatedAt: firebaseAdmin_1.admin.firestore.FieldValue.serverTimestamp(),
        });
        // Create log entry
        const logEntry = {
            type: 'DEDUCTION',
            amount,
            reason,
            functionName,
            timestamp: firebaseAdmin_1.admin.firestore.Timestamp.now(),
            balanceAfter: newBalance,
        };
        transaction.set(logRef, logEntry);
        return { success: true, newBalance };
    });
}
/**
 * Atomically refunds a credit to a user's balance.
 */
async function refundCredit(uid, amount, reason, functionName) {
    const userRef = firebaseAdmin_1.db.collection('users').doc(uid);
    const logRef = userRef.collection('creditLogs').doc();
    return firebaseAdmin_1.db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            throw new Error(`User ${uid} not found`);
        }
        const currentCredits = userDoc.data()?.credits || 0;
        const newBalance = currentCredits + amount;
        // Update balance
        transaction.update(userRef, {
            credits: newBalance,
            updatedAt: firebaseAdmin_1.admin.firestore.FieldValue.serverTimestamp(),
        });
        // Create log entry
        const logEntry = {
            type: 'REFUND',
            amount,
            reason,
            functionName,
            timestamp: firebaseAdmin_1.admin.firestore.Timestamp.now(),
            balanceAfter: newBalance,
        };
        transaction.set(logRef, logEntry);
        return { success: true, newBalance };
    });
}
//# sourceMappingURL=creditLedger.js.map
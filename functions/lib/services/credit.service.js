"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.creditService = exports.CreditService = void 0;
const firebase_1 = require("../config/firebase");
const crypto_1 = require("crypto");
class CreditService {
    /**
     * Deducts credits using a Firestore Transaction to prevent double spending.
     */
    async commitCredit(uid, action, cost, jobId) {
        const userRef = firebase_1.db.collection('users').doc(uid);
        const txRef = firebase_1.db.collection('transactions').doc((0, crypto_1.randomUUID)());
        try {
            await firebase_1.db.runTransaction(async (transaction) => {
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
                const txData = {
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
        }
        catch (e) {
            console.error('Transaction failed:', e);
            return false;
        }
    }
    /**
     * Refunds credits atomically (e.g. if VTON fails).
     */
    async refundCredit(uid, cost, jobId) {
        const userRef = firebase_1.db.collection('users').doc(uid);
        const txRef = firebase_1.db.collection('transactions').doc((0, crypto_1.randomUUID)());
        try {
            await firebase_1.db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists)
                    return;
                const currentCredits = userDoc.data()?.credits || 0;
                transaction.update(userRef, {
                    credits: currentCredits + cost,
                    updatedAt: new Date().toISOString()
                });
                const txData = {
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
        }
        catch (e) {
            console.error('Refund failed:', e);
            return false;
        }
    }
}
exports.CreditService = CreditService;
exports.creditService = new CreditService();
//# sourceMappingURL=credit.service.js.map
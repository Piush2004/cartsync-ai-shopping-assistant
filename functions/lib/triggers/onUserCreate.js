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
exports.onUserCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const firebaseAdmin_1 = require("../utils/firebaseAdmin");
const types_1 = require("../utils/types");
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    const uid = user.uid;
    const userRef = firebaseAdmin_1.db.collection('users').doc(uid);
    const logRef = userRef.collection('creditLogs').doc();
    const batch = firebaseAdmin_1.db.batch();
    // Create user doc
    batch.set(userRef, {
        uid: uid,
        email: user.email || '',
        displayName: user.displayName || 'Fashionista',
        credits: types_1.INITIAL_CREDITS,
        tier: 'free',
        gender: 'non-binary', // Default, user can update later
        createdAt: firebaseAdmin_1.admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin_1.admin.firestore.FieldValue.serverTimestamp()
    });
    // Create initial credit log
    const logEntry = {
        type: 'INITIAL_GRANT',
        amount: types_1.INITIAL_CREDITS,
        reason: 'Welcome bonus - free style credits',
        functionName: 'onUserCreate',
        timestamp: firebaseAdmin_1.admin.firestore.Timestamp.now(),
        balanceAfter: types_1.INITIAL_CREDITS
    };
    batch.set(logRef, logEntry);
    try {
        await batch.commit();
        functions.logger.info(`Successfully initialized user ${uid} with ${types_1.INITIAL_CREDITS} credits.`);
    }
    catch (error) {
        functions.logger.error(`Error initializing user ${uid}:`, error);
    }
});
//# sourceMappingURL=onUserCreate.js.map
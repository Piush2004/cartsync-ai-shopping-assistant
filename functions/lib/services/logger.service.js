"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerService = exports.LoggerService = void 0;
const firebase_1 = require("../config/firebase");
class LoggerService {
    async logError(context, error, uid) {
        console.error(`[${context}]`, error);
        await firebase_1.db.collection('agentLogs').add({
            level: 'ERROR',
            context,
            message: typeof error === 'string' ? error : error.message,
            stack: typeof error === 'string' ? null : error.stack,
            uid: uid || 'system',
            timestamp: new Date().toISOString()
        }).catch(e => console.error("Failed to write log to Firestore", e));
    }
    async logInfo(context, message, uid) {
        console.log(`[${context}]`, message);
        await firebase_1.db.collection('agentLogs').add({
            level: 'INFO',
            context,
            message,
            uid: uid || 'system',
            timestamp: new Date().toISOString()
        }).catch(e => console.error("Failed to write log to Firestore", e));
    }
}
exports.LoggerService = LoggerService;
exports.loggerService = new LoggerService();
//# sourceMappingURL=logger.service.js.map
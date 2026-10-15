"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = void 0;
const firebase_1 = require("../config/firebase");
const auditLogger = async (req, res, next) => {
    const startTime = Date.now();
    res.on('finish', async () => {
        const duration = Date.now() - startTime;
        const logEntry = {
            path: req.path,
            method: req.method,
            status: res.statusCode,
            durationMs: duration,
            ip: req.ip || 'unknown',
            uid: req.user?.uid || 'anonymous',
            timestamp: new Date().toISOString()
        };
        // Asynchronously write to agentLogs
        try {
            await firebase_1.db.collection('agentLogs').add(logEntry);
        }
        catch (err) {
            console.error('Failed to write audit log', err);
        }
    });
    next();
};
exports.auditLogger = auditLogger;
//# sourceMappingURL=audit.middleware.js.map
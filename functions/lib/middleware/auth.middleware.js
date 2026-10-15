"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const firebase_1 = require("../config/firebase");
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: Missing token' });
        return;
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await firebase_1.auth.verifyIdToken(token);
        req.user = decodedToken;
        next();
        return;
    }
    catch (error) {
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
        return;
    }
};
exports.requireAuth = requireAuth;
//# sourceMappingURL=auth.middleware.js.map
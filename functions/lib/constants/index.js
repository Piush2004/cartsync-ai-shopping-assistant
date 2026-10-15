"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JOB_STATUSES = exports.CREDIT_COSTS = exports.SIGNUP_CREDIT_AMOUNT = exports.RETENTION_POLICIES = void 0;
exports.RETENTION_POLICIES = {
    RAW_UPLOADS_HOURS: 24,
    MEASUREMENTS_DAYS: 180,
    VTON_ASSETS_DAYS: 30,
    CHAT_SESSIONS_DAYS: 30,
    CHAT_SUMMARIES_DAYS: 365,
};
exports.SIGNUP_CREDIT_AMOUNT = 30;
exports.CREDIT_COSTS = {
    AI_CHAT: 1,
    SIZE_RECOMMENDATION: 1,
    VIRTUAL_TRY_ON: 1,
};
exports.JOB_STATUSES = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
};
//# sourceMappingURL=index.js.map
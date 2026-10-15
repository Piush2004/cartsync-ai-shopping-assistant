"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreService = void 0;
const base_service_1 = require("./base.service");
class FirestoreService extends base_service_1.BaseService {
    // A generic wrapper that can be instantiated for any collection dynamically
    // or extended by specific services for advanced querying.
    constructor(collectionName) {
        super(collectionName);
    }
}
exports.FirestoreService = FirestoreService;
//# sourceMappingURL=firestore.service.js.map
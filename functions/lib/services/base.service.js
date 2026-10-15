"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const firebase_1 = require("../config/firebase");
class BaseService {
    constructor(collectionName) {
        this.collectionName = collectionName;
    }
    get collection() {
        return firebase_1.db.collection(this.collectionName);
    }
    async getById(id) {
        const doc = await this.collection.doc(id).get();
        return doc.exists ? doc.data() : null;
    }
    async create(id, data) {
        await this.collection.doc(id).set(data);
    }
    async update(id, data) {
        await this.collection.doc(id).update(data);
    }
    async delete(id) {
        await this.collection.doc(id).delete();
    }
}
exports.BaseService = BaseService;
//# sourceMappingURL=base.service.js.map
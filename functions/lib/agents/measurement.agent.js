"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.measurementAgent = exports.MeasurementAgent = void 0;
const measurementEngine_1 = require("../services/measurements/measurementEngine");
const measurementStorage_1 = require("../services/measurements/measurementStorage");
class MeasurementAgent {
    /**
     * Orchestrates body measurement calculation by invoking the backend service.
     * Conforms to the architecture by communicating only via services.
     */
    async extractMeasurements(uid, frontImageUrl, sideImageUrl, heightCm) {
        console.log(`[MeasurementAgent] Processing measurements for user: ${uid}`);
        // Call the orchestrator service directly
        const profile = await (0, measurementEngine_1.processMeasurementImages)(frontImageUrl, sideImageUrl, heightCm);
        // Persist profile to database
        await (0, measurementStorage_1.saveMeasurementProfile)(uid, profile);
        return profile;
    }
}
exports.MeasurementAgent = MeasurementAgent;
exports.measurementAgent = new MeasurementAgent();
//# sourceMappingURL=measurement.agent.js.map
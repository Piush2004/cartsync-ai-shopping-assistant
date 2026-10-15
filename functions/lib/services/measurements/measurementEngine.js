"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMeasurementImages = processMeasurementImages;
const poseDetection_1 = require("./poseDetection");
const heightCalibration_1 = require("./heightCalibration");
const measurementCalculator_1 = require("./measurementCalculator");
const measurementValidation_1 = require("./measurementValidation");
/**
 * Core Orchestrator for the MVP AI Measurement Pipeline
 * Modular design allows future upgrades (Depth Anything V2, LiDAR) to be swapped
 * in without changing the core workflow.
 */
async function processMeasurementImages(frontImageUrl, sideImageUrl, actualHeightCm) {
    // Run Validation Agent on input photos
    await (0, measurementValidation_1.validateImagesWithAgent)(frontImageUrl, sideImageUrl);
    // Stage 1: Pose Detection
    const frontPose = await (0, poseDetection_1.extractPoseLandmarks)(frontImageUrl);
    const sidePose = await (0, poseDetection_1.extractPoseLandmarks)(sideImageUrl);
    // Stage 2: Height Calibration
    const pixelsPerCm = (0, heightCalibration_1.calculatePixelsPerCm)(frontPose.landmarks, actualHeightCm);
    // Stage 3 & 5: Estimation and Circumference Calculations
    const measurements = (0, measurementCalculator_1.estimateMeasurements)(frontPose.landmarks, sidePose.landmarks, pixelsPerCm);
    // Generate mock confidence score based on pipeline success (MVP)
    const confidenceScore = 0.88;
    // Stage 6: Return Measurement Profile
    return {
        height: actualHeightCm,
        ...measurements,
        confidence: confidenceScore
    };
}
//# sourceMappingURL=measurementEngine.js.map
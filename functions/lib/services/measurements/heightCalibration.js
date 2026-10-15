"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePixelsPerCm = calculatePixelsPerCm;
/**
 * Uses user-provided height as the primary calibration method.
 * Calculates pixelsPerCm without requiring an external reference object.
 */
function calculatePixelsPerCm(landmarks, actualHeightCm) {
    // Height in pixels is estimated from nose to ankles
    const topY = landmarks.nose.y;
    // Average of both ankles for bottom Y
    const bottomY = (landmarks.leftAnkle.y + landmarks.rightAnkle.y) / 2;
    const bodyHeightPixels = Math.abs(bottomY - topY);
    // Nose to ankle does not account for top of head and bottom of feet.
    // We approximate the full height as 1.1x the nose-to-ankle distance.
    const fullHeightPixels = bodyHeightPixels * 1.1;
    // This factor is our conversion scale
    return fullHeightPixels / actualHeightCm;
}
//# sourceMappingURL=heightCalibration.js.map
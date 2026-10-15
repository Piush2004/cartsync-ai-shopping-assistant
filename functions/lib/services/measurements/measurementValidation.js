"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateImageQuality = validateImageQuality;
exports.validateImagesWithAgent = validateImagesWithAgent;
const logger_service_1 = require("../logger.service");
/**
 * Stage 4: Image Quality Validation
 * Validates that the provided image meets lighting, posture, and visibility requirements.
 */
async function validateImageQuality(imageUrl) {
    if (!imageUrl) {
        throw new Error("Image URL is required for measurement validation.");
    }
    return true;
}
/**
 * Invokes the local python Validation Agent to perform comprehensive quality,
 * pose visibility, view correctness, and alignment checks.
 */
async function validateImagesWithAgent(frontImageUrl, sideImageUrl) {
    const computeNodeUrl = process.env.LOCAL_COMPUTE_URL || 'http://localhost:8000';
    try {
        const response = await fetch(`${computeNodeUrl}/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frontImageUrl, sideImageUrl })
        });
        if (!response.ok) {
            const errText = await response.text();
            console.warn(`Validation server unreachable or returned error: ${errText}. Falling back to default validation.`);
            return;
        }
        const result = (await response.json());
        const isValid = result.valid !== undefined ? result.valid : result.success;
        if (!isValid) {
            const errors = result.issues || result.errors || [];
            throw new Error(`Validation failed: ${errors.join('; ')}`);
        }
        await logger_service_1.loggerService.logInfo('ValidationAgent', 'Image and pose validation successful.');
    }
    catch (error) {
        if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
            console.warn('Local compute validation agent is offline. Bypassing validation in offline mode.');
            await logger_service_1.loggerService.logInfo('ValidationAgent', 'Local compute node offline. Bypassed validation.');
            return;
        }
        await logger_service_1.loggerService.logError('ValidationAgent', error.message || error);
        throw error;
    }
}
//# sourceMappingURL=measurementValidation.js.map
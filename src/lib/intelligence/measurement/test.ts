import { extractMeasurements } from './extraction';
import { calculateConfidence } from './calibration';
import { PoseLandmarks } from './types';

// Mock an ideal 180cm person
// Head to heel ~ 1000 pixels
// Shoulders width ~ 220 pixels
const mockFrontPose: PoseLandmarks = new Array(33).fill({ x: 0, y: 0, z: 0, visibility: 0.95 });

mockFrontPose[0] = { x: 500, y: 100, z: 0, visibility: 0.99 }; // Nose
mockFrontPose[11] = { x: 390, y: 250, z: -50, visibility: 0.99 }; // Left Shoulder
mockFrontPose[12] = { x: 610, y: 250, z: -50, visibility: 0.99 }; // Right Shoulder
mockFrontPose[23] = { x: 420, y: 550, z: -20, visibility: 0.99 }; // Left Hip
mockFrontPose[24] = { x: 580, y: 550, z: -20, visibility: 0.99 }; // Right Hip
mockFrontPose[15] = { x: 300, y: 500, z: -80, visibility: 0.99 }; // Left Wrist
mockFrontPose[16] = { x: 700, y: 500, z: -80, visibility: 0.99 }; // Right Wrist
mockFrontPose[27] = { x: 430, y: 1050, z: 10, visibility: 0.99 }; // Left Ankle
mockFrontPose[28] = { x: 570, y: 1050, z: 10, visibility: 0.99 }; // Right Ankle
mockFrontPose[29] = { x: 430, y: 1100, z: 10, visibility: 0.99 }; // Left Heel
mockFrontPose[30] = { x: 570, y: 1100, z: 10, visibility: 0.99 }; // Right Heel

const mockSidePose = mockFrontPose; // Just for testing confidence structure

console.log('Testing Measurement Extraction...');
try {
  const measurements = extractMeasurements(mockFrontPose, mockSidePose, 180);
  console.log('Extracted Measurements:', measurements);
  
  const confidence = calculateConfidence(mockFrontPose, mockSidePose);
  console.log('Confidence:', confidence);
  
  // Basic sanity checks
  if (measurements.chest < 80 || measurements.chest > 120) throw new Error(`Chest out of bounds: ${measurements.chest}`);
  if (measurements.waist < 60 || measurements.waist > 100) throw new Error(`Waist out of bounds: ${measurements.waist}`);
  
  console.log('✅ Validation Passed');
} catch (error) {
  console.error('❌ Validation Failed:', error);
}

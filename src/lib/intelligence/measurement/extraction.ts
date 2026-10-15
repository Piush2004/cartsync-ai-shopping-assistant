import { PoseLandmarks, BodyMeasurements, BodyShapeType } from './types';

// MediaPipe Pose Landmark Indices
const POSE = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30
};

function calcDistance3D(p1: { x: number; y: number; z: number }, p2: { x: number; y: number; z: number }): number {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
    Math.pow(p2.y - p1.y, 2) +
    Math.pow(p2.z - p1.z, 2)
  );
}

function classifyBodyShape(shoulderWidth: number, waistWidth: number, hipWidth: number): BodyShapeType {
  const shoulderWaistRatio = shoulderWidth / waistWidth;
  const waistHipRatio = waistWidth / hipWidth;

  if (shoulderWaistRatio > 1.3) return 'inverted_triangle';
  if (shoulderWaistRatio > 1.15 && waistHipRatio < 0.95) return 'athletic';
  if (waistHipRatio > 1.05 && shoulderWaistRatio < 1.05) return 'oval';
  if (waistHipRatio > 1.15) return 'round';
  return 'rectangle';
}

function calculateShapePerimeter(width: number, depth: number, shape: BodyShapeType): number {
  // Base perimeter calculation (ellipse)
  const a = width / 2;
  const b = depth / 2;
  let basePerimeter = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));

  // Correction factors based on body shape (empirical adjustments)
  const correctionFactors: Record<BodyShapeType, number> = {
    athletic: 0.98,          // Tighter, flatter core
    inverted_triangle: 0.97, // V-taper
    rectangle: 1.00,         // Standard elliptical
    oval: 1.03,              // More cylindrical
    round: 1.05              // Highly cylindrical
  };

  return basePerimeter * correctionFactors[shape];
}

export function extractMeasurements(
  frontPose: PoseLandmarks,
  sidePose: PoseLandmarks,
  userHeightCm: number,
  depthMap?: Float32Array
): { measurements: BodyMeasurements; shape: BodyShapeType } {
  
  const topY = frontPose[POSE.NOSE].y;
  const bottomY = (frontPose[POSE.LEFT_HEEL].y + frontPose[POSE.RIGHT_HEEL].y) / 2;
  const pixelHeight = Math.abs(bottomY - topY);
  const fullBodyPixelHeight = pixelHeight * 1.05;
  const cmPerPixel = userHeightCm / fullBodyPixelHeight;

  const shoulderWidth = calcDistance3D(frontPose[POSE.LEFT_SHOULDER], frontPose[POSE.RIGHT_SHOULDER]) * cmPerPixel;
  const armLength = (calcDistance3D(frontPose[POSE.LEFT_SHOULDER], frontPose[POSE.LEFT_WRIST]) + calcDistance3D(frontPose[POSE.RIGHT_SHOULDER], frontPose[POSE.RIGHT_WRIST])) / 2 * cmPerPixel;
  const inseam = (calcDistance3D(frontPose[POSE.LEFT_HIP], frontPose[POSE.LEFT_ANKLE]) + calcDistance3D(frontPose[POSE.RIGHT_HIP], frontPose[POSE.RIGHT_ANKLE])) / 2 * cmPerPixel;

  const shoulderMidY = (frontPose[POSE.LEFT_SHOULDER].y + frontPose[POSE.RIGHT_SHOULDER].y) / 2;
  const hipMidY = (frontPose[POSE.LEFT_HIP].y + frontPose[POSE.RIGHT_HIP].y) / 2;
  const torsoHeight = Math.abs(hipMidY - shoulderMidY) * cmPerPixel;

  const chestWidthFrontal = shoulderWidth * 0.85;
  const waistWidthFrontal = calcDistance3D(frontPose[POSE.LEFT_HIP], frontPose[POSE.RIGHT_HIP]) * cmPerPixel * 0.9;
  const hipWidthFrontal = calcDistance3D(frontPose[POSE.LEFT_HIP], frontPose[POSE.RIGHT_HIP]) * cmPerPixel * 1.1;

  const shape = classifyBodyShape(shoulderWidth, waistWidthFrontal, hipWidthFrontal);

  // Depth relationships vary by shape
  const depthMultipliers: Record<BodyShapeType, number> = {
    athletic: 0.70,
    inverted_triangle: 0.65,
    rectangle: 0.75,
    oval: 0.85,
    round: 0.95
  };

  const chestDepth = chestWidthFrontal * depthMultipliers[shape];
  const waistDepth = waistWidthFrontal * depthMultipliers[shape];
  const hipDepth = hipWidthFrontal * depthMultipliers[shape];

  const chestCircumference = calculateShapePerimeter(chestWidthFrontal, chestDepth, shape);
  const waistCircumference = calculateShapePerimeter(waistWidthFrontal, waistDepth, shape);
  const hipCircumference = calculateShapePerimeter(hipWidthFrontal, hipDepth, shape);

  const neck = shoulderWidth * 0.8;

  return {
    measurements: {
      chest: Math.round(chestCircumference * 10) / 10,
      waist: Math.round(waistCircumference * 10) / 10,
      hip: Math.round(hipCircumference * 10) / 10,
      shoulderWidth: Math.round(shoulderWidth * 10) / 10,
      armLength: Math.round(armLength * 10) / 10,
      inseam: Math.round(inseam * 10) / 10,
      torsoHeight: Math.round(torsoHeight * 10) / 10,
      neck: Math.round(neck * 10) / 10
    },
    shape
  };
}


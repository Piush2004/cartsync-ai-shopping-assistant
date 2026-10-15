import { PoseLandmarks } from './poseDetection';

// Euclidean distance helper
function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Approximates body circumference using ellipse geometry.
 * Formula: Circumference ≈ 2π√((a²+b²)/2)
 * @param widthCm Front body radius * 2
 * @param depthCm Side body radius * 2
 */
function calculateCircumference(widthCm: number, depthCm: number): number {
  const a = widthCm / 2; // radius a
  const b = depthCm / 2; // radius b
  return 2 * Math.PI * Math.sqrt((a * a + b * b) / 2);
}

/**
 * Stage 3 & 4: Body Width and Profile Estimation
 */
export function estimateMeasurements(
  frontLandmarks: PoseLandmarks,
  sideLandmarks: PoseLandmarks,
  pixelsPerCm: number
) {
  // --- FRONT IMAGE WIDTH ESTIMATION ---
  const shoulderWidthPixels = getDistance(frontLandmarks.leftShoulder, frontLandmarks.rightShoulder);
  
  // Approximate chest and waist widths from landmarks
  const chestWidthPixels = shoulderWidthPixels * 0.85; 
  const waistWidthPixels = getDistance({
    x: (frontLandmarks.leftShoulder.x + frontLandmarks.leftHip.x) / 2,
    y: (frontLandmarks.leftShoulder.y + frontLandmarks.leftHip.y) / 2
  }, {
    x: (frontLandmarks.rightShoulder.x + frontLandmarks.rightHip.x) / 2,
    y: (frontLandmarks.rightShoulder.y + frontLandmarks.rightHip.y) / 2
  });
  const hipWidthPixels = getDistance(frontLandmarks.leftHip, frontLandmarks.rightHip);
  
  const inseamPixels = getDistance(
    { x: (frontLandmarks.leftHip.x + frontLandmarks.rightHip.x) / 2, y: (frontLandmarks.leftHip.y + frontLandmarks.rightHip.y) / 2 },
    { x: (frontLandmarks.leftAnkle.x + frontLandmarks.rightAnkle.x) / 2, y: (frontLandmarks.leftAnkle.y + frontLandmarks.rightAnkle.y) / 2 }
  );

  // --- SIDE IMAGE DEPTH ESTIMATION ---
  // In a true side profile, left and right landmarks overlap. We measure the visible width of the side.
  // For MVP, we simulate depth scaling based on front proportions or side visible width.
  const chestDepthPixels = getDistance(sideLandmarks.leftShoulder, sideLandmarks.rightShoulder) * 0.8; 
  const waistDepthPixels = getDistance(sideLandmarks.leftHip, sideLandmarks.leftShoulder) * 0.35; 
  const hipDepthPixels = getDistance(sideLandmarks.leftHip, sideLandmarks.rightHip) * 0.65; 

  // Convert pixels to CM
  const shoulderWidthCm = shoulderWidthPixels / pixelsPerCm;
  const chestWidthCm = chestWidthPixels / pixelsPerCm;
  const waistWidthCm = waistWidthPixels / pixelsPerCm;
  const hipWidthCm = hipWidthPixels / pixelsPerCm;
  const inseamCm = inseamPixels / pixelsPerCm;

  const chestDepthCm = chestDepthPixels / pixelsPerCm;
  const waistDepthCm = waistDepthPixels / pixelsPerCm;
  const hipDepthCm = hipDepthPixels / pixelsPerCm;

  // --- STAGE 5: CIRCUMFERENCE ESTIMATION ---
  const chestCircCm = calculateCircumference(chestWidthCm, chestDepthCm);
  const waistCircCm = calculateCircumference(waistWidthCm, waistDepthCm);
  const hipCircCm = calculateCircumference(hipWidthCm, hipDepthCm);

  return {
    shoulderWidth: Math.round(shoulderWidthCm),
    chest: Math.round(chestCircCm),
    waist: Math.round(waistCircCm),
    hips: Math.round(hipCircCm),
    inseam: Math.round(inseamCm),
  };
}

/**
 * @deprecated Use src/lib/intelligence/measurement/pose.ts instead.
 * This MoveNet implementation is retained only for backward compatibility 
 * during the v3.0 migration. MoveNet lacks 3D topology necessary for volumetric measurement.
 */
let detector: any = null;
let isInitialized = false;

export async function initPoseDetection() {
  if (isInitialized) return;
  
  const tf = (window as any).tf;
  const poseDetection = (window as any).poseDetection;
  
  if (!tf || !poseDetection) {
    console.warn('TFJS not loaded yet');
    return;
  }
  
  await tf.ready();
  
  // We use MoveNet SinglePose Lightning for the fastest real-time performance in the browser
  const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
  isInitialized = true;
}

export async function estimatePose(video: HTMLVideoElement) {
  if (!detector) return null;
  const poses = await detector.estimatePoses(video, { flipHorizontal: false });
  return poses.length > 0 ? poses[0] : null;
}

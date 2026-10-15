import { Pose, Results, POSE_CONNECTIONS } from '@mediapipe/pose';
import { PoseLandmarks } from './types';

let poseModel: Pose | null = null;
let isInitialized = false;

export async function initPoseModel(): Promise<void> {
  if (isInitialized) return;

  poseModel = new Pose({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
  });

  poseModel.setOptions({
    modelComplexity: 2, // 0, 1, or 2 (highest accuracy)
    smoothLandmarks: true,
    enableSegmentation: true, // Useful for depth overlay
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  await poseModel.initialize();
  isInitialized = true;
}

export async function estimatePoseFromBlob(blob: Blob): Promise<PoseLandmarks | null> {
  if (!poseModel) {
    await initPoseModel();
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = async () => {
      try {
        poseModel!.onResults((results: Results) => {
          URL.revokeObjectURL(url);
          if (results.poseWorldLandmarks && results.poseWorldLandmarks.length > 0) {
            resolve(results.poseWorldLandmarks);
          } else {
            resolve(null);
          }
        });
        await poseModel!.send({ image: img });
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };

    img.src = url;
  });
}

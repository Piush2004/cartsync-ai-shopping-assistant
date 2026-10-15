// Pose type omitted to avoid Webpack ESM errors

export interface ReadinessState {
  isReady: boolean;
  score: number;
  feedback: string;
  checks: {
    visible: boolean;
    distance: boolean;
    centered: boolean;
    posture: boolean;
  };
}

export function evaluatePoseReadiness(pose: any, videoWidth: number, videoHeight: number, isSideProfile: boolean): ReadinessState {
  if (!pose || !pose.keypoints) {
    return {
      isReady: false,
      score: 0,
      feedback: "Step into the frame",
      checks: { visible: false, distance: false, centered: false, posture: false }
    };
  }

  const kps = pose.keypoints;
  const confidenceThreshold = 0.4;
  
  // Find keypoints
  const nose = kps.find((k: any) => k.name === 'nose');
  const leftAnkle = kps.find((k: any) => k.name === 'left_ankle');
  const rightAnkle = kps.find((k: any) => k.name === 'right_ankle');
  const leftShoulder = kps.find((k: any) => k.name === 'left_shoulder');
  const rightShoulder = kps.find((k: any) => k.name === 'right_shoulder');
  const leftWrist = kps.find((k: any) => k.name === 'left_wrist');
  const rightWrist = kps.find((k: any) => k.name === 'right_wrist');

  const hasHead = nose && nose.score && nose.score > confidenceThreshold;
  const hasFeet = (leftAnkle && leftAnkle.score && leftAnkle.score > confidenceThreshold) || 
                  (rightAnkle && rightAnkle.score && rightAnkle.score > confidenceThreshold);
  const hasShoulders = leftShoulder && leftShoulder.score && leftShoulder.score > confidenceThreshold &&
                       rightShoulder && rightShoulder.score && rightShoulder.score > confidenceThreshold;

  // 1. Visibility Check
  if (!hasHead || !hasFeet) {
    return {
      isReady: false,
      score: 30,
      feedback: !hasHead ? "Ensure your head is visible" : "Ensure your feet are visible",
      checks: { visible: false, distance: false, centered: false, posture: false }
    };
  }

  // 2. Distance Check (Head to feet should occupy about 60-80% of height)
  const topY = nose!.y;
  const bottomY = Math.max((leftAnkle?.score || 0) > confidenceThreshold ? leftAnkle!.y : 0, (rightAnkle?.score || 0) > confidenceThreshold ? rightAnkle!.y : 0);
  const bodyHeight = bottomY - topY;
  const heightRatio = bodyHeight / videoHeight;
  
  if (heightRatio > 0.9) {
    return {
      isReady: false,
      score: 50,
      feedback: "Move slightly back",
      checks: { visible: true, distance: false, centered: false, posture: false }
    };
  }
  if (heightRatio < 0.5) {
    return {
      isReady: false,
      score: 50,
      feedback: "Move closer to the camera",
      checks: { visible: true, distance: false, centered: false, posture: false }
    };
  }

  // 3. Center Check
  const centerX = (nose!.x + (leftAnkle?.x || nose!.x)) / 2;
  const xRatio = centerX / videoWidth;
  if (xRatio < 0.3) {
    return {
      isReady: false,
      score: 60,
      feedback: "Move slightly to your left (camera right)",
      checks: { visible: true, distance: true, centered: false, posture: false }
    };
  }
  if (xRatio > 0.7) {
    return {
      isReady: false,
      score: 60,
      feedback: "Move slightly to your right (camera left)",
      checks: { visible: true, distance: true, centered: false, posture: false }
    };
  }

  // 4. Posture Check
  if (!isSideProfile && hasShoulders) {
    const shoulderDiff = Math.abs(leftShoulder!.y - rightShoulder!.y);
    if (shoulderDiff > videoHeight * 0.05) {
      return {
        isReady: false,
        score: 80,
        feedback: "Keep your shoulders level",
        checks: { visible: true, distance: true, centered: true, posture: false }
      };
    }
    
    // Check if arms are relaxed down
    if (leftWrist && rightWrist && leftWrist.score! > confidenceThreshold && rightWrist.score! > confidenceThreshold) {
       if (leftWrist.y < leftShoulder!.y || rightWrist.y < rightShoulder!.y) {
         return {
           isReady: false,
           score: 80,
           feedback: "Relax your arms by your sides",
           checks: { visible: true, distance: true, centered: true, posture: false }
         };
       }
    }
  }

  // All checks pass
  return {
    isReady: true,
    score: 100,
    feedback: "Hold still...",
    checks: { visible: true, distance: true, centered: true, posture: true }
  };
}

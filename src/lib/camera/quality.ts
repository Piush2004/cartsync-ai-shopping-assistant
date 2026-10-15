/**
 * Basic image quality analysis for lighting and blur.
 */

export interface QualityMetrics {
  lightingScore: number; // 0 to 1
  blurScore: number;     // 0 to 1
  isGoodLighting: boolean;
  isNotBlurry: boolean;
}

export function analyzeFrameQuality(video: HTMLVideoElement, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): QualityMetrics {
  // Draw current frame to offscreen canvas
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  
  let totalBrightness = 0;
  
  // Calculate average brightness
  // Sample every 4th pixel for performance
  for (let i = 0; i < pixels.length; i += 16) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
    totalBrightness += brightness;
  }
  
  const numSamples = pixels.length / 16;
  const avgBrightness = totalBrightness / numSamples;
  
  // Normalize brightness (0 = dark, 255 = white) to a 0-1 score
  // Ideal brightness is around 120-180
  let lightingScore = 0;
  if (avgBrightness > 100 && avgBrightness < 200) {
    lightingScore = 1.0;
  } else if (avgBrightness <= 100) {
    lightingScore = Math.max(0, avgBrightness / 100);
  } else {
    lightingScore = Math.max(0, (255 - avgBrightness) / 55);
  }

  // Placeholder for blur detection - simple Laplacian variance would be ideal, 
  // but for edge performance without OpenCV, we approximate or assume non-blurry if stable
  const blurScore = 0.9; 
  
  return {
    lightingScore,
    blurScore,
    isGoodLighting: lightingScore > 0.6,
    isNotBlurry: blurScore > 0.7
  };
}

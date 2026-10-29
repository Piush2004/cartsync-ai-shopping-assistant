import type { Point2D } from "../vision/types";
import { BODY_LANDMARKS_FOR_MEASUREMENT } from "../vision/landmarks";
import { detectBlur, classifyBlurVariance, CANONICAL_BLUR_WIDTH } from "./blur";
import type { BlurCheck } from "./types";

export interface PixelBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Bounding box around the body-relevant landmarks (shoulders/elbows/wrists/
 * hips/knees/ankles -- not the face), padded outward so the crop doesn't
 * clip clothing/limb edges right at the landmark points, clamped to the
 * image bounds. Padding ratio is a reasonable engineering default, not a
 * measured value -- there is no "correct" padding to derive from a blur
 * benchmark.
 */
const BBOX_PADDING_RATIO = 0.08;

export function computeBodyBoundingBoxPx(
  landmarks: Point2D[],
  imageWidthPx: number,
  imageHeightPx: number
): PixelBoundingBox | null {
  const points = BODY_LANDMARKS_FOR_MEASUREMENT.map((idx) => landmarks[idx]).filter(Boolean);
  if (points.length < 4) return null; // too few points to trust a bounding box

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const padX = (maxX - minX) * BBOX_PADDING_RATIO;
  const padY = (maxY - minY) * BBOX_PADDING_RATIO;

  const x0 = Math.max(0, minX - padX);
  const y0 = Math.max(0, minY - padY);
  const x1 = Math.min(1, maxX + padX);
  const y1 = Math.min(1, maxY + padY);

  const widthPx = Math.round((x1 - x0) * imageWidthPx);
  const heightPx = Math.round((y1 - y0) * imageHeightPx);
  if (widthPx < 20 || heightPx < 20) return null; // degenerate box, not worth cropping to

  return {
    x: Math.round(x0 * imageWidthPx),
    y: Math.round(y0 * imageHeightPx),
    width: widthPx,
    height: heightPx,
  };
}

/**
 * Crops the captured frame to the body region and runs the same
 * canonical-width blur check used for the whole frame (see
 * blur.ts/CANONICAL_BLUR_WIDTH) on just that crop. Preferred over the
 * whole-frame blur estimate once landmarks exist, since a sharp person
 * against a blurry/moving background (or vice versa) is scored on what
 * actually matters for measurement -- the body -- not the background.
 * Returns null when no reliable bounding box exists (falls back to the
 * whole-frame blur check in that case, computed separately in assess.ts).
 */
export function computeBodyRegionBlur(
  canvas: HTMLCanvasElement,
  landmarks: Point2D[]
): BlurCheck | null {
  const bbox = computeBodyBoundingBoxPx(landmarks, canvas.width, canvas.height);
  if (!bbox) return null;

  const targetWidth = CANONICAL_BLUR_WIDTH;
  const targetHeight = Math.round((bbox.height / bbox.width) * targetWidth);
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = targetWidth;
  cropCanvas.height = targetHeight;
  const ctx = cropCanvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(canvas, bbox.x, bbox.y, bbox.width, bbox.height, 0, 0, targetWidth, targetHeight);
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const variance = detectBlur(imageData);
  const tier = classifyBlurVariance(variance);

  return {
    tier,
    varianceAtCanonicalWidth: variance,
    message: tier === "FAIL" ? "Your photo looks blurry. Hold your phone steady and try again."
      : tier === "WARNING" ? "Your photo looks a little soft. Hold still for a sharper capture."
      : undefined,
  };
}

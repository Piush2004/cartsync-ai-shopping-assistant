# Production Measurement Engine (Epic 1)

## Purpose
Replaces the mocked measurement extraction pipeline with a deterministic, mathematically rigorous engine. It extracts 8 core body measurements (chest, waist, hip, shoulder width, arm length, inseam, torso height, neck) from front and side smartphone photos utilizing user-reported height as a calibration anchor.

## Architecture
- **pose.ts**: Wraps MediaPipe BlazePose (WASM) to extract 33 3D body landmarks.
- **depth.ts**: Wraps ONNX Runtime Web to load Depth Anything V2 for extracting metric depth maps (resolving volumetric depth scale).
- **extraction.ts**: Core mathematical engine applying geometric formulas (elliptical perimeter, 3D Euclidean distances) to convert pixel spaces to real-world centimeters.
- **calibration.ts**: Derives confidence intervals from ML model certainty and manages global/local calibration offsets derived from future user feedback.
- **index.ts**: The async pipeline orchestrator executing stages in parallel and returning a structured `MeasurementProfile`.

## Tradeoffs
- **Deterministic Math vs Learned Parametric Model**: We opted for geometric math on keypoints rather than a heavy SMPL solver. This allows the entire pipeline to run natively in the browser without backend GPU costs, but slightly limits photorealistic mesh capabilities in v3.0.
- **Relative Depth Scaling**: Without a depth camera (LiDAR) or a physical reference object in frame (like a credit card), we must rely on user-reported height to convert pixels to centimeters.

## Future Improvements
1. Implement a true SMPL parametric solver for fully robust 3D reconstruction and virtual try-on compatibility (v4.0).
2. Train a linear regression offset model over 10,000 feedback cycles to automatically fix typical camera distortion errors.
3. Move ViTPose into a server-side validation check to override BlazePose in ambiguous edge cases (e.g. extremely baggy clothing).

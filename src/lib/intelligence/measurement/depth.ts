import * as ort from 'onnxruntime-web';

let session: ort.InferenceSession | null = null;
let isInitialized = false;

// Initialize ONNX Runtime Web for Depth Anything V2
export async function initDepthModel(): Promise<void> {
  if (isInitialized) return;

  try {
    // Set execution providers (WebGL is best for browser performance)
    ort.env.wasm.numThreads = 4;
    ort.env.wasm.simd = true;

    // Load the model from the public directory
    session = await ort.InferenceSession.create('/models/depth_anything_v2_vits.onnx', {
      executionProviders: ['webgl', 'wasm']
    });

    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize depth model:', error);
    throw new Error('Depth estimation model failed to load. Ensure the model file exists at /models/depth_anything_v2_vits.onnx');
  }
}

// Prepare image data for ONNX model (typically CHW float32 tensor normalized)
async function prepareImageTensor(blob: Blob): Promise<ort.Tensor> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context not available'));

      // Model specific resolution (usually 518x518 for ViT models)
      const targetSize = 518;
      canvas.width = targetSize;
      canvas.height = targetSize;
      
      // Draw image scaled to target size
      ctx.drawImage(img, 0, 0, targetSize, targetSize);
      const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
      
      // Convert RGBA to Float32 CHW (batch_size=1, channels=3, height=518, width=518)
      const { data, width, height } = imageData;
      const float32Data = new Float32Array(3 * width * height);
      
      for (let i = 0; i < width * height; i++) {
        // Normalize 0-255 to 0.0-1.0 (mean/std normalization might be needed depending on the exact model)
        // Standard ImageNet normalization:
        float32Data[i] = (data[i * 4] / 255.0 - 0.485) / 0.229;             // R
        float32Data[width * height + i] = (data[i * 4 + 1] / 255.0 - 0.456) / 0.224; // G
        float32Data[2 * width * height + i] = (data[i * 4 + 2] / 255.0 - 0.406) / 0.225; // B
      }
      
      resolve(new ort.Tensor('float32', float32Data, [1, 3, height, width]));
    };
    
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    
    img.src = url;
  });
}

export async function estimateDepth(blob: Blob): Promise<Float32Array> {
  if (!session) {
    await initDepthModel();
  }

  const tensor = await prepareImageTensor(blob);
  
  // Run inference
  const results = await session!.run({ image: tensor });
  
  // The output tensor name depends on the exported ONNX model, usually 'depth' or 'output'
  const outputName = session!.outputNames[0];
  const depthTensor = results[outputName];
  
  return depthTensor.data as Float32Array;
}

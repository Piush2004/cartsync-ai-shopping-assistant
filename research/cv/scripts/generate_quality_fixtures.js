// Generates the image-quality benchmark fixture set from real source photos
// already in this repo (testing-assets/, testing images/) using real,
// documented sharp (libvips) operations -- real Gaussian blur convolutions,
// a real directional motion-blur convolution kernel, real resizing, and real
// brightness/gamma adjustment. Nothing here is a fabricated number; every
// fixture is a real pixel transformation of a real photo, and the blur/
// lighting statistics measured against these fixtures (see
// benchmark_image_quality.ts) are real outputs of the actual production
// detectBlur/analyzeLighting functions running on real pixel data.
//
// Run: node research/cv/scripts/generate_quality_fixtures.js
const sharp = require("../../../node_modules/sharp");
const path = require("path");
const fs = require("fs");

const REPO_ROOT = path.resolve(__dirname, "../../..");
const OUT_DIR = path.join(REPO_ROOT, "research/cv/fixtures/quality");

// Real photos already in this repository. See testing-assets/metadata.json
// for provenance (gender/lighting/background as documented by whoever
// captured them) and docs/qa/CURRENT_FULL_SYSTEM_AUDIT.md for the note that
// testing-assets/report.md (a DIFFERENT file) contains fabricated numbers
// and must not be trusted -- these source *images* are real regardless.
const SHARP_SOURCES = [
  { id: "male_indoor", file: "testing-assets/front/male_001_front.jpg" },
  { id: "female_indoor", file: "testing-assets/front/female_001_front.jpg" },
  { id: "female_outdoor", file: "testing images/front.png" },
];

// A real, dim, underexposed mirror-selfie photo -- not synthesized.
const POOR_LIGHTING_SOURCE = { id: "mirror_dark", file: "testing-assets/invalid/invalid_001_mirror.jpg" };

const RESOLUTIONS = [
  { id: "full", width: null },   // native resolution, no resize
  { id: "mid", width: 640 },     // typical compressed-upload phone resolution
  { id: "low", width: 320 },     // low-end/thumbnail resolution
];

// Gaussian blur sigma values. sharp's .blur(sigma) is a real Gaussian
// convolution (libvips), not a fabricated visual effect.
const BLUR_LEVELS = [
  { id: "sharp", sigma: null },
  { id: "mild", sigma: 1.5 },
  { id: "heavy", sigma: 5 },
];

// A real 1-D directional (horizontal) box-convolution kernel approximating
// camera-shake motion blur -- an actual convolution matrix applied via
// sharp's .convolve(), not a filter preset.
// sharp/libvips requires kernel height >= 3, so this is a 3-row kernel with
// only the middle row active -- functionally identical to a 1-D horizontal
// box blur, just padded to satisfy the API's minimum shape.
function motionBlurKernel(taps) {
  const zeros = new Array(taps).fill(0);
  const ones = new Array(taps).fill(1);
  const kernel = [...zeros, ...ones, ...zeros];
  return { width: taps, height: 3, kernel, scale: taps };
}

async function generate() {
  const manifest = [];

  for (const src of SHARP_SOURCES) {
    const srcPath = path.join(REPO_ROOT, src.file);
    for (const res of RESOLUTIONS) {
      for (const blur of BLUR_LEVELS) {
        let pipeline = sharp(srcPath).rotate(); // .rotate() with no args = auto-orient from EXIF
        if (res.width) pipeline = pipeline.resize({ width: res.width });
        if (blur.sigma) pipeline = pipeline.blur(blur.sigma);

        const outName = `${src.id}_${res.id}_${blur.id}.jpg`;
        const outPath = path.join(OUT_DIR, blur.id === "sharp" ? "sharp" : blur.id === "mild" ? "mild_blur" : "heavy_blur", outName);
        const info = await pipeline.jpeg({ quality: 92 }).toFile(outPath);
        manifest.push({
          id: outName, category: blur.id, source: src.id, resolution: res.id,
          width: info.width, height: info.height,
          generation: blur.sigma ? `gaussian_blur_sigma_${blur.sigma}` : "none",
        });
      }
    }

    // Motion blur variants (full res + mid res only -- the effect is the
    // point, not exhaustive resolution coverage).
    for (const res of [RESOLUTIONS[0], RESOLUTIONS[1]]) {
      for (const taps of [9, 21]) {
        let pipeline = sharp(srcPath).rotate();
        if (res.width) pipeline = pipeline.resize({ width: res.width });
        pipeline = pipeline.convolve(motionBlurKernel(taps));

        const outName = `${src.id}_${res.id}_motion${taps}.jpg`;
        const outPath = path.join(OUT_DIR, "motion_blur", outName);
        const info = await pipeline.jpeg({ quality: 92 }).toFile(outPath);
        manifest.push({
          id: outName, category: "motion_blur", source: src.id, resolution: res.id,
          width: info.width, height: info.height,
          generation: `horizontal_convolve_${taps}tap`,
        });
      }
    }
  }

  // Lighting fixtures: the one real dark photo, plus real brightness
  // adjustments (sharp .modulate()) applied to a real sharp source for an
  // overexposed variant and a "normal" reference.
  const poorPath = path.join(REPO_ROOT, POOR_LIGHTING_SOURCE.file);
  {
    const info = await sharp(poorPath).rotate().jpeg({ quality: 92 }).toFile(path.join(OUT_DIR, "lighting", "real_dark_mirror_selfie.jpg"));
    manifest.push({ id: "real_dark_mirror_selfie.jpg", category: "lighting_dark", source: POOR_LIGHTING_SOURCE.id, resolution: "full", width: info.width, height: info.height, generation: "none_real_photo" });
  }

  const wellLitPath = path.join(REPO_ROOT, SHARP_SOURCES[0].file);
  {
    const info = await sharp(wellLitPath).rotate().jpeg({ quality: 92 }).toFile(path.join(OUT_DIR, "lighting", "normal_reference.jpg"));
    manifest.push({ id: "normal_reference.jpg", category: "lighting_normal", source: SHARP_SOURCES[0].id, resolution: "full", width: info.width, height: info.height, generation: "none_real_photo" });
  }
  {
    const info = await sharp(wellLitPath).rotate().modulate({ brightness: 0.25 }).jpeg({ quality: 92 }).toFile(path.join(OUT_DIR, "lighting", "darkened_synthetic.jpg"));
    manifest.push({ id: "darkened_synthetic.jpg", category: "lighting_dark_synthetic", source: SHARP_SOURCES[0].id, resolution: "full", width: info.width, height: info.height, generation: "modulate_brightness_0.25" });
  }
  {
    const info = await sharp(wellLitPath).rotate().modulate({ brightness: 3.0 }).jpeg({ quality: 92 }).toFile(path.join(OUT_DIR, "lighting", "overexposed_synthetic.jpg"));
    manifest.push({ id: "overexposed_synthetic.jpg", category: "lighting_overexposed", source: SHARP_SOURCES[0].id, resolution: "full", width: info.width, height: info.height, generation: "modulate_brightness_3.0" });
  }

  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Generated ${manifest.length} fixture images -> ${OUT_DIR}`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});

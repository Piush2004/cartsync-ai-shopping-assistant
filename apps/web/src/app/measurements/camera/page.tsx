"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraView } from "@/components/camera/CameraView";
import { MeasurementReview } from "@/components/measurements/MeasurementReview";
import { GlowCard } from "@/components/ui/GlowCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, AlertTriangle, Loader2, ScanFace } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics/track";
import { getToken } from "@/app/actions/auth";
import { graphApi } from "@/lib/graph";
import { measurementApi } from "@/lib/measurement";
import { MediaPipeProvider } from "@/lib/cv/vision/mediapipe-provider";
import type { PoseResult } from "@/lib/cv/vision/types";
import { assessPrePoseQuality } from "@/lib/cv/quality/validation";
import { assessPoseQuality, combineQualityResult, imageQualityScore } from "@/lib/cv/quality/assess";
import { computeBodyRegionBlur } from "@/lib/cv/quality/body-region";
import type { ImageQualityResult } from "@/lib/cv/quality/types";
import { runMeasurementPipeline, type PipelineResult, type CaptureInput } from "@/lib/cv/measurement/pipeline";

type FlowStep = "height" | "front" | "side" | "processing" | "review" | "saving" | "failed";

interface StoredCapture {
  capture: CaptureInput;
}

export default function CameraMeasurementPage() {
  const router = useRouter();
  const [step, setStep] = useState<FlowStep>("height");
  const [height, setHeight] = useState("");
  const [retryMessages, setRetryMessages] = useState<string[] | null>(null);
  const [frontCapture, setFrontCapture] = useState<StoredCapture | null>(null);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [pipelineFailureMessage, setPipelineFailureMessage] = useState<string | null>(null);
  const [previousMeasurements, setPreviousMeasurements] = useState<Record<string, number | undefined>>({});
  const [saving, setSaving] = useState(false);

  const providerRef = useRef<MediaPipeProvider | null>(null);
  const modelReadyRef = useRef<Promise<void> | null>(null);

  // Load a saved height (from a prior manual entry) and prior measurements so
  // we can flag significant historical changes -- start warming up the
  // MediaPipe model in the background so it's ready by the time the user
  // finishes entering their height (Phase 19 lazy-load requirement: only on
  // this scan flow, never on landing/dashboard/products).
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const graph = await graphApi.getMe(token);
        if (graph?.raw_measurements?.height) {
          setHeight(String(graph.raw_measurements.height));
        }
        if (graph?.effective_measurements) {
          const m = graph.effective_measurements;
          setPreviousMeasurements({
            chest: m.chest_circumference ?? undefined,
            waist: m.waist_circumference ?? undefined,
            hip: m.hip_circumference ?? undefined,
            shoulder: m.shoulder_width ?? undefined,
            inseam: m.inseam ?? undefined,
          });
        }
      } catch {
        // Non-fatal: height/history are conveniences, not requirements.
      }
    })();

    providerRef.current = new MediaPipeProvider();
    modelReadyRef.current = providerRef.current.initialize();

    return () => {
      providerRef.current?.dispose();
    };
  }, []);

  const heightCm = parseFloat(height);
  const heightValid = Number.isFinite(heightCm) && heightCm >= 100 && heightCm <= 230;

  async function processCapture(
    canvas: HTMLCanvasElement,
    imageData: ImageData
  ): Promise<{ capture: CaptureInput; quality: ImageQualityResult } | { capture: null; quality: ImageQualityResult | null } | null> {
    const prePose = assessPrePoseQuality(canvas, imageData);
    if (prePose.blur.tier === "FAIL" || prePose.lighting.tier === "FAIL" || prePose.resolution.tier === "FAIL") {
      // Reject before paying MediaPipe's inference cost -- see quality/validation.ts.
      const quality = combineQualityResult(prePose, {
        bodyVisibility: { tier: "FAIL" },
        landmarkConfidence: { tier: "FAIL" },
        framing: { tier: "FAIL" },
      });
      return { capture: null, quality };
    }

    await modelReadyRef.current;
    if (!providerRef.current) return null;

    let poseResult: PoseResult | null;
    try {
      poseResult = await providerRef.current.processFrame(canvas);
    } catch (err) {
      console.error("Pose detection failed", err);
      poseResult = null;
    }

    const poseChecks = assessPoseQuality(poseResult);
    const bodyRegionBlur = poseResult ? computeBodyRegionBlur(canvas, poseResult.landmarks2D) : null;
    const quality = combineQualityResult(prePose, poseChecks, bodyRegionBlur);

    if (quality.overall === "FAIL" || !poseResult) {
      return { capture: null, quality };
    }

    const capture: CaptureInput = {
      poseResult,
      imageWidthPx: canvas.width,
      imageHeightPx: canvas.height,
      imageQualityScore: imageQualityScore(quality),
    };
    return { capture, quality };
  }

  const handleFrontCapture = async (_src: string, canvas: HTMLCanvasElement, imageData: ImageData) => {
    trackEvent("scan_started", { view: "front" });
    const result = await processCapture(canvas, imageData);
    if (!result || !result.capture) {
      trackEvent("scan_quality_failed", { view: "front", failures: result?.quality?.actionableMessages.join(",") });
      setRetryMessages(result?.quality?.actionableMessages ?? ["We couldn't process that photo. Please try again."]);
      return;
    }
    setRetryMessages(null);
    if (result.quality.overall === "WARNING") {
      // Non-blocking: proceed, but let the user know accuracy may be reduced.
      result.quality.actionableMessages.forEach((m) => toast.warning(m));
    }
    setFrontCapture({ capture: result.capture });
    setStep("side");
  };

  const handleSideCapture = async (_src: string, canvas: HTMLCanvasElement, imageData: ImageData) => {
    const result = await processCapture(canvas, imageData);
    if (!result || !result.capture) {
      trackEvent("scan_quality_failed", { view: "side", failures: result?.quality?.actionableMessages.join(",") });
      setRetryMessages(result?.quality?.actionableMessages ?? ["We couldn't process that photo. Please try again."]);
      return;
    }
    setRetryMessages(null);
    if (result.quality.overall === "WARNING") {
      result.quality.actionableMessages.forEach((m) => toast.warning(m));
    }
    setStep("processing");

    if (!frontCapture) {
      setStep("front"); // shouldn't happen, but don't strand the user
      return;
    }

    const pipeline = runMeasurementPipeline(frontCapture.capture, result.capture, heightCm, previousMeasurements);
    if (!pipeline.ok) {
      trackEvent("scan_failed", { reason: pipeline.reason });
      setPipelineFailureMessage(
        "We couldn't confidently read your measurements from these captures. Try again with better lighting and make sure your full body -- head to feet -- is visible."
      );
      setStep("failed");
      return;
    }

    trackEvent("scan_completed", {
      confidence_bucket: pipeline.confidenceBreakdown.overall >= 0.7 ? "high" : pipeline.confidenceBreakdown.overall >= 0.4 ? "medium" : "low",
      processing_time: Date.now(),
      requires_review: pipeline.requiresReview,
    });
    setPipelineResult(pipeline);
    setStep("review");
  };

  const resetFlow = () => {
    setFrontCapture(null);
    setPipelineResult(null);
    setPipelineFailureMessage(null);
    setRetryMessages(null);
    trackEvent("scan_retaken");
    setStep("front");
  };

  const handleConfirm = async () => {
    if (!pipelineResult) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      await measurementApi.extract(token, {
        source_type: "camera",
        raw_data: {
          chest: pipelineResult.measurements.chest.valueCm,
          waist: pipelineResult.measurements.waist.valueCm,
          hip: pipelineResult.measurements.hip.valueCm,
          shoulder: pipelineResult.measurements.shoulder.valueCm,
          inseam: pipelineResult.measurements.inseam.valueCm,
          arm_length: pipelineResult.measurements.arm_length.valueCm,
          torso_length: pipelineResult.measurements.torso_length.valueCm,
          height: heightCm,
        },
        model_version: pipelineResult.modelVersion,
        algorithm_version: pipelineResult.algorithmVersion,
        calibration_method: pipelineResult.calibrationMethod,
        confidence_breakdown: {
          overall: pipelineResult.confidenceBreakdown.overall,
          pose: pipelineResult.confidenceBreakdown.pose,
          image_quality: pipelineResult.confidenceBreakdown.imageQuality,
          calibration: pipelineResult.confidenceBreakdown.calibration,
          geometry: pipelineResult.confidenceBreakdown.geometry,
          front_side_consistency: pipelineResult.confidenceBreakdown.frontSideConsistency,
        },
      });

      trackEvent("scan_measurements_confirmed");
      toast.success("Your measurements have been saved.");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save measurements");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/measurements" className="text-text-muted hover:text-text-primary flex items-center gap-2 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Measurements
          </Link>
          <h1 className="text-3xl font-display font-bold text-text-primary tracking-tight">Camera Scan</h1>
          <p className="text-text-secondary mt-1">
            We&apos;ll use your camera to estimate your measurements from a front and side photo. Nothing is saved until you review and confirm it.
          </p>
        </div>
      </div>

      {step === "height" && (
        <GlowCard className="p-8 max-w-md">
          <h2 className="text-xl font-bold text-text-primary mb-2">What&apos;s your height?</h2>
          <p className="text-text-secondary text-sm mb-6">
            We use this to convert your photo to real-world measurements. It never leaves your device except as part of the final measurement you confirm.
          </p>
          <Input
            label="Height (cm)"
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="e.g. 165"
          />
          <Button
            variant="primary"
            className="w-full mt-6"
            disabled={!heightValid}
            onClick={() => setStep("front")}
          >
            Continue to Front Photo
          </Button>
          {height && !heightValid && (
            <p className="text-xs text-accent-rose mt-2">Enter a height between 100 and 230 cm.</p>
          )}
        </GlowCard>
      )}

      {(step === "front" || step === "side") && (
        <div className="space-y-4">
          <CameraView
            onCapture={step === "front" ? handleFrontCapture : handleSideCapture}
            instructions={
              step === "front"
                ? "Stand straight, face the camera, keep both feet visible, and make sure your entire body is inside the frame."
                : "Turn 90°, keep your body straight, arms naturally at your sides, and keep both feet visible."
            }
          />
          <p className="text-center text-sm text-text-muted">
            Step {step === "front" ? "1" : "2"} of 2: {step === "front" ? "Front" : "Side"} photo
          </p>
          {retryMessages && (
            <GlowCard className="p-5 border-accent-amber/40 bg-accent-amber/5 max-w-lg mx-auto">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm text-text-primary">
                  {retryMessages.map((msg, i) => (
                    <p key={i}>{msg}</p>
                  ))}
                </div>
              </div>
            </GlowCard>
          )}
        </div>
      )}

      {step === "processing" && (
        <GlowCard className="p-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-accent-blue/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <ScanFace className="w-8 h-8 text-accent-blue" />
          </div>
          <h3 className="text-xl font-bold text-text-primary mt-4">Reading your measurements...</h3>
          <p className="text-text-secondary text-sm mt-2">This runs entirely on your device.</p>
          <Loader2 className="w-5 h-5 text-accent-blue animate-spin mx-auto mt-4" />
        </GlowCard>
      )}

      {step === "failed" && (
        <GlowCard className="p-8 max-w-md mx-auto text-center border-accent-rose/30">
          <AlertTriangle className="w-10 h-10 text-accent-rose mx-auto mb-4" />
          <h3 className="text-xl font-bold text-text-primary mb-2">Measurement extraction failed</h3>
          <p className="text-text-secondary text-sm mb-6">{pipelineFailureMessage}</p>
          <div className="flex gap-3">
            <Button variant="primary" className="flex-1" onClick={resetFlow}>
              Try Again
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => router.push("/measurements")}>
              Enter Manually Instead
            </Button>
          </div>
        </GlowCard>
      )}

      {step === "review" && pipelineResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <MeasurementReview
            result={pipelineResult}
            onConfirm={handleConfirm}
            onRetake={resetFlow}
            loading={saving}
          />
        </motion.div>
      )}
    </div>
  );
}

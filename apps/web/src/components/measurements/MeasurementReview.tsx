"use client";

import { GlowCard } from "@/components/ui/GlowCard";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Check, RotateCcw } from "lucide-react";
import type { PipelineResult } from "@/lib/cv/measurement/pipeline";

const FIELD_LABELS: Record<keyof PipelineResult["measurements"], string> = {
  chest: "Chest",
  waist: "Waist",
  hip: "Hips",
  shoulder: "Shoulders",
  arm_length: "Arm length",
  inseam: "Inseam",
  torso_length: "Torso length",
};

function confidenceLabel(confidence: number): { text: string; className: string } {
  if (confidence >= 0.7) return { text: `${Math.round(confidence * 100)}% confidence`, className: "text-accent-emerald" };
  if (confidence >= 0.4) return { text: `${Math.round(confidence * 100)}% confidence`, className: "text-accent-amber" };
  return { text: `${Math.round(confidence * 100)}% confidence`, className: "text-accent-rose" };
}

interface MeasurementReviewProps {
  result: PipelineResult;
  onConfirm: () => void;
  onRetake: () => void;
  loading?: boolean;
}

export function MeasurementReview({ result, onConfirm, onRetake, loading }: MeasurementReviewProps) {
  const hasWarnings =
    result.plausibilityFailures.length > 0 ||
    result.historicalFlags.length > 0 ||
    result.consistencyWarnings.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-text-primary">Your Fit Measurements</h2>
        <p className="text-text-secondary mt-1 text-sm">
          Estimated from your photos. Review before saving to your profile -- nothing is saved automatically.
        </p>
      </div>

      {hasWarnings && (
        <GlowCard className="p-5 border-accent-amber/40 bg-accent-amber/5">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              {result.consistencyWarnings.includes("MEASUREMENT_INCONSISTENCY") && (
                <p className="text-text-primary">
                  Your front and side photos gave inconsistent readings for some measurements. Consider retaking for better accuracy.
                </p>
              )}
              {result.historicalFlags.map((flag) => (
                <p key={flag.field} className="text-text-primary">
                  Your new {FIELD_LABELS[flag.field as keyof typeof FIELD_LABELS] ?? flag.field} differs
                  meaningfully from your previous scan ({flag.previousValueCm.toFixed(1)}cm &rarr; {flag.newValueCm.toFixed(1)}cm). Please double-check before saving.
                </p>
              ))}
              {result.plausibilityFailures.map((f) => (
                <p key={f.field} className="text-text-primary">
                  {FIELD_LABELS[f.field as keyof typeof FIELD_LABELS] ?? f.field} came out as an implausible value and was excluded.
                </p>
              ))}
            </div>
          </div>
        </GlowCard>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {(Object.keys(result.measurements) as Array<keyof PipelineResult["measurements"]>).map((field) => {
          const m = result.measurements[field];
          const conf = confidenceLabel(m.confidence);
          const isImplausible = result.plausibilityFailures.some((f) => f.field === field);
          return (
            <GlowCard key={field} className={`p-5 ${isImplausible ? "opacity-50" : ""}`}>
              <p className="text-xs uppercase tracking-wider text-text-muted font-semibold">{FIELD_LABELS[field]}</p>
              <p className="text-2xl font-bold text-text-primary mt-1">
                {isImplausible ? "--" : `${m.valueCm.toFixed(1)} cm`}
              </p>
              <p className={`text-xs mt-1 font-medium ${conf.className}`}>{conf.text}</p>
              {m.isEstimate && (
                <p className="text-[10px] text-text-muted mt-1">Estimated -- not a direct measurement</p>
              )}
            </GlowCard>
          );
        })}
      </div>

      <GlowCard className="p-5">
        <p className="text-sm text-text-secondary">
          Overall confidence: <span className="font-semibold text-text-primary">{Math.round(result.confidenceBreakdown.overall * 100)}%</span>
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 text-xs text-text-muted">
          <div>Pose: {Math.round(result.confidenceBreakdown.pose * 100)}%</div>
          <div>Image quality: {Math.round(result.confidenceBreakdown.imageQuality * 100)}%</div>
          <div>Calibration: {Math.round(result.confidenceBreakdown.calibration * 100)}%</div>
          <div>Geometry: {Math.round(result.confidenceBreakdown.geometry * 100)}%</div>
          <div>Front/side match: {Math.round(result.confidenceBreakdown.frontSideConsistency * 100)}%</div>
        </div>
      </GlowCard>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button variant="primary" className="flex-1" icon={<Check className="w-4 h-4" />} onClick={onConfirm} loading={loading}>
          Confirm & Save
        </Button>
        <Button variant="outline" className="flex-1" icon={<RotateCcw className="w-4 h-4" />} onClick={onRetake} disabled={loading}>
          Retake Photos
        </Button>
      </div>
    </div>
  );
}

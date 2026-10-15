'use client';
import React, { useEffect, useRef } from 'react';
// Pose import removed
import type { QualityMetrics } from '@/lib/camera/quality';
import type { ReadinessState } from '@/lib/camera/readiness';

interface DebugOverlayProps {
  pose: any;
  quality: QualityMetrics | null;
  readiness: ReadinessState | null;
  fps: number;
  width: number;
  height: number;
  enabled: boolean;
}

export function CameraDebugOverlay({ pose, quality, readiness, fps, width, height, enabled }: DebugOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw Pose Skeleton
    if (pose && pose.keypoints) {
      ctx.fillStyle = '#00FFCC';
      pose.keypoints.forEach((kp: any) => {
        if ((kp.score || 0) > 0.4) {
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
      // Very basic skeleton lines could be added here
    }
  }, [pose, enabled, width, height]);

  if (!enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="absolute inset-0 w-full h-full"
      />
      
      <div className="absolute top-4 left-4 bg-black/80 text-[10px] font-mono text-[#00FFCC] p-4 rounded-xl border border-[#00FFCC]/30 backdrop-blur-md flex flex-col gap-1 w-64">
        <div className="font-bold border-b border-[#00FFCC]/30 pb-1 mb-1 text-white">Developer Debug Overlay</div>
        <div className="flex justify-between"><span>FPS</span><span>{fps.toFixed(1)}</span></div>
        <div className="flex justify-between"><span>Lighting</span><span>{quality?.lightingScore.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Blur</span><span>{quality?.blurScore.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Ready Score</span><span>{readiness?.score}</span></div>
        
        <div className="mt-2 pt-2 border-t border-[#00FFCC]/30 flex flex-col gap-1">
          <div className="flex justify-between"><span>Visible</span><span>{readiness?.checks.visible ? '✓' : '✗'}</span></div>
          <div className="flex justify-between"><span>Distance</span><span>{readiness?.checks.distance ? '✓' : '✗'}</span></div>
          <div className="flex justify-between"><span>Centered</span><span>{readiness?.checks.centered ? '✓' : '✗'}</span></div>
          <div className="flex justify-between"><span>Posture</span><span>{readiness?.checks.posture ? '✓' : '✗'}</span></div>
        </div>
      </div>
    </div>
  );
}

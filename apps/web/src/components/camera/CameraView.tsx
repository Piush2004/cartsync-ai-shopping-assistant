"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, StopCircle, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlowCard } from "@/components/ui/GlowCard";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { selectBestFrame, type FrameCandidate } from "@/lib/cv/quality/temporal";

/** Number of frames captured in quick succession so the sharpest can be kept -- counters hand shake right at the capture moment. */
const BURST_FRAME_COUNT = 3;
/** Gap between burst frames. Short enough that framing/lighting don't meaningfully change, long enough to actually sample distinct hand-shake moments. */
const BURST_FRAME_INTERVAL_MS = 120;

interface CameraViewProps {
  onCapture: (imageSrc: string, canvas: HTMLCanvasElement, imageData: ImageData) => void;
  isProcessing?: boolean;
  /** Optional copy overriding the default hint text, e.g. front vs side capture instructions. */
  instructions?: string;
}

export function CameraView({ onCapture, isProcessing = false, instructions }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // A ref mirrors `stream` alongside the state. The mount effect below has an
  // empty dependency array (deliberately -- we only want to request the
  // camera once), so its cleanup closure would otherwise always see `stream`
  // as null (its value at the time that single closure was created) and
  // never actually call track.stop(), leaving the camera light on
  // indefinitely after the user navigates away. Reading from the ref instead
  // of the stale `stream` closure fixes that.
  const streamRef = useRef<MediaStream | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  const startCamera = async (front = true) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: front ? "user" : "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      streamRef.current = mediaStream;
      setHasPermission(true);
      setCameraError(null);
      setIsFrontCamera(front);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setHasPermission(false);
      setCameraError(err.message || "Failed to access camera");
      toast.error("Camera access denied. Please allow permissions in your browser.");
    }
  };

  useEffect(() => {
    startCamera(isFrontCamera);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    if (countdown !== null) return;

    // Start countdown
    setCountdown(3);
    let count = 3;

    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count > 0 ? count : null);
      if (count === 0) {
        clearInterval(interval);
        countdownIntervalRef.current = null;
        takePicture();
      }
    }, 1000);
    countdownIntervalRef.current = interval;
  };

  const grabFrame = (): FrameCandidate | null => {
    const video = videoRef.current;
    if (!video) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    if (isFrontCamera) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return { canvas, imageData };
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Captures BURST_FRAME_COUNT frames a short interval apart and keeps the
   * sharpest (see quality/temporal.ts) instead of relying on whatever single
   * instant the countdown happened to land on -- a real, if small, defense
   * against hand shake right at capture time.
   */
  const takePicture = async () => {
    const candidates: FrameCandidate[] = [];
    for (let i = 0; i < BURST_FRAME_COUNT; i++) {
      const frame = grabFrame();
      if (frame) candidates.push(frame);
      if (i < BURST_FRAME_COUNT - 1) await sleep(BURST_FRAME_INTERVAL_MS);
    }
    if (candidates.length === 0) return;

    const { bestIndex } = selectBestFrame(candidates);
    const best = candidates[bestIndex];
    const imageSrc = best.canvas.toDataURL("image/jpeg", 0.9);
    onCapture(imageSrc, best.canvas, best.imageData);
  };;

  const toggleCamera = () => {
    startCamera(!isFrontCamera);
  };

  if (hasPermission === false) {
    return (
      <GlowCard className="flex flex-col items-center justify-center p-12 text-center h-[500px] border-accent-rose/30">
        <VideoOff className="w-12 h-12 text-accent-rose mb-4" />
        <h3 className="text-xl font-bold text-text-primary mb-2">Camera Access Denied</h3>
        <p className="text-sm text-text-secondary mb-6 max-w-sm">
          CartSync needs camera access to measure your proportions. Please update your browser settings and try again.
        </p>
        <Button variant="outline" onClick={() => startCamera(isFrontCamera)}>
          Retry Access
        </Button>
      </GlowCard>
    );
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto rounded-3xl overflow-hidden bg-black aspect-[3/4] md:aspect-video shadow-2xl border border-border">
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${isFrontCamera ? 'scale-x-[-1]' : ''}`}
      />

      {/* Silhouette Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
        <svg viewBox="0 0 100 200" className="w-auto h-[90%] stroke-accent-blue fill-none" style={{ strokeWidth: 1.5, strokeDasharray: "4 4" }}>
          {/* Simple Human Outline */}
          <path d="M 50 10 C 60 10, 60 25, 50 25 C 40 25, 40 10, 50 10 Z" /> {/* Head */}
          <path d="M 50 25 L 50 40" /> {/* Neck */}
          <path d="M 25 40 L 75 40 L 85 90 L 75 90 L 65 40" /> {/* Arms */}
          <path d="M 35 40 L 25 90 L 15 90 L 25 40" /> {/* Left Arm */}
          <path d="M 35 40 L 65 40 L 65 110 L 35 110 Z" /> {/* Torso */}
          <path d="M 35 110 L 35 190 L 45 190 L 45 110" /> {/* Left Leg */}
          <path d="M 65 110 L 65 190 L 55 190 L 55 110" /> {/* Right Leg */}
          <path d="M 45 110 L 55 110" /> {/* Crotch */}
        </svg>
      </div>

      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 z-20"
          >
            <span className="text-white text-9xl font-black drop-shadow-2xl">
              {countdown}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center z-10">
        <p className="text-white/80 text-sm font-medium mb-6 text-center max-w-md drop-shadow-md">
          {instructions ?? "Align your body with the outline. Ensure you are in a well-lit area and fully visible from head to toe."}
        </p>
        
        <div className="flex items-center gap-6 w-full max-w-md justify-between">
          <button 
            onClick={toggleCamera}
            disabled={countdown !== null || isProcessing}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleCapture}
            disabled={countdown !== null || isProcessing}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 group disabled:opacity-50"
          >
            <div className={`w-full h-full rounded-full transition-all duration-300 ${isProcessing ? 'bg-accent-blue animate-pulse' : 'bg-white group-hover:scale-95'}`}>
              {isProcessing && <StopCircle className="w-8 h-8 text-white mx-auto mt-5 animate-spin" />}
            </div>
          </button>

          <div className="w-12 h-12" /> {/* Spacer for symmetry */}
        </div>
      </div>
    </div>
  );
}

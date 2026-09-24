"use client";

import { useEffect, useRef } from "react";
import { drawFaceEffect, type FaceLandmark } from "../../lib/face-effects-renderer";
import type { FaceEffectId } from "../../lib/face-effects";

declare global {
  interface Window {
    FaceMesh?: new (options: { locateFile: (file: string) => string }) => {
      setOptions: (options: Record<string, unknown>) => void;
      onResults: (callback: (results: { multiFaceLandmarks?: FaceLandmark[][] }) => void) => void;
      send: (input: { image: HTMLVideoElement }) => Promise<void>;
      close?: () => void;
    };
  }
}

const MEDIAPIPE_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/";
let scriptPromise: Promise<void> | null = null;

function loadFaceMeshScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.FaceMesh) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-usbooth-face-mesh="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load face effects.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = `${MEDIAPIPE_BASE}face_mesh.js`;
    script.async = true;
    script.dataset.usboothFaceMesh = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load face effects."));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

function mapLandmarksToCover(
  landmarks: FaceLandmark[],
  video: HTMLVideoElement,
  width: number,
  height: number,
  mirror: boolean,
) {
  const sourceWidth = video.videoWidth || 1280;
  const sourceHeight = video.videoHeight || 720;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;
  const offsetX = (width - renderedWidth) / 2;
  const offsetY = (height - renderedHeight) / 2;

  return landmarks.map((landmark) => ({
    x: ((mirror ? 1 - landmark.x : landmark.x) * renderedWidth + offsetX) / width,
    y: (landmark.y * renderedHeight + offsetY) / height,
    z: landmark.z,
  }));
}

export default function FaceEffectsOverlay({
  videoRef,
  effectId,
  landmarksRef,
  mirror = true,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  effectId: FaceEffectId;
  landmarksRef: React.MutableRefObject<FaceLandmark[]>;
  mirror?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runningRef = useRef(true);
  const busyRef = useRef(false);
  const frameRequestRef = useRef<number | null>(null);

  useEffect(() => {
    runningRef.current = true;
    let mesh: InstanceType<NonNullable<typeof window.FaceMesh>> | null = null;
    let detectorTimer: ReturnType<typeof setInterval> | null = null;

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const draw = () => {
      if (!runningRef.current) return;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const rect = video.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const raw = landmarksRef.current;
      if (raw.length >= 100) {
        const mapped = mapLandmarksToCover(raw, video, width, height, mirror);
        // drawFaceEffect expects normalized coordinates, so use the canvas size
        // as its coordinate system after mapping the object-fit: cover crop.
        drawFaceEffect(ctx, width, height, mapped, effectId, false);
      }

      frameRequestRef.current = window.requestAnimationFrame(draw);
    };

    if (effectId === "none") {
      landmarksRef.current = [];
      clearCanvas();
      return () => { runningRef.current = false; };
    }

    const start = async () => {
      try {
        await loadFaceMeshScript();
        if (!runningRef.current || !window.FaceMesh) return;

        mesh = new window.FaceMesh({ locateFile: (file) => `${MEDIAPIPE_BASE}${file}` });
        mesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });
        mesh.onResults((results) => {
          if (!runningRef.current) return;
          landmarksRef.current = results.multiFaceLandmarks?.[0] ?? [];
        });

        detectorTimer = setInterval(() => {
          const video = videoRef.current;
          if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0 || busyRef.current || !mesh) return;
          busyRef.current = true;
          void mesh.send({ image: video }).catch(() => undefined).finally(() => {
            busyRef.current = false;
          });
        }, 70);

        frameRequestRef.current = window.requestAnimationFrame(draw);
      } catch (error) {
        console.error("Face effects failed to initialise:", error);
        landmarksRef.current = [];
        clearCanvas();
      }
    };

    void start();
    const resize = () => draw();
    window.addEventListener("resize", resize);

    return () => {
      runningRef.current = false;
      if (detectorTimer) clearInterval(detectorTimer);
      if (frameRequestRef.current !== null) window.cancelAnimationFrame(frameRequestRef.current);
      frameRequestRef.current = null;
      mesh?.close?.();
      landmarksRef.current = [];
      window.removeEventListener("resize", resize);
      clearCanvas();
    };
  }, [effectId, landmarksRef, videoRef, mirror]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 4,
      }}
    />
  );
}

"use client";

import { useEffect, useRef } from "react";
import { drawTemplateDynamicText, getTemplateArtwork, traceTemplatePhotoSlot } from "../../lib/templates/template-graphics";
type TemplateArtworkLayerProps = {
  templateId: string;
  width: number;
  height: number;
  participantCount: number;
  layer: "background" | "slots" | "foreground" | "text";
  participantNames?: string[];
};

export default function TemplateArtworkLayer({
  templateId,
  width,
  height,
  participantCount,
  layer,
  participantNames = [],
}: TemplateArtworkLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const artwork = getTemplateArtwork(
      templateId,
      width,
      height,
      Math.max(1, participantCount)
    );

    if (layer === "background") {
      // Original UsBooth artwork is generated directly on the canvas.
      artwork.drawBackground?.(ctx, width, height);
    } else if (layer === "slots") {
      artwork.photoRects.forEach((slot) => {
        ctx.save();
        traceTemplatePhotoSlot(ctx, slot);
        ctx.fillStyle = "#fffdf8";
        ctx.fill();
        ctx.strokeStyle = "rgba(82, 57, 48, 0.18)";
        ctx.lineWidth = Math.max(2, width / 700);
        ctx.stroke();
        ctx.restore();
      });
    } else if (layer === "text") {
      drawTemplateDynamicText(
        ctx,
        width,
        height,
        templateId,
        participantNames
      );
    } else {
      artwork.drawForeground?.(ctx, width, height);
    }
  }, [templateId, width, height, participantCount, layer, participantNames]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}

"use client";

import { useEffect, useRef } from "react";
import {
  drawTemplateDynamicText,
  getTemplateArtwork,
  traceTemplatePhotoSlot,
} from "../../lib/templates/template-graphics";

export default function TemplateThumbnail({
  templateId,
  className = "",
}: {
  templateId: string;
  participantCount?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 720;
    const height = 900;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const artwork = getTemplateArtwork(templateId, width, height, 3);
    artwork.drawBackground?.(ctx, width, height);

    artwork.photoRects.slice(0, 3).forEach((slot) => {
      ctx.save();
      traceTemplatePhotoSlot(ctx, slot);
      ctx.fillStyle = "#fffaf2";
      ctx.fill();
      ctx.strokeStyle = "rgba(45, 35, 35, .16)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });

    artwork.drawForeground?.(ctx, width, height);
    drawTemplateDynamicText(ctx, width, height, templateId, ["YOU", "SOMEONE"]);
  }, [templateId]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label={templateId + " template preview"}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: "cover",
      }}
    />
  );
}

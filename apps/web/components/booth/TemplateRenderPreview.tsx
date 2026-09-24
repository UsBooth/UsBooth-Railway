"use client";

import { useEffect, useState } from "react";
import {
  renderFinalPhoto,
  type RenderOptions,
} from "../../lib/photo/renderer";
import {
  getTemplateStyle,
  type TemplateStyle,
} from "../../lib/templates/template-styles";

type Props = {
  captures: NonNullable<RenderOptions["captures"]>;
  options: Omit<RenderOptions, "captures">;
  style?: TemplateStyle;
  className?: string;
  alt?: string;
};

export default function TemplateRenderPreview({
  captures,
  options,
  style,
  className,
  alt = "Template preview",
}: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    if (!captures.length) {
      setSrc(null);
      return;
    }

    setBusy(true);

    void (async () => {
      try {
        const resolvedStyle =
          style ?? getTemplateStyle(options.selectedTemplate);
        const rendered = await renderFinalPhoto(
          {
            ...options,
            captures,
          },
          resolvedStyle
        );

        if (cancelled) return;

        objectUrl = URL.createObjectURL(rendered.blob);
        setSrc(objectUrl);
      } catch (error) {
        console.error("Template preview render failed:", error);
        if (!cancelled) setSrc(null);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [captures, options, style]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        minHeight: 220,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        borderRadius: 12,
        background: "#211918",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
          }}
        />
      ) : (
        <span
          style={{
            color: "#b9aa9b",
            fontSize: 9,
            letterSpacing: ".12em",
          }}
        >
          {busy ? "RENDERING YOUR TEMPLATE..." : "PREPARING PREVIEW..."}
        </span>
      )}
    </div>
  );
}

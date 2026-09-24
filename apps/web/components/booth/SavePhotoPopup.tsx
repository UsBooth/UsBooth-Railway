"use client";

import React from "react";
import { getTemplateName } from "../../lib/templates/templates";
import { getTemplateStyle } from "../../lib/templates/template-styles";
import { renderFinalPhoto, type RenderCapture } from "../../lib/photo/renderer";

export default function SavePhotoPopup({
  captures,
  preRenderedPhotoDataUrl,
  localCapture,
  remoteCapture,
  layout,
  filter,
  caption,
  captionText,
  captionFont,
  captionPosition,
  captionColor,
  polaroid,
  border,
  spacing,
  dateStamp,
  sticker,
  background,
  frame,
  selectedTemplate,
  participantNames,
  participantCount,
  sessionId,
  saving,
  setSaving,
  onClose,
}: {
  captures?: RenderCapture[];
  preRenderedPhotoDataUrl?: string;
  localCapture?: string;
  remoteCapture?: string;
  layout: "JOINED" | "STACKED" | "STRIP" | "GRID" | "FILM";
  filter: "NONE" | "WARM" | "SOFT" | "BW" | "VINTAGE" | "FADE" | "ROSE" | "DUSK" | "GOLD" | "MATTE";
  caption: boolean;
  captionText: string;
  captionFont: "SERIF" | "SCRIPT" | "SANS" | "MONO";
  captionPosition: "BOTTOM" | "TOP" | "OVERLAY";
  captionColor: "ROSE" | "CREAM" | "INK" | "WHITE";
  polaroid: boolean;
  border: "NONE" | "THIN" | "WIDE";
  spacing: "TIGHT" | "RELAXED";
  dateStamp: boolean;
  sticker: "NONE" | "HEART" | "SPARKLE" | "STAR" | "FLOWER";
  background: "CREAM" | "BLUSH" | "PAPER" | "DUSK";
  frame: "NONE" | "CREAM" | "ROSE" | "FILM" | "DARK" | "BLUSH" | "LACE" | "DOUBLE" | "POSTCARD";
  selectedTemplate: string;
  participantNames?: string[];
  participantCount?: number;
  sessionId: string | null;
  saving: boolean;
  setSaving: (value: boolean) => void;
  onClose: () => void;
}) {
  const [error, setError] = React.useState("");
  const [previewSrc, setPreviewSrc] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const resolvedCaptures = captures?.length
      ? captures
      : [localCapture, remoteCapture]
          .filter((value): value is string => Boolean(value))
          .map((dataUrl) => ({ dataUrl }));

    if (resolvedCaptures.length < 1) {
      setPreviewSrc(null);
      return;
    }

    void (async () => {
      try {
        const style = getTemplateStyle(selectedTemplate);
        const rendered = await renderFinalPhoto({
          captures: resolvedCaptures,
          layout,
          filter,
          caption,
          captionText,
          captionFont,
          captionPosition,
          captionColor,
          polaroid,
          border,
          spacing,
          dateStamp,
          sticker,
          background,
          frame,
          selectedTemplate,
          participantNames: participantNames?.length
            ? participantNames
            : resolvedCaptures.map((capture: RenderCapture, index): string =>
                typeof capture.name === "string" && capture.name.trim()
                  ? capture.name
                  : index === 0
                    ? "YOU"
                    : "CAMERA"
              ),
        }, style);

        if (cancelled) return;
        objectUrl = URL.createObjectURL(rendered.blob);
        setPreviewSrc(objectUrl);
      } catch (previewError) {
        console.error("Save popup preview render failed:", previewError);
        if (!cancelled) setPreviewSrc(null);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [
    captures,
    localCapture,
    remoteCapture,
    layout,
    filter,
    caption,
    captionText,
    captionFont,
    captionPosition,
    captionColor,
    polaroid,
    border,
    spacing,
    dateStamp,
    sticker,
    background,
    frame,
    selectedTemplate,
    participantNames,
  ]);

  async function savePhoto(saveToMemory = false) {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const style = getTemplateStyle(selectedTemplate);
      const resolvedCaptures = captures?.length
        ? captures
        : [localCapture, remoteCapture]
            .filter((value): value is string => Boolean(value))
            .map((dataUrl) => ({ dataUrl }));

      if (resolvedCaptures.length < 1) {
        throw new Error("A captured frame is required.");
      }

      // Always render from the current editor state. The old shared
      // pre-rendered image could become stale after the user changed a filter,
      // caption, frame or template in the review editor.
      const namesForRender: string[] = participantNames?.length
        ? participantNames
        : resolvedCaptures.map((capture: RenderCapture, index: number): string =>
            typeof capture.name === "string" && capture.name.trim().length > 0
              ? capture.name
              : index === 0
                ? "YOU"
                : "CAMERA"
          );

      const rendered = await renderFinalPhoto({
        captures: resolvedCaptures,
        localCapture,
        remoteCapture,
        layout,
        filter,
        caption,
        captionText,
        captionFont,
        captionPosition,
        captionColor,
        polaroid,
        border,
        spacing,
        dateStamp,
        sticker,
        background,
        frame,
        selectedTemplate,
        participantNames: namesForRender,
      }, style);

      const blob = rendered.blob;
      const width = rendered.width;
      const height = rendered.height;

      if (saveToMemory) {
        const inferredParticipantCount = Math.max(1, participantCount ?? 1);
        const memoryParticipantCount = inferredParticipantCount;

        const photoDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("Unable to prepare the memory photo."));
          reader.onerror = () => reject(new Error("Unable to prepare the memory photo."));
          reader.readAsDataURL(blob);
        });

        const response = await fetch("/api/memories", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photoDataUrl,
            width,
            height,
            sessionId,
            title: caption && captionText.trim() ? captionText.trim().slice(0, 120) : "You, Me & Every Moment",
            layout,
            template: selectedTemplate,
            privacy: "PRIVATE",
            metadata: {
              participantCount: memoryParticipantCount,
              filter,
              captionText,
              captionFont,
              captionPosition,
              captionColor,
              polaroid,
              border,
              spacing,
              dateStamp,
              sticker,
              background,
              template: selectedTemplate,
              templateName: getTemplateName(selectedTemplate),
            },
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result?.error || "Unable to save this memory. Please sign in first.");
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `usbooth-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      }
      onClose();
    } catch (error) {
      console.error("Unable to save photo:", error);
      setError(error instanceof Error ? error.message : "Unable to save this photo.");
    } finally {
      setSaving(false);
    }
  }

  const count = captures?.length ?? (localCapture ? 1 : 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(20, 12, 12, .72)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(10px, 2.5vw, 24px)",
        overflow: "auto",
        boxSizing: "border-box",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(520px, calc(100vw - 20px))",
          maxHeight: "calc(100dvh - 20px)",
          boxSizing: "border-box",
          overflowY: "auto",
          overscrollBehavior: "contain",
          background: "#fff8ef",
          borderRadius: "clamp(16px, 2vw, 22px)",
          padding: "clamp(16px, 3vw, 24px)",
          textAlign: "center",
          boxShadow: "0 25px 80px rgba(0,0,0,.35)",
        }}
      >
        <div style={{ fontSize: "9px", letterSpacing: ".18em", fontWeight: 800, color: "#9c6860" }}>✦ MOMENT READY ✦</div>
        <h3 style={{ margin: "9px 0 7px", fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: 400, color: "#4b3632" }}>Keep this one?</h3>
        <p style={{ margin: "0 auto 18px", color: "#806c64", fontSize: "12px", lineHeight: 1.6 }}>
          {count} camera{count === 1 ? "" : "s"} captured this moment.
          <br />
          <strong>{getTemplateName(selectedTemplate)}</strong>
        </p>

        {error && (
          <div role="alert" style={{ margin: "0 auto 14px", padding: "10px 12px", borderRadius: "10px", background: "#f3dddd", color: "#7e3f3f", fontSize: "11px", lineHeight: 1.5 }}>{error}</div>
        )}

        {previewSrc && (
          <div
            style={{
              width: "100%",
              maxHeight: "min(48dvh, 560px)",
              margin: "0 auto 18px",
              borderRadius: "14px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#eadccc",
              border: "1px solid #d7c1b1",
              boxShadow: "0 12px 30px rgba(80,45,35,.16)",
            }}
          >
            <img
              src={previewSrc}
              alt="Final UsBooth photo"
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                maxHeight: "min(48dvh, 560px)",
                objectFit: "contain",
              }}
            />
          </div>
        )}

        <button type="button" disabled={saving} onClick={() => savePhoto(true)} style={{ width: "100%", minHeight: "48px", border: 0, borderRadius: "999px", background: "#a9635e", color: "#fff8ef", cursor: saving ? "wait" : "pointer", fontWeight: 800, fontSize: "9px", letterSpacing: ".12em", opacity: saving ? .7 : 1 }}>
          {saving ? "SAVING..." : "SAVE TO MEMORIES ♡"}
        </button>

        <button type="button" disabled={saving} onClick={() => savePhoto(false)} style={{ width: "100%", minHeight: "44px", marginTop: "10px", border: "1px solid #d4bfae", borderRadius: "999px", background: "transparent", color: "#76534c", cursor: saving ? "wait" : "pointer", fontWeight: 800, fontSize: "9px", letterSpacing: ".11em", opacity: saving ? .65 : 1 }}>
          SAVE TO DEVICE ↙
        </button>

        <button type="button" onClick={onClose} style={{ marginTop: "10px", border: 0, background: "transparent", color: "#806c64", cursor: "pointer", fontSize: "9px", letterSpacing: ".1em" }}>
          NOT YET
        </button>
      </div>
    </div>
  );
}

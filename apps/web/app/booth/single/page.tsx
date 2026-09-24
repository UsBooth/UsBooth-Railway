"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { BOOTH_TEMPLATES } from "../../../lib/templates/templates";
import { getTemplateStyle } from "../../../lib/templates/template-styles";
import styles from "./single.module.css";

type Filter =
  | "NONE"
  | "WARM"
  | "SOFT"
  | "BW"
  | "VINTAGE"
  | "FADE"
  | "ROSE"
  | "DUSK"
  | "GOLD"
  | "MATTE";

type Frame =
  | "NONE"
  | "CREAM"
  | "ROSE"
  | "FILM"
  | "DARK"
  | "BLUSH"
  | "LACE"
  | "DOUBLE"
  | "POSTCARD";

type Layout =
  | "PORTRAIT"
  | "POLAROID"
  | "STRIP";

type FacingMode =
  | "user"
  | "environment";

const FILTERS: Filter[] = [
  "NONE",
  "SOFT",
  "WARM",
  "VINTAGE",
  "FADE",
  "ROSE",
  "DUSK",
  "GOLD",
  "MATTE",
  "BW",
];

const FRAMES: Frame[] = [
  "CREAM",
  "ROSE",
  "FILM",
  "DARK",
  "BLUSH",
  "LACE",
  "DOUBLE",
  "POSTCARD",
  "NONE",
];

const LAYOUTS: Layout[] = [
  "PORTRAIT",
  "POLAROID",
  "STRIP",
];

function filterCss(filter: Filter) {
  switch (filter) {
    case "WARM":
      return "sepia(.16) saturate(1.12) contrast(1.03)";

    case "SOFT":
      return "saturate(.88) contrast(.92) brightness(1.04)";

    case "BW":
      return "grayscale(1) contrast(1.05)";

    case "VINTAGE":
      return "sepia(.28) saturate(.8) contrast(.92)";

    case "FADE":
      return "saturate(.72) contrast(.86) brightness(1.08)";

    case "ROSE":
      return "sepia(.1) hue-rotate(-8deg) saturate(1.12)";

    case "DUSK":
      return "brightness(.78) saturate(.85) contrast(1.08)";

    case "GOLD":
      return "sepia(.22) saturate(1.2) brightness(1.02)";

    case "MATTE":
      return "contrast(.88) saturate(.82) brightness(1.03)";

    default:
      return "none";
  }
}

function frameStyle(frame: Frame) {
  switch (frame) {
    case "DOUBLE":
      return "5px double rgba(121,78,70,.72)";

    case "POSTCARD":
      return "12px solid #f5eadb";

    case "DARK":
      return "10px solid #292120";

    case "FILM":
      return "9px solid #171313";

    case "BLUSH":
      return "10px solid #dca9a6";

    case "LACE":
      return "7px solid #f3dfd3";

    case "ROSE":
      return "10px solid #c98986";

    case "CREAM":
      return "10px solid #ead9c5";

    default:
      return "0";
  }
}

/* =========================================================
   LAYOUT CONFIGURATION

   These values control BOTH:
   - the live preview
   - the generated/downloaded image

========================================================= */

function getLayoutConfig(layout: Layout) {
  switch (layout) {
    case "POLAROID":
      return {
        previewClass: styles.layoutPolaroid,
        padding: 42,
        bottomSpace: 150,
        aspectRatio: "4 / 5",
      };

    case "STRIP":
      return {
        previewClass: styles.layoutStrip,
        padding: 26,
        bottomSpace: 100,
        aspectRatio: "2 / 5",
      };

    case "PORTRAIT":
    default:
      return {
        previewClass: styles.layoutPortrait,
        padding: 42,
        bottomSpace: 70,
        aspectRatio: "4 / 5",
      };
  }
}

export default function SingleBoothPage() {
  /* =========================================================
     REFS
  ========================================================= */

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  /*
   * ONLY ONE preview video.
   */
  const previewVideoRef =
    useRef<HTMLVideoElement | null>(null);

  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const countdownRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    );

  const captureRunningRef =
    useRef(false);

  const facingRef =
    useRef<FacingMode>("user");

  /* =========================================================
     STATE
  ========================================================= */

  const [
    cameraReady,
    setCameraReady,
  ] = useState(false);

  const [
    cameraStarting,
    setCameraStarting,
  ] = useState(false);

  const [
    cameraEnabled,
    setCameraEnabled,
  ] = useState(false);

  const [
    countdown,
    setCountdown,
  ] = useState<number | null>(null);

  const [
    capturing,
    setCapturing,
  ] = useState(false);

  const [
    photo,
    setPhoto,
  ] = useState<string | null>(null);

  const [
    selectedTemplate,
    setSelectedTemplate,
  ] = useState("classic-strip");

  const [
    filter,
    setFilter,
  ] = useState<Filter>("NONE");

  const [
    frame,
    setFrame,
  ] = useState<Frame>("CREAM");

  const [
    layout,
    setLayout,
  ] = useState<Layout>("PORTRAIT");

  const [
    caption,
    setCaption,
  ] = useState(
    "A little moment ♡"
  );

  const [
    showCaption,
    setShowCaption,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    saved,
    setSaved,
  ] = useState(false);

  const [
    templateOpen,
    setTemplateOpen,
  ] = useState(false);

  const [
    facingMode,
    setFacingMode,
  ] = useState<FacingMode>("user");

  /* =========================================================
     TEMPLATE
  ========================================================= */

  const templateStyle = useMemo(
    () =>
      getTemplateStyle(
        selectedTemplate
      ),
    [selectedTemplate]
  );

  const templateName =
    BOOTH_TEMPLATES.find(
      ([id]) =>
        id === selectedTemplate
    )?.[1] ??
    "Classic Strip";

  /* =========================================================
     LAYOUT
  ========================================================= */

  const layoutConfig = useMemo(
    () =>
      getLayoutConfig(
        layout
      ),
    [layout]
  );

  /*
   * Front camera should appear mirrored.
   * Rear camera should remain natural.
   */
  const mirrorStyle = {
    transform:
      facingMode === "user"
        ? "scaleX(-1)"
        : "none",
  };

  /* =========================================================
     STOP CAMERA
  ========================================================= */

  const stopCamera = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(
        countdownRef.current
      );

      countdownRef.current =
        null;
    }

    streamRef.current
      ?.getTracks()
      .forEach((track) =>
        track.stop()
      );

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();

      videoRef.current.srcObject =
        null;
    }

    if (previewVideoRef.current) {
      previewVideoRef.current.pause();

      previewVideoRef.current.srcObject =
        null;
    }

    setCameraReady(false);
    setCameraEnabled(false);

    captureRunningRef.current =
      false;
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  /* =========================================================
     ATTACH PREVIEW STREAM
  ========================================================= */

  const attachPreviewStream =
    useCallback(() => {
      const video =
        previewVideoRef.current;

      const stream =
        streamRef.current;

      if (!video || !stream) {
        return;
      }

      if (
        video.srcObject !==
        stream
      ) {
        video.srcObject =
          stream;
      }

      video.muted = true;
      video.playsInline = true;

      void video
        .play()
        .catch(() => {});
    }, []);

  /*
   * When photo changes, React may mount the
   * live preview again.
   *
   * Reattach the existing camera stream.
   */
  useEffect(() => {
    if (!cameraReady) {
      return;
    }

    const frameId =
      window.requestAnimationFrame(
        () => {
          attachPreviewStream();
        }
      );

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, [
    cameraReady,
    photo,
    attachPreviewStream,
  ]);

  /* =========================================================
     START CAMERA
  ========================================================= */

  async function startCamera(
    force = false,
    requestedFacing: FacingMode =
      facingRef.current
  ) {
    if (
      cameraStarting ||
      (cameraReady && !force)
    ) {
      return;
    }

    setError("");
    setCameraStarting(true);

    try {
      if (
        !navigator.mediaDevices
          ?.getUserMedia
      ) {
        throw new Error(
          "Camera access is unavailable in this browser."
        );
      }

      if (
        force &&
        streamRef.current
      ) {
        streamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        streamRef.current =
          null;

        if (videoRef.current) {
          videoRef.current.pause();

          videoRef.current.srcObject =
            null;
        }

        if (
          previewVideoRef.current
        ) {
          previewVideoRef.current.pause();

          previewVideoRef.current.srcObject =
            null;
        }
      }

      let stream: MediaStream;

      try {
        stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode: {
                  exact:
                    requestedFacing,
                },
              },
              audio: false,
            }
          );
      } catch {
        try {
          stream =
            await navigator.mediaDevices.getUserMedia(
              {
                video: {
                  facingMode: {
                    ideal:
                      requestedFacing,
                  },
                },
                audio: false,
              }
            );
        } catch {
          stream =
            await navigator.mediaDevices.getUserMedia(
              {
                video: true,
                audio: false,
              }
            );
        }
      }

      streamRef.current =
        stream;

      if (videoRef.current) {
        videoRef.current.srcObject =
          stream;

        await videoRef.current.play();
      }

      attachPreviewStream();

      const track =
        stream.getVideoTracks()[0];

      const settings =
        track?.getSettings?.();

      let actualFacing =
        requestedFacing;

      if (
        settings?.facingMode ===
          "user" ||
        settings?.facingMode ===
          "environment"
      ) {
        actualFacing =
          settings.facingMode;
      }

      facingRef.current =
        actualFacing;

      setFacingMode(
        actualFacing
      );

      setCameraEnabled(true);
      setCameraReady(true);
    } catch (err) {
      console.error(
        "Camera start failed:",
        err
      );

      setCameraReady(false);
      setCameraEnabled(false);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to start your camera."
      );
    } finally {
      setCameraStarting(false);
    }
  }

  /* =========================================================
     FLIP CAMERA
  ========================================================= */

  async function flipCamera() {
    if (
      cameraStarting ||
      !cameraReady ||
      capturing
    ) {
      return;
    }

    const nextFacing: FacingMode =
      facingRef.current === "user"
        ? "environment"
        : "user";

    facingRef.current =
      nextFacing;

    setFacingMode(
      nextFacing
    );

    setError("");

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      streamRef.current =
        null;
    }

    if (videoRef.current) {
      videoRef.current.pause();

      videoRef.current.srcObject =
        null;
    }

    if (previewVideoRef.current) {
      previewVideoRef.current.pause();

      previewVideoRef.current.srcObject =
        null;
    }

    setCameraReady(false);

    await startCamera(
      true,
      nextFacing
    );
  }

  /* =========================================================
     CAMERA ON/OFF
  ========================================================= */

  function toggleCamera() {
    const track =
      streamRef.current
        ?.getVideoTracks()[0];

    if (!track) {
      return;
    }

    const nextEnabled =
      !track.enabled;

    track.enabled =
      nextEnabled;

    setCameraEnabled(
      nextEnabled
    );
  }

  /* =========================================================
     CAPTURE FRAME
  ========================================================= */

  function captureFrame(): string | null {
    const video =
      videoRef.current;

    const canvas =
      canvasRef.current;

    if (
      !video ||
      !canvas ||
      video.readyState <
        HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      return null;
    }

    const sourceWidth =
      video.videoWidth || 1280;

    const sourceHeight =
      video.videoHeight || 720;

    /*
     * The output is intentionally different
     * for every layout.
     */

    let outputWidth: number;
    let outputHeight: number;
    let imageWidth: number;
    let imageHeight: number;
    let imageX: number;
    let imageY: number;

    if (layout === "STRIP") {
      /*
       * Tall narrow photobooth strip.
       */
      outputWidth = 700;
      outputHeight = 1500;

      const padding = 38;

      imageWidth =
        outputWidth -
        padding * 2;

      imageHeight =
        Math.round(
          imageWidth *
            (sourceHeight /
              sourceWidth)
        );

      imageX = padding;
      imageY = 105;

      /*
       * Keep image inside the strip.
       */
      const maxImageHeight =
        outputHeight -
        260;

      if (
        imageHeight >
        maxImageHeight
      ) {
        imageHeight =
          maxImageHeight;

        imageWidth =
          Math.round(
            imageHeight *
              (sourceWidth /
                sourceHeight)
          );

        imageX =
          Math.round(
            (outputWidth -
              imageWidth) /
              2
          );
      }
    } else if (
      layout === "POLAROID"
    ) {
      /*
       * Classic Polaroid:
       * large image + large lower area.
       */
      outputWidth = 1100;
      outputHeight = 1350;

      const padding = 55;

      imageWidth =
        outputWidth -
        padding * 2;

      imageHeight =
        Math.round(
          imageWidth *
            (sourceHeight /
              sourceWidth)
        );

      const maxImageHeight =
        outputHeight -
        padding -
        250;

      if (
        imageHeight >
        maxImageHeight
      ) {
        imageHeight =
          maxImageHeight;

        imageWidth =
          Math.round(
            imageHeight *
              (sourceWidth /
                sourceHeight)
          );
      }

      imageX =
        Math.round(
          (outputWidth -
            imageWidth) /
            2
        );

      imageY =
        padding;
    } else {
      /*
       * PORTRAIT:
       * clean standard portrait card.
       */
      outputWidth = 1000;
      outputHeight = 1250;

      const padding = 50;

      imageWidth =
        outputWidth -
        padding * 2;

      imageHeight =
        Math.round(
          imageWidth *
            (sourceHeight /
              sourceWidth)
        );

      const maxImageHeight =
        outputHeight -
        padding -
        150;

      if (
        imageHeight >
        maxImageHeight
      ) {
        imageHeight =
          maxImageHeight;

        imageWidth =
          Math.round(
            imageHeight *
              (sourceWidth /
                sourceHeight)
          );
      }

      imageX =
        Math.round(
          (outputWidth -
            imageWidth) /
            2
        );

      imageY =
        padding;
    }

    canvas.width =
      outputWidth;

    canvas.height =
      outputHeight;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      return null;
    }

    /* =====================================================
       BACKGROUND
    ===================================================== */

    ctx.fillStyle =
      templateStyle.background;

    ctx.fillRect(
      0,
      0,
      outputWidth,
      outputHeight
    );

    /* =====================================================
       IMAGE
    ===================================================== */

    ctx.save();

    ctx.filter =
      filterCss(filter);

    if (
      facingRef.current ===
      "user"
    ) {
      /*
       * Mirror front camera.
       */
      ctx.translate(
        imageX +
          imageWidth,
        imageY
      );

      ctx.scale(
        -1,
        1
      );

      ctx.drawImage(
        video,
        0,
        0,
        imageWidth,
        imageHeight
      );
    } else {
      /*
       * Rear camera is NOT mirrored.
       */
      ctx.drawImage(
        video,
        imageX,
        imageY,
        imageWidth,
        imageHeight
      );
    }

    ctx.restore();

    /* =====================================================
       FRAME
    ===================================================== */

    if (frame !== "NONE") {
      ctx.save();

      const css =
        frameStyle(frame);

      const match =
        css.match(
          /(\d+)px/
        );

      const lineWidth =
        match
          ? Number(match[1])
          : 8;

      ctx.strokeStyle =
        frame === "DARK"
          ? "#292120"
          : frame === "FILM"
          ? "#171313"
          : templateStyle.border;

      ctx.lineWidth =
        lineWidth;

      ctx.strokeRect(
        lineWidth / 2,
        lineWidth / 2,
        outputWidth -
          lineWidth,
        outputHeight -
          lineWidth
      );

      ctx.restore();
    }

    /* =====================================================
       TOP LABEL
    ===================================================== */

    ctx.fillStyle =
      templateStyle.ink;

    ctx.font =
      layout === "STRIP"
        ? "700 22px Arial"
        : "700 28px Arial";

    ctx.textAlign =
      "left";

    ctx.fillText(
      templateStyle.top ||
        "USBOOTH",
      layout === "STRIP"
        ? 38
        : 50,
      layout === "STRIP"
        ? 55
        : 42
    );

    /* =====================================================
       MARK
    ===================================================== */

    ctx.fillStyle =
      templateStyle.accent;

    ctx.font =
      layout === "STRIP"
        ? "28px Georgia"
        : "34px Georgia";

    ctx.textAlign =
      "right";

    ctx.fillText(
      templateStyle.mark ||
        "♡",
      outputWidth -
        (layout === "STRIP"
          ? 38
          : 50),
      layout === "STRIP"
        ? 55
        : 45
    );

    /* =====================================================
       LAYOUT-SPECIFIC LOWER AREA
    ===================================================== */

    if (layout === "POLAROID") {
      /*
       * Large Polaroid caption.
       */
      if (
        showCaption &&
        caption.trim()
      ) {
        ctx.fillStyle =
          templateStyle.ink;

        ctx.font =
          "32px Georgia";

        ctx.textAlign =
          "center";

        ctx.fillText(
          caption
            .trim()
            .slice(0, 80),
          outputWidth / 2,
          outputHeight - 105
        );
      }

      ctx.fillStyle =
        templateStyle.ink;

      ctx.globalAlpha =
        0.65;

      ctx.font =
        "13px Arial";

      ctx.textAlign =
        "center";

      ctx.fillText(
        new Date().toLocaleDateString(
          undefined,
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        ),
        outputWidth / 2,
        outputHeight - 48
      );

      ctx.globalAlpha =
        1;
    } else if (
      layout === "STRIP"
    ) {
      /*
       * Tall strip footer.
       */
      if (
        showCaption &&
        caption.trim()
      ) {
        ctx.fillStyle =
          templateStyle.ink;

        ctx.font =
          "20px Georgia";

        ctx.textAlign =
          "center";

        ctx.fillText(
          caption
            .trim()
            .slice(0, 42),
          outputWidth / 2,
          outputHeight - 78
        );
      }

      ctx.fillStyle =
        templateStyle.ink;

      ctx.globalAlpha =
        0.65;

      ctx.font =
        "10px Arial";

      ctx.textAlign =
        "center";

      ctx.fillText(
        new Date().toLocaleDateString(
          undefined,
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        ),
        outputWidth / 2,
        outputHeight - 42
      );

      ctx.globalAlpha =
        1;
    } else {
      /*
       * PORTRAIT footer.
       */
      if (
        showCaption &&
        caption.trim()
      ) {
        ctx.fillStyle =
          templateStyle.ink;

        ctx.font =
          "28px Georgia";

        ctx.textAlign =
          "center";

        ctx.fillText(
          caption
            .trim()
            .slice(0, 70),
          outputWidth / 2,
          outputHeight - 65
        );
      }

      ctx.fillStyle =
        templateStyle.ink;

      ctx.globalAlpha =
        0.65;

      ctx.font =
        "12px Arial";

      ctx.textAlign =
        "right";

      ctx.fillText(
        new Date().toLocaleDateString(
          undefined,
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        ),
        outputWidth - 50,
        outputHeight - 28
      );

      ctx.globalAlpha =
        1;
    }

    return canvas.toDataURL(
      "image/jpeg",
      0.94
    );
  }

  /* =========================================================
     TAKE PHOTO
  ========================================================= */

  function takePhoto() {
    if (
      !cameraReady ||
      captureRunningRef.current ||
      !cameraEnabled
    ) {
      return;
    }

    captureRunningRef.current =
      true;

    setCapturing(true);
    setSaved(false);
    setPhoto(null);
    setError("");

    let remaining = 3;

    setCountdown(
      remaining
    );

    countdownRef.current =
      setInterval(() => {
        remaining -= 1;

        if (remaining > 0) {
          setCountdown(
            remaining
          );

          return;
        }

        if (
          countdownRef.current
        ) {
          clearInterval(
            countdownRef.current
          );

          countdownRef.current =
            null;
        }

        setCountdown(null);

        const result =
          captureFrame();

        if (!result) {
          setError(
            "The camera frame wasn't ready. Please try again."
          );
        } else {
          setPhoto(result);
        }

        setCapturing(false);

        captureRunningRef.current =
          false;
      }, 1000);
  }

  /* =========================================================
     RETAKE
  ========================================================= */

  function retakePhoto() {
    setPhoto(null);
    setSaved(false);
    setError("");

    const track =
      streamRef.current
        ?.getVideoTracks()[0];

    if (track) {
      track.enabled =
        true;

      setCameraEnabled(
        true
      );
    }

    window.requestAnimationFrame(
      () => {
        attachPreviewStream();
      }
    );
  }

  /* =========================================================
     DOWNLOAD
  ========================================================= */

  async function downloadPhoto() {
    if (!photo) {
      return;
    }

    setError("");

    try {
      const response =
        await fetch(photo);

      if (!response.ok) {
        throw new Error(
          "Unable to prepare the photo."
        );
      }

      const blob =
        await response.blob();

      const objectUrl =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        objectUrl;

      link.download =
        `usbooth-solo-${layout.toLowerCase()}-${Date.now()}.jpg`;

      link.rel =
        "noopener";

      link.style.display =
        "none";

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(
          objectUrl
        );
      }, 1500);
    } catch (err) {
      console.error(
        "Download failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to download the photo."
      );
    }
  }

  /* =========================================================
     SAVE TO MEMORIES
  ========================================================= */

  async function saveToMemories() {
    if (
      !photo ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/memories",
          {
            method: "POST",
            credentials:
              "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              photoDataUrl:
                photo,

              title:
                caption.trim() ||
                "A little solo moment",

              layout,

              template:
                selectedTemplate,

              privacy:
                "PRIVATE",

              metadata: {
                mode: "SOLO",

                filter,

                captionText:
                  caption,

                template:
                  selectedTemplate,

                templateName:
                  templateName,
              },
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to save this memory."
        );
      }

      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save this memory."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     NEXT LAYOUT
  ========================================================= */

  function cycleLayout() {
    const currentIndex =
      LAYOUTS.indexOf(
        layout
      );

    const nextIndex =
      (currentIndex + 1) %
      LAYOUTS.length;

    /*
     * If a previous captured photo exists,
     * remove it so the new layout can be
     * previewed live immediately.
     */
    if (photo) {
      setPhoto(null);
      setSaved(false);
    }

    setLayout(
      LAYOUTS[nextIndex]
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main
      className={styles.page}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header
        className={styles.header}
      >
        <Link
          href="/"
          className={styles.logo}
        >
          USBOOTH
          <span>♥</span>
        </Link>

        <div
          className={
            styles.modeBadge
          }
        >
          📸 SOLO BOOTH
        </div>

        <Link
          href="/account"
          className={styles.exit}
        >
          EXIT
        </Link>
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        className={styles.hero}
      >
        <div
          className={
            styles.eyebrow
          }
        >
          ✦ &nbsp; ONE CAMERA &nbsp; ✦
        </div>

        <h1>
          Make a little
          <br />
          <em>
            moment of your own.
          </em>
        </h1>

        <p>
          No second phone. No room
          code. Just your camera, a
          timer and the UsBooth
          feeling.
        </p>
      </section>

      {/* =====================================================
          CAMERA
      ===================================================== */}

      <section
        className={styles.studio}
      >
        <div
          className={
            styles.cameraCard
          }
        >
          <div
            className={
              styles.cameraHeader
            }
          >
            <span>
              ♡ &nbsp; YOUR CAMERA
            </span>

            <span
              className={
                cameraReady
                  ? styles.live
                  : ""
              }
            >
              ●{" "}
              {cameraReady
                ? "LIVE"
                : "OFF"}
            </span>
          </div>

          <div
            className={
              styles.cameraFeed
            }
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={
                cameraReady
                  ? styles.video
                  : styles.hidden
              }
              style={{
                transform:
                  facingMode ===
                  "user"
                    ? "scaleX(-1)"
                    : "none",
              }}
            />

            {!cameraReady && (
              <div
                className={
                  styles.placeholder
                }
              >
                <span>
                  ♡
                </span>

                <strong>
                  YOUR CAMERA
                </strong>

                <small>
                  {cameraStarting
                    ? "Starting camera..."
                    : "Your camera will appear here"}
                </small>
              </div>
            )}

            {countdown !== null && (
              <div
                className={
                  styles.countdown
                }
              >
                {countdown}
              </div>
            )}
          </div>
        </div>

        {/* CAMERA CONTROLS */}

        <div
          className={
            styles.controls
          }
        >
          {!cameraReady ? (
            <button
              type="button"
              className={
                styles.primary
              }
              onClick={() =>
                startCamera()
              }
              disabled={
                cameraStarting
              }
            >
              {cameraStarting
                ? "STARTING CAMERA..."
                : "♡ TURN ON CAMERA"}
            </button>
          ) : (
            <>
              <button
                type="button"
                className={
                  styles.secondary
                }
                onClick={
                  flipCamera
                }
                disabled={
                  cameraStarting ||
                  capturing
                }
              >
                🔄 FLIP
              </button>

              <button
                type="button"
                className={
                  styles.secondary
                }
                onClick={
                  toggleCamera
                }
              >
                {cameraEnabled
                  ? "📷 CAMERA ON"
                  : "📷 CAMERA OFF"}
              </button>

              <button
                type="button"
                className={
                  styles.shutter
                }
                onClick={
                  takePhoto
                }
                disabled={
                  capturing ||
                  !cameraEnabled
                }
                aria-label="Take photo"
              >
                <span />
              </button>
            </>
          )}

          <small>
            {capturing
              ? "CAPTURING..."
              : photo
              ? "PHOTO READY ♡"
              : cameraReady
              ? "CLICK THE SHUTTER ♡"
              : "START YOUR CAMERA TO BEGIN"}
          </small>
        </div>
      </section>

      {/* CANVAS */}

      <canvas
        ref={canvasRef}
        className={
          styles.hiddenCanvas
        }
      />

      {/* ERROR */}

      {error && (
        <div
          className={styles.error}
        >
          {error}
        </div>
      )}

      {/* =====================================================
          PREVIEW / EDITOR
      ===================================================== */}

      <section
        className={
          styles.previewSection
        }
      >
        <div
          className={
            styles.sectionHead
          }
        >
          <div>
            <span>
              ✦ &nbsp; LIVE STYLE &nbsp; ✦
            </span>

            <h2>
              Make it feel{" "}
              <em>
                like yours.
              </em>
            </h2>
          </div>

          <p>
            Templates and styling
            update your live preview
            and finished photo.
          </p>
        </div>

        {/* ===================================================
            LIVE / FINISHED PREVIEW
        =================================================== */}

        <div
          className={
            styles.previewWrap
          }
        >
          {photo ? (
            <img
              src={photo}
              alt="Captured UsBooth solo photo"
              className={
                `${styles.finalPhoto} ${layoutConfig.previewClass}`
              }
            />
          ) : (
            <div
              className={
                `${styles.livePreview} ${layoutConfig.previewClass}`
              }
              style={{
                background:
                  templateStyle.background,

                border:
                  frameStyle(frame),

                aspectRatio:
                  layoutConfig.aspectRatio,
              }}
            >
              {/* TOP */}

              <div
                className={
                  styles.previewTop
                }
                style={{
                  color:
                    templateStyle.ink,
                }}
              >
                <strong>
                  {
                    templateStyle.top
                  }
                </strong>

                <span
                  style={{
                    color:
                      templateStyle.accent,
                  }}
                >
                  {
                    templateStyle.mark
                  }
                </span>
              </div>

              {/* CAMERA */}

              <div
                className={
                  styles.previewImageArea
                }
              >
                <video
                  ref={
                    previewVideoRef
                  }
                  autoPlay
                  playsInline
                  muted
                  className={
                    styles.previewVideo
                  }
                  style={{
                    filter:
                      filterCss(
                        filter
                      ),

                    transform:
                      facingMode ===
                      "user"
                        ? "scaleX(-1)"
                        : "none",
                  }}
                />
              </div>

              {/* BOTTOM */}

              <div
                className={
                  styles.previewBottom
                }
                style={{
                  color:
                    templateStyle.ink,
                }}
              >
                {showCaption
                  ? caption ||
                    "A little moment ♡"
                  : templateStyle.bottom}
              </div>

              {/* LAYOUT INDICATOR */}

              <span
                style={{
                  position:
                    "absolute",
                  bottom:
                    layout ===
                    "STRIP"
                      ? "34px"
                      : "12px",
                  left:
                    "50%",
                  transform:
                    "translateX(-50%)",
                  fontSize:
                    layout ===
                    "STRIP"
                      ? "8px"
                      : "9px",
                  letterSpacing:
                    ".16em",
                  opacity:
                    0.45,
                  color:
                    templateStyle.ink,
                  pointerEvents:
                    "none",
                }}
              >
                {layout}
              </span>
            </div>
          )}
        </div>

        {/* ===================================================
            STYLE CONTROLS
        =================================================== */}

        <div
          className={
            styles.styleGrid
          }
        >
          {/* TEMPLATE */}

          <button
            type="button"
            className={
              styles.styleButton
            }
            onClick={() =>
              setTemplateOpen(
                true
              )
            }
          >
            <span>
              TEMPLATE
            </span>

            <strong>
              {templateName}
            </strong>
          </button>

          {/* FILTER */}

          <button
            type="button"
            className={
              styles.styleButton
            }
            onClick={() =>
              setFilter(
                FILTERS[
                  (FILTERS.indexOf(
                    filter
                  ) +
                    1) %
                    FILTERS.length
                ]
              )
            }
          >
            <span>
              FILTER
            </span>

            <strong>
              {filter}
            </strong>
          </button>

          {/* FRAME */}

          <button
            type="button"
            className={
              styles.styleButton
            }
            onClick={() =>
              setFrame(
                FRAMES[
                  (FRAMES.indexOf(
                    frame
                  ) +
                    1) %
                    FRAMES.length
                ]
              )
            }
          >
            <span>
              FRAME
            </span>

            <strong>
              {frame}
            </strong>
          </button>

          {/* LAYOUT */}

          <button
            type="button"
            className={
              styles.styleButton
            }
            onClick={
              cycleLayout
            }
          >
            <span>
              LAYOUT
            </span>

            <strong>
              {layout}
            </strong>
          </button>

          {/* CAPTION */}

          <button
            type="button"
            className={
              styles.styleButton
            }
            onClick={() =>
              setShowCaption(
                (value) =>
                  !value
              )
            }
          >
            <span>
              CAPTION
            </span>

            <strong>
              {showCaption
                ? "ON"
                : "OFF"}
            </strong>
          </button>

          {/* CAPTION INPUT */}

          <input
            className={
              styles.captionInput
            }
            value={caption}
            maxLength={80}
            onChange={(event) =>
              setCaption(
                event.target.value
              )
            }
            placeholder="Write a caption..."
          />
        </div>

        {/* ===================================================
            LAYOUT DESCRIPTION
        =================================================== */}

        <div
          style={{
            margin:
              "18px auto 0",
            textAlign:
              "center",
            opacity:
              0.65,
            fontSize:
              "0.8rem",
            letterSpacing:
              ".04em",
          }}
        >
          {layout ===
            "PORTRAIT" &&
            "Clean portrait · balanced frame"}

          {layout ===
            "POLAROID" &&
            "Polaroid · wide lower caption area"}

          {layout ===
            "STRIP" &&
            "Photobooth strip · tall and narrow"}
        </div>

        {/* ===================================================
            PHOTO ACTIONS
        =================================================== */}

        {photo && (
          <div
            className={
              styles.resultActions
            }
          >
            <button
              type="button"
              className={
                styles.secondary
              }
              onClick={
                retakePhoto
              }
            >
              ↺ RETAKE
            </button>

            <button
              type="button"
              onClick={
                downloadPhoto
              }
              style={{
                minHeight:
                  "52px",

                padding:
                  "0 25px",

                border:
                  "1px solid rgba(255,255,255,.25)",

                borderRadius:
                  "999px",

                background:
                  "#fff",

                color:
                  "#171313",

                fontFamily:
                  "inherit",

                fontWeight:
                  900,

                fontSize:
                  "inherit",

                letterSpacing:
                  ".04em",

                cursor:
                  "pointer",

                boxShadow:
                  "0 10px 28px rgba(0,0,0,.14)",
              }}
            >
              ↓ DOWNLOAD PHOTO
            </button>

            <button
              type="button"
              className={
                styles.primary
              }
              onClick={
                saveToMemories
              }
              disabled={
                saving ||
                saved
              }
            >
              {saved
                ? "✓ SAVED TO MEMORIES"
                : saving
                ? "SAVING..."
                : "♡ SAVE TO MEMORIES"}
            </button>
          </div>
        )}
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <section
        className={
          styles.footerNote
        }
      >
        <span>
          USBOOTH · SOLO
        </span>

        <p>
          One camera, the same
          little ritual. Your
          shared booth remains
          available whenever you
          want to bring someone
          in.
        </p>

        <Link href="/account">
          Back to your booths →
        </Link>
      </section>

      {/* =====================================================
          TEMPLATE MODAL
      ===================================================== */}

      {templateOpen && (
        <div
          className={
            styles.modalBackdrop
          }
          onClick={() =>
            setTemplateOpen(
              false
            )
          }
        >
          <div
            className={
              styles.templateModal
            }
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              className={
                styles.modalHead
              }
            >
              <div>
                <span>
                  ✦ PHOTO TEMPLATE
                </span>

                <h2>
                  Choose your look.
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setTemplateOpen(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <div
              className={
                styles.templateGrid
              }
            >
              {BOOTH_TEMPLATES.map(
                ([
                  id,
                  name,
                  tag,
                ]) => {
                  const style =
                    getTemplateStyle(
                      id
                    );

                  const selected =
                    selectedTemplate ===
                    id;

                  return (
                    <button
                      type="button"
                      key={id}
                      className={`${styles.templateChoice} ${
                        selected
                          ? styles.selected
                          : ""
                      }`}
                      style={{
                        borderColor:
                          selected
                            ? style.accent
                            : style.border,

                        background:
                          `linear-gradient(145deg, ${style.background}, #17100f)`,
                      }}
                      onClick={() => {
                        setSelectedTemplate(
                          id
                        );

                        setTemplateOpen(
                          false
                        );
                      }}
                    >
                      <span
                        style={{
                          background:
                            style.accent,

                          color:
                            style.background,
                        }}
                      >
                        {selected
                          ? "✓"
                          : style.mark}
                      </span>

                      <strong>
                        {name}
                      </strong>

                      <small>
                        {tag}
                      </small>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import "./booth.css";
import { BOOTH_TEMPLATES, getTemplateName, getTemplatePreset, getTemplateRequiredPlan } from "../../../lib/templates/templates";
import { getTemplateStyle } from "../../../lib/templates/template-styles";
import TemplateArtworkLayer from "../../../components/booth/TemplateArtworkLayer";
import { getTemplatePhotoSlots, getTemplatePhotoSlotCount } from "../../../lib/templates/template-graphics";
import SavePhotoPopup from "../../../components/booth/SavePhotoPopup";
import TemplateRenderPreview from "../../../components/booth/TemplateRenderPreview";
import TemplateThumbnail from "../../../components/booth/TemplateThumbnail";
import { EditorOption, EditorSelect } from "../../../components/booth/EditorControls";
import { CAPTURE_CHANNEL, FRAME_CHUNK_SIZE, dataUrlToBytes, bytesToDataUrl } from "../../../lib/booth/capture-protocol";
import { canAccessRequiredPlan } from "../../../lib/plans";
import FaceEffectsOverlay from "../../../components/booth/FaceEffectsOverlay";
import { FACE_EFFECTS, getFaceEffectRequiredPlan, type FaceEffectId } from "../../../lib/face-effects";
import { drawFaceEffect, type FaceLandmark } from "../../../lib/face-effects-renderer";
import { renderFinalPhoto } from "../../../lib/photo/renderer";

type SignalType =
  | "offer"
  | "answer"
  | "candidate"
  | "capture";

type Signal = {
  id: string;
  type: SignalType;
  payload: Record<string, unknown>;
  createdAt: string;
};

type TurnResponse = {
  iceServers?: RTCIceServer[];
};

type BoothType = "SOLO" | "COUPLE" | "RANDOM";

type BoothParticipant = {
  id: string;
  guestName?: string | null;
  displayName?: string | null;
};

type SessionResponse = {
  initiatorId?: string | null;
  booth?: {
    id: string;
    name: string;
    roomCode: string;
    type: string;
  };
  session?: {
    id: string;
    status: string;
  };
  template?: string | null;
  participant?: {
    id: string;
    sessionId: string;
    status: string;
    guestName?: string | null;
  };
  activeParticipants?: BoothParticipant[];
  plan?: {
    participantLimit?: number | null;
    unlimited?: boolean;
    participantPlan?: "FREE" | "PLUS" | "PRO";
    participantUnlimited?: boolean;
    participantLevel?: number;
    featureAccess?: {
      coreTemplates?: boolean;
      plusTemplates?: boolean;
      proTemplates?: boolean;
      plusCustomization?: boolean;
      advancedCustomization?: boolean;
    };
  };
  error?: string;
};

type PeerState = {
  peer: RTCPeerConnection;
  channel: RTCDataChannel | null;
  remoteId: string;
};

type CaptureFrame = {
  participantId: string;
  name: string;
  dataUrl: string;
};

const POLL_INTERVAL = 1200;
const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 720;
const VIDEO_FRAME_RATE = 24;
const VIDEO_MAX_BITRATE = 850_000;
const VIDEO_MIN_BITRATE = 220_000;
const VIDEO_MAX_FRAMERATE = 24;
const QUALITY_SAMPLE_INTERVAL = 3000;
const COUNTDOWN_SECONDS = 3;
const CAPTURE_FINALIZE_TIMEOUT = 9000;

type PlanId = "FREE" | "PLUS" | "PRO";

/* =========================================================
   PAGE
   ========================================================= */

export default function BoothPage() {
  const params = useParams();

  const boothId =
    typeof params?.boothId === "string"
      ? params.boothId
      : "";

  /* =======================================================
     VIDEO REFS
     ======================================================= */

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const remoteVideoRefCallbacks = useRef<Map<string, (element: HTMLVideoElement | null) => void>>(new Map());
  const localPreviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const remotePreviewVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  /* =======================================================
     CANVAS REFS
     ======================================================= */

  const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceLandmarksRef = useRef<FaceLandmark[]>([]);
  const captureCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

  /* =======================================================
     MEDIA / WEBRTC REFS
     ======================================================= */

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerState>>(new Map());
  const peerCreationPromisesRef = useRef<Map<string, Promise<RTCPeerConnection | null>>>(new Map());
  const iceServersRef = useRef<RTCIceServer[] | null>(null);
  const iceServersPromiseRef = useRef<Promise<RTCIceServer[]> | null>(null);

  const currentCaptureIdRef = useRef<string | null>(null);
  const captureExpectedParticipantsRef = useRef<Map<string, string[]>>(new Map());
  const captureFramesRef = useRef<Map<string, Map<string, CaptureFrame>>>(new Map());
  const openedCaptureIdsRef = useRef<Set<string>>(new Set());
  const frameAssemblyRef = useRef<Map<string, {
    mimeType: string;
    size: number;
    chunks: Uint8Array[];
    received: number;
  }>>(new Map());
  const finalPhotoAssemblyRef = useRef<Map<string, {
    mimeType: string;
    size: number;
    chunks: Uint8Array[];
    received: number;
  }>>(new Map());
  const finalPhotoBroadcastedRef = useRef<Set<string>>(new Set());

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSignalTimeRef = useRef<string | null>(null);
  const processingSignalsRef = useRef(false);
  const processedSignalIdsRef = useRef<Set<string>>(new Set());
  const startedRef = useRef(false);
  const participantIdRef = useRef<string | null>(null);
  const initiatorIdRef = useRef<string | null>(null);
  const makingOfferRef = useRef<Set<string>>(new Set());
  const pendingIceCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const remoteDescriptionReadyRef = useRef<Set<string>>(new Set());

  const captureRunningRef = useRef(false);
  const processedCaptureIdsRef = useRef<Set<string>>(new Set());
  const soloShotsRef = useRef<CaptureFrame[]>([]);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureFinalizeTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const reconnectTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const qualitySampleRef = useRef<Map<string, { timestamp: number; bytesSent: number; packetsLost: number; packetsSent: number }>>(new Map());
  const captureTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const cameraFacingRef = useRef<"user" | "environment">("user");

  /* =======================================================
     STATE
     ======================================================= */

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("WAITING FOR MORE CAMERAS");
  const [error, setError] = useState("");
  const [roomReady, setRoomReady] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState("");
  const [localCapture, setLocalCapture] = useState<string | null>(null);
  const [remoteCapture, setRemoteCapture] = useState<string | null>(null);
  const [captures, setCaptures] = useState<CaptureFrame[]>([]);
  const [captureReady, setCaptureReady] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [activeParticipants, setActiveParticipants] = useState<BoothParticipant[]>([]);
  const [participantLimit, setParticipantLimit] = useState<number | null>(2);
  const [boothType, setBoothType] = useState<BoothType>("COUPLE");

  // The booth owner's plan controls room capacity.
  // The current participant's own plan controls their features.
  const [participantPlan, setParticipantPlan] = useState<PlanId>("FREE");
  const [participantUnlimited, setParticipantUnlimited] = useState(false);
  const [participantLevel, setParticipantLevel] = useState(1);

  const [editorLayout, setEditorLayout] = useState<"JOINED" | "STACKED" | "STRIP" | "GRID" | "FILM">("JOINED");
  const [editorFrame, setEditorFrame] = useState<"NONE" | "CREAM" | "ROSE" | "FILM" | "DARK" | "BLUSH" | "LACE" | "DOUBLE" | "POSTCARD">("CREAM");
  const [editorFilter, setEditorFilter] = useState<"NONE" | "WARM" | "SOFT" | "BW" | "VINTAGE" | "FADE" | "ROSE" | "DUSK" | "GOLD" | "MATTE">("NONE");
  const [editorCaption, setEditorCaption] = useState(true);
  const [captionText, setCaptionText] = useState("You, Me & Every Moment ♡");
  const [captionFont, setCaptionFont] = useState<"SERIF" | "SCRIPT" | "SANS" | "MONO">("SERIF");
  const [captionPosition, setCaptionPosition] = useState<"BOTTOM" | "TOP" | "OVERLAY">("BOTTOM");
  const [captionColor, setCaptionColor] = useState<"ROSE" | "CREAM" | "INK" | "WHITE">("ROSE");
  const [editorPolaroid, setEditorPolaroid] = useState(false);
  const [editorBorder, setEditorBorder] = useState<"NONE" | "THIN" | "WIDE">("THIN");
  const [editorSpacing, setEditorSpacing] = useState<"TIGHT" | "RELAXED">("TIGHT");
  const [editorDateStamp, setEditorDateStamp] = useState(false);
  const [editorSticker, setEditorSticker] = useState<"NONE" | "HEART" | "SPARKLE" | "STAR" | "FLOWER">("NONE");
  const [editorBackground, setEditorBackground] = useState<"CREAM" | "BLUSH" | "PAPER" | "DUSK">("CREAM");
  const [selectedTemplate, setSelectedTemplate] = useState("classic-love-collage");
  const [localFaceEffect, setLocalFaceEffect] = useState<FaceEffectId>("none");
  const [faceEffectPickerOpen, setFaceEffectPickerOpen] = useState(false);
  const [sharedFinalPhoto, setSharedFinalPhoto] = useState<string | null>(null);

  // Applying a template also applies its intended visual preset.
  useEffect(() => {
    const preset = getTemplatePreset(selectedTemplate);
    setEditorLayout(preset.layout);
    setEditorFrame(preset.frame);
    setEditorFilter(preset.filter);
    setEditorBackground(preset.background);
    setEditorPolaroid(preset.polaroid);
    setEditorSpacing(preset.spacing);
    setCaptionPosition(preset.captionPosition);
  }, [selectedTemplate]);

  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const canUsePlusFeatures =
    participantUnlimited || participantLevel >= 2;

  const canUseProFeatures =
    participantUnlimited || participantLevel >= 3;

  const templatePeopleCount =
    boothType === "SOLO"
      ? 1
      : boothType === "COUPLE"
        ? 2
        : Math.min(5, Math.max(2, participantLimit ?? 2));

  const canUseTemplate = useCallback(
    (templateId: string) =>
      canAccessRequiredPlan(
        participantPlan,
        getTemplateRequiredPlan(templateId),
        undefined,
        participantUnlimited
      ),
    [participantPlan, participantUnlimited]
  );

  const canUseFaceEffect = useCallback(
    (effectId: string) =>
      canAccessRequiredPlan(
        participantPlan,
        getFaceEffectRequiredPlan(effectId),
        participantUnlimited ? "full-access@usbooth" : undefined
      ),
    [participantPlan, participantUnlimited]
  );

  const localFaceEffectName =
    FACE_EFFECTS.find((effect) => effect.id === localFaceEffect)?.name ?? "None";

  const participantPlanLabel =
    participantUnlimited
      ? "FULL ACCESS"
      : participantPlan === "PRO"
        ? "PRO"
        : participantPlan === "PLUS"
          ? "PLUS"
          : "FREE";

  const participantName = useCallback((participant: BoothParticipant) => {
    if (participant.guestName?.trim()) return participant.guestName.trim();
    if (participant.displayName?.trim()) return participant.displayName.trim();
    if (participant.id === participantIdRef.current) return "YOU";
    return "CAMERA";
  }, []);

  const setRemoteVideoElement = useCallback((participantId: string, element: HTMLVideoElement | null) => {
    if (element) {
      remoteVideoRefs.current.set(participantId, element);
      const stream = remoteStreamsRef.current.get(participantId);
      element.muted = false;
      element.volume = 1;
      if (stream && stream.getVideoTracks().some((track) => track.readyState === "live")) {
        if (element.srcObject !== stream) element.srcObject = stream;
        void element.play().catch(() => {});
      }
    } else {
      remoteVideoRefs.current.delete(participantId);
    }
  }, []);

  const getRemoteVideoRef = useCallback((participantId: string) => {
    const existing = remoteVideoRefCallbacks.current.get(participantId);
    if (existing) return existing;
    const callback = (element: HTMLVideoElement | null) => setRemoteVideoElement(participantId, element);
    remoteVideoRefCallbacks.current.set(participantId, callback);
    return callback;
  }, [setRemoteVideoElement]);

  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const participantSignatureRef = useRef("");

  const updateParticipantState = useCallback((participants: BoothParticipant[]) => {
    const unique = new Map<string, BoothParticipant>();
    for (const participant of participants) {
      if (participant.id) unique.set(participant.id, participant);
    }
    const me = participantIdRef.current;
    if (me && !unique.has(me)) {
      unique.set(me, { id: me });
    }
    const ordered = Array.from(unique.values());
    const signature = ordered
      .map((item) => `${item.id}|${item.displayName ?? ""}|${item.guestName ?? ""}`)
      .join(";");
    if (signature !== participantSignatureRef.current) {
      participantSignatureRef.current = signature;
      setActiveParticipants(ordered);
    }
    const remoteCount = ordered.filter((item) => item.id !== me).length;
    const connectedCount = Array.from(peerConnectionsRef.current.values())
      .filter((item) => item.peer.connectionState === "connected").length;
    setRemoteConnected(remoteCount > 0 && connectedCount > 0);
    setConnectionStatus(
      boothType === "SOLO"
        ? "SOLO CAMERA READY ♡"
        : remoteCount === 0
          ? "WAITING FOR MORE CAMERAS"
          : connectedCount > 0
          ? `${connectedCount + 1} CAMERA${connectedCount + 1 === 1 ? "" : "S"} CONNECTED ♡`
          : `${remoteCount + 1} CAMERAS IN ROOM`
    );
  }, [boothType]);

  /* =======================================================
     SEND SIGNAL
     ======================================================= */

  const sendSignal = useCallback(async (type: SignalType, payload: Record<string, unknown>) => {
    if (!boothId) return false;
    try {
      const response = await fetch(`/api/booths/${boothId}/signal`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        console.error("Signal failed:", data);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Signal request failed:", err);
      return false;
    }
  }, [boothId]);

  const getIceServers = useCallback(async (): Promise<RTCIceServer[]> => {
    if (iceServersRef.current) return iceServersRef.current;
    if (iceServersPromiseRef.current) return iceServersPromiseRef.current;

    const promise = (async () => {
      try {
        const response = await fetch("/api/turn", { credentials: "include", cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load TURN configuration.");
        const data: TurnResponse = await response.json();
        if (!Array.isArray(data.iceServers)) throw new Error("TURN server configuration is invalid.");
        iceServersRef.current = data.iceServers;
        return data.iceServers;
      } catch (err) {
        console.error("TURN configuration error:", err);
        const fallback = [{ urls: "stun:stun.cloudflare.com:3478" }];
        iceServersRef.current = fallback;
        return fallback;
      } finally {
        iceServersPromiseRef.current = null;
      }
    })();

    iceServersPromiseRef.current = promise;
    return promise;
  }, []);

  const sendFinalPhotoToAllPeers = useCallback(async (captureId: string, dataUrl: string) => {
    const { mimeType, bytes } = dataUrlToBytes(dataUrl);
    const peers = Array.from(peerConnectionsRef.current.entries());
    await Promise.all(peers.map(async ([remoteId, state]) => {
      const channel = state.channel;
      if (!channel || channel.readyState !== "open") return;
      channel.send(JSON.stringify({ type: "final-photo-start", captureId, mimeType, size: bytes.byteLength }));
      for (let offset = 0; offset < bytes.byteLength; offset += FRAME_CHUNK_SIZE) {
        while (channel.bufferedAmount > FRAME_CHUNK_SIZE * 8) {
          await new Promise((resolve) => setTimeout(resolve, 8));
        }
        channel.send(bytes.slice(offset, Math.min(offset + FRAME_CHUNK_SIZE, bytes.byteLength)));
      }
      channel.send(JSON.stringify({ type: "final-photo-end", captureId }));
      void remoteId;
    }));
  }, []);

  const tryFinalizeCapture = useCallback((captureId: string, allowPartial = false) => {
    if (openedCaptureIdsRef.current.has(captureId)) return;
    const frames = captureFramesRef.current.get(captureId);
    if (!frames) return;
    const expectedIds = captureExpectedParticipantsRef.current.get(captureId) ?? [];
    const available = expectedIds
      .map((id) => frames.get(id))
      .filter((item): item is CaptureFrame => Boolean(item));

    if (available.length < (boothType === "SOLO" ? 1 : 2)) return;
    if (!allowPartial && available.length < expectedIds.length) return;

    openedCaptureIdsRef.current.add(captureId);

    // SOLO is a real single-camera photobooth. Each shutter press fills
    // the next photo hole in the selected template instead of waiting for
    // another camera. The final renderer opens only after all solo shots
    // required by the template have been captured.
    if (boothType === "SOLO") {
      const shot = available[0];
      if (!shot) return;
      const nextShots = [...soloShotsRef.current, shot];
      soloShotsRef.current = nextShots;
      setCaptures(nextShots);
      setLocalCapture(shot.dataUrl);
      setRemoteCapture(null);
      setCapturing(false);
      setCountdown(null);
      captureRunningRef.current = false;

      const targetShots = Math.max(1, getTemplatePhotoSlotCount(selectedTemplate));
      if (nextShots.length < targetShots) {
        setCaptureStatus(
          `SHOT ${nextShots.length} OF ${targetShots} · CLICK THE SHUTTER FOR THE NEXT ONE ♡`
        );
        return;
      }
    }

    const ordered = boothType === "SOLO" ? soloShotsRef.current : available;
    setCaptures(ordered);
    setLocalCapture(ordered.find((item) => item.participantId === participantIdRef.current)?.dataUrl ?? ordered[0]?.dataUrl ?? null);
    setRemoteCapture(ordered.find((item) => item.participantId !== participantIdRef.current)?.dataUrl ?? null);
    setCaptureStatus(boothType === "SOLO" ? `${ordered.length} SHOTS READY · MOMENT COMPLETE ♡` : `${ordered.length} FRAMES CAPTURED TOGETHER ♡`);
    setCapturing(false);
    setCountdown(null);
    captureRunningRef.current = false;

    // Only the room initiator renders the final composite. Everyone else
    // receives that exact rendered image, so the popup is pixel-identical
    // for every participant instead of each browser rendering its own copy.
    if (participantIdRef.current === initiatorIdRef.current && !finalPhotoBroadcastedRef.current.has(captureId)) {
      finalPhotoBroadcastedRef.current.add(captureId);
      void (async () => {
        try {
          const style = getTemplateStyle(selectedTemplate);
          const rendered = await renderFinalPhoto({
            captures: ordered,
            layout: editorLayout,
            filter: editorFilter,
            caption: editorCaption,
            captionText,
            captionFont,
            captionPosition,
            captionColor,
            polaroid: editorPolaroid,
            border: editorBorder,
            spacing: editorSpacing,
            dateStamp: editorDateStamp,
            sticker: editorSticker,
            background: editorBackground,
            frame: editorFrame,
            selectedTemplate,
            participantNames: ordered.map((capture) => capture.name || "YOU"),
          }, style);
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to prepare final photo."));
            reader.onerror = () => reject(new Error("Unable to prepare final photo."));
            reader.readAsDataURL(rendered.blob);
          });
          setSharedFinalPhoto(dataUrl);
          setCaptureReady(true);
          setEditorOpen(true);
          setSaveOpen(true);
          await sendFinalPhotoToAllPeers(captureId, dataUrl);
        } catch (err) {
          console.error("Final photo render failed:", err);
          finalPhotoBroadcastedRef.current.delete(captureId);
          setCaptureStatus("FINAL PHOTO RENDER FAILED — TRY AGAIN");
        }
      })();
    }
  }, [boothType, captionColor, captionFont, captionPosition, captionText, editorDateStamp, editorBackground, editorBorder, editorCaption, editorFilter, editorFrame, editorLayout, editorPolaroid, editorSpacing, editorSticker, selectedTemplate, sendFinalPhotoToAllPeers]);

  const scheduleCaptureFinalize = useCallback((captureId: string) => {
    const existing = captureFinalizeTimersRef.current.get(captureId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      const frames = captureFramesRef.current.get(captureId);
      const expectedIds = captureExpectedParticipantsRef.current.get(captureId) ?? [];
      if (frames && expectedIds.length) {
        const available = expectedIds.map((id) => frames.get(id)).filter(Boolean);
        const minimum = boothType === "SOLO" ? 1 : 2;
        if (available.length >= minimum) tryFinalizeCapture(captureId, true);
      }
      captureFinalizeTimersRef.current.delete(captureId);
    }, CAPTURE_FINALIZE_TIMEOUT);
    captureFinalizeTimersRef.current.set(captureId, timer);
  }, [tryFinalizeCapture]);

  const handleIncomingFrame = useCallback((remoteId: string, message: Record<string, unknown>) => {
    const captureId = typeof message.captureId === "string" ? message.captureId : null;
    if (!captureId) return;
    const assembly = frameAssemblyRef.current.get(`${captureId}:${remoteId}`);
    if (!assembly) return;
    const bytes = new Uint8Array(assembly.size);
    let offset = 0;
    for (const chunk of assembly.chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const dataUrl = bytesToDataUrl(bytes, assembly.mimeType);
    frameAssemblyRef.current.delete(`${captureId}:${remoteId}`);
    const frames = captureFramesRef.current.get(captureId) ?? new Map<string, CaptureFrame>();
    const participant = activeParticipantsRef.current.find((item) => item.id === remoteId);
    frames.set(remoteId, { participantId: remoteId, name: participant ? participantName(participant) : "CAMERA", dataUrl });
    captureFramesRef.current.set(captureId, frames);
    tryFinalizeCapture(captureId);
  }, [participantName, tryFinalizeCapture]);

  const handleIncomingFinalPhoto = useCallback((remoteId: string, message: Record<string, unknown>) => {
    const captureId = typeof message.captureId === "string" ? message.captureId : null;
    if (!captureId) return;
    const key = `${captureId}:${remoteId}`;
    const assembly = finalPhotoAssemblyRef.current.get(key);
    if (!assembly) return;
    const bytes = new Uint8Array(assembly.size);
    let offset = 0;
    for (const chunk of assembly.chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const dataUrl = bytesToDataUrl(bytes, assembly.mimeType);
    finalPhotoAssemblyRef.current.delete(key);
    setSharedFinalPhoto(dataUrl);
    setCaptureReady(true);
    setEditorOpen(true);
    setSaveOpen(true);
    setCaptureStatus("FINAL PHOTO READY — SAME FOR EVERYONE ♡");
  }, []);

  const attachCaptureChannel = useCallback((remoteId: string, channel: RTCDataChannel) => {
    const state = peerConnectionsRef.current.get(remoteId);
    if (state) state.channel = channel;
    channel.binaryType = "arraybuffer";
    channel.onopen = () => {
      console.log("📸 Capture channel OPEN", remoteId);
      const latest = peerConnectionsRef.current.get(remoteId);
      if (latest) latest.channel = channel;
    };
    channel.onclose = () => {
      const latest = peerConnectionsRef.current.get(remoteId);
      if (latest?.channel === channel) latest.channel = null;
    };
    channel.onmessage = (event) => {
      if (typeof event.data === "string") {
        try {
          const msg = JSON.parse(event.data) as Record<string, unknown>;
          const captureId = typeof msg.captureId === "string" ? msg.captureId : null;
          if (msg.type === "frame-start" && captureId) {
            frameAssemblyRef.current.set(`${captureId}:${remoteId}`, {
              mimeType: typeof msg.mimeType === "string" ? msg.mimeType : "image/jpeg",
              size: Number(msg.size) || 0,
              chunks: [],
              received: 0,
            });
          } else if (msg.type === "frame-end" && captureId) {
            handleIncomingFrame(remoteId, msg);
          } else if (msg.type === "final-photo-start" && captureId) {
            finalPhotoAssemblyRef.current.set(`${captureId}:${remoteId}`, {
              mimeType: typeof msg.mimeType === "string" ? msg.mimeType : "image/jpeg",
              size: Number(msg.size) || 0,
              chunks: [],
              received: 0,
            });
          } else if (msg.type === "final-photo-end" && captureId) {
            handleIncomingFinalPhoto(remoteId, msg);
          }
        } catch (err) {
          console.error("Capture channel message error:", err);
        }
        return;
      }
      const captureId = currentCaptureIdRef.current;
      if (!captureId) return;
      const finalAssembly = finalPhotoAssemblyRef.current.get(`${captureId}:${remoteId}`);
      if (finalAssembly) {
        const chunk = new Uint8Array(event.data as ArrayBuffer);
        finalAssembly.chunks.push(chunk);
        finalAssembly.received += chunk.byteLength;
        return;
      }
      const assembly = frameAssemblyRef.current.get(`${captureId}:${remoteId}`);
      if (!assembly) return;
      const chunk = new Uint8Array(event.data as ArrayBuffer);
      assembly.chunks.push(chunk);
      assembly.received += chunk.byteLength;
    };
  }, [handleIncomingFinalPhoto, handleIncomingFrame]);

  const sendFrameToPeer = useCallback(async (remoteId: string, captureId: string, dataUrl: string) => {
    const channel = peerConnectionsRef.current.get(remoteId)?.channel;
    if (!channel || channel.readyState !== "open") return false;
    const { mimeType, bytes } = dataUrlToBytes(dataUrl);
    channel.send(JSON.stringify({ type: "frame-start", captureId, mimeType, size: bytes.byteLength }));
    for (let offset = 0; offset < bytes.byteLength; offset += FRAME_CHUNK_SIZE) {
      while (channel.bufferedAmount > FRAME_CHUNK_SIZE * 8) {
        await new Promise((resolve) => setTimeout(resolve, 8));
      }
      channel.send(bytes.slice(offset, Math.min(offset + FRAME_CHUNK_SIZE, bytes.byteLength)));
    }
    channel.send(JSON.stringify({ type: "frame-end", captureId }));
    return true;
  }, []);

  const sendLocalFrameToAllPeers = useCallback(async (captureId: string, dataUrl: string) => {
    const peers = Array.from(peerConnectionsRef.current.keys());
    await Promise.all(peers.map((remoteId) => sendFrameToPeer(remoteId, captureId, dataUrl)));
  }, [sendFrameToPeer]);

  const captureLocalFrame = useCallback(() => {
    const video = localVideoRef.current;
    const canvas = localCanvasRef.current;
    if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.save();
    if (cameraFacingRef.current === "user") {
      context.translate(width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, width, height);
    if (localFaceEffect !== "none" && faceLandmarksRef.current.length) {
      drawFaceEffect(context, width, height, faceLandmarksRef.current, localFaceEffect, cameraFacingRef.current === "user");
    }
    context.restore();
    return canvas.toDataURL("image/jpeg", 0.92);
  }, [localFaceEffect]);

  const captureAndSendFrame = useCallback(async (captureId: string) => {
    if (currentCaptureIdRef.current !== captureId) return;
    const local = captureLocalFrame();
    if (!local) {
      setCaptureStatus("CAMERA FRAME NOT READY");
      setCapturing(false);
      captureRunningRef.current = false;
      return;
    }
    const me = participantIdRef.current;
    if (!me) return;
    const frames = captureFramesRef.current.get(captureId) ?? new Map<string, CaptureFrame>();
    frames.set(me, { participantId: me, name: "YOU", dataUrl: local });
    captureFramesRef.current.set(captureId, frames);
    setLocalCapture(local);
    setCaptureStatus("SYNCING EVERY CAMERA...");
    await sendLocalFrameToAllPeers(captureId, local);
    tryFinalizeCapture(captureId);
  }, [captureLocalFrame, sendLocalFrameToAllPeers, tryFinalizeCapture]);

  const scheduleLocalCapture = useCallback((captureId: string, captureAt: number) => {
    const existing = captureTimersRef.current.get(captureId);
    if (existing) clearTimeout(existing);
    const delay = Math.max(0, captureAt - Date.now());
    const timer = setTimeout(() => {
      captureTimersRef.current.delete(captureId);
      void captureAndSendFrame(captureId);
    }, delay);
    captureTimersRef.current.set(captureId, timer);
  }, [captureAndSendFrame]);

  const createPeer = useCallback(async (remoteId: string) => {
    const existing = peerConnectionsRef.current.get(remoteId);
    if (existing) return existing.peer;

    const pending = peerCreationPromisesRef.current.get(remoteId);
    if (pending) return pending;

    const creation = (async (): Promise<RTCPeerConnection | null> => {
      const localStream = localStreamRef.current;
      const me = participantIdRef.current;
      if (!localStream || !me || remoteId === me) return null;

      const alreadyCreated = peerConnectionsRef.current.get(remoteId);
      if (alreadyCreated) return alreadyCreated.peer;

      const iceServers = await getIceServers();
      const peer = new RTCPeerConnection({
        iceServers,
        bundlePolicy: "max-bundle",
      });
      const state: PeerState = { peer, channel: null, remoteId };
      peerConnectionsRef.current.set(remoteId, state);
      pendingIceCandidatesRef.current.set(remoteId, []);

      localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

      // Keep each outgoing stream light enough for multi-party rooms.
      // One device may upload to 2, 3 or 4 peers, so unconstrained 1080p
      // encoding quickly becomes expensive on laptops and phones.
      for (const sender of peer.getSenders()) {
        const params = sender.getParameters();
        if (!params.encodings || params.encodings.length === 0) {
          params.encodings = [{}];
        }
        for (const encoding of params.encodings) {
          encoding.maxBitrate = sender.track?.kind === "video" ? VIDEO_MAX_BITRATE : 64_000;
          if (sender.track?.kind === "video") {
            encoding.maxFramerate = VIDEO_FRAME_RATE;
          }
        }
        try {
          await sender.setParameters(params);
        } catch (err) {
          console.warn("Unable to apply sender media limits:", err);
        }
        if (sender.track?.kind === "video") sender.track.contentHint = "motion";
      }

      peer.ontrack = (event) => {
        // Prefer the browser-provided stream. It normally contains both the
        // audio and video tracks from this peer and remains stable across
        // track events, which prevents video/audio replacement flicker.
        const stream = event.streams[0] ?? remoteStreamsRef.current.get(remoteId) ?? new MediaStream();
        if (!stream.getTracks().some((track) => track.id === event.track.id)) {
          stream.addTrack(event.track);
        }
        remoteStreamsRef.current.set(remoteId, stream);

        event.track.onended = () => {
          const current = remoteStreamsRef.current.get(remoteId);
          if (!current) return;
          if (current.getTracks().some((track) => track.id === event.track.id)) {
            current.removeTrack(event.track);
          }
        };

        const video = remoteVideoRefs.current.get(remoteId);
        if (video) {
          if (video.srcObject !== stream) video.srcObject = stream;
          video.muted = false;
          video.volume = 1;
          void video.play().catch(() => {});
        }

        const preview = remotePreviewVideoRefs.current.get(remoteId);
        if (preview) {
          if (preview.srcObject !== stream) preview.srcObject = stream;
          // Preview is visual-only; the main camera tile owns remote audio.
          preview.muted = true;
          void preview.play().catch(() => {});
        }

        setRemoteConnected(true);
        setConnectionStatus(`${Math.max(2, activeParticipantsRef.current.length)} CAMERAS CONNECTED ♡`);
      };

      peer.ondatachannel = (event) => attachCaptureChannel(remoteId, event.channel);

      if (me < remoteId) {
        attachCaptureChannel(remoteId, peer.createDataChannel(CAPTURE_CHANNEL, { ordered: true }));
      }

      peer.onicecandidate = (event) => {
        if (!event.candidate) return;
        const candidate = event.candidate.toJSON();
        void sendSignal("candidate", {
          toParticipantId: remoteId,
          fromParticipantId: me,
          candidate: candidate.candidate ?? null,
          sdpMid: candidate.sdpMid ?? null,
          sdpMLineIndex: candidate.sdpMLineIndex ?? null,
          usernameFragment: candidate.usernameFragment ?? null,
        });
      };

      peer.onconnectionstatechange = () => {
        const connected = Array.from(peerConnectionsRef.current.values())
          .filter((item) => item.peer.connectionState === "connected").length;
        const totalRemote = Math.max(0, activeParticipantsRef.current.length - 1);
        setRemoteConnected(connected > 0);
        if (connected === 0 && totalRemote > 0) setConnectionStatus("CONNECTING CAMERAS...");
        else if (connected > 0) setConnectionStatus(`${connected + 1} CAMERA${connected + 1 === 1 ? "" : "S"} CONNECTED ♡`);
        else setConnectionStatus("WAITING FOR MORE CAMERAS");
      };

      peer.oniceconnectionstatechange = () => {
        if (peer.iceConnectionState === "failed") {
          setConnectionStatus("RECONNECTING CAMERAS...");
          const existing = reconnectTimersRef.current.get(remoteId);
          if (existing) clearTimeout(existing);
          const timer = setTimeout(() => {
            void createOffer(remoteId, true);
            reconnectTimersRef.current.delete(remoteId);
          }, 900);
          reconnectTimersRef.current.set(remoteId, timer);
        }
      };

      return peer;
    })();

    peerCreationPromisesRef.current.set(remoteId, creation);
    try {
      return await creation;
    } finally {
      if (peerCreationPromisesRef.current.get(remoteId) === creation) {
        peerCreationPromisesRef.current.delete(remoteId);
      }
    }
  }, [attachCaptureChannel, getIceServers, sendSignal]);

  const adaptPeerQuality = useCallback(async () => {
    const now = Date.now();

    for (const [remoteId, state] of peerConnectionsRef.current.entries()) {
      const peer = state.peer;
      if (peer.connectionState !== "connected") continue;

      try {
        const stats = await peer.getStats();
        const outbound = Array.from(stats.values()).find(
          (report) =>
            report.type === "outbound-rtp" &&
            report.kind === "video" &&
            !(report as unknown as { isRemote?: boolean }).isRemote
        ) as unknown as { bytesSent?: number; packetsSent?: number } | undefined;

        const remoteInbound = Array.from(stats.values()).find(
          (report) =>
            report.type === "remote-inbound-rtp" &&
            report.kind === "video"
        ) as unknown as { packetsLost?: number } | undefined;

        if (!outbound) continue;

        const previous = qualitySampleRef.current.get(remoteId);
        const bytesSent = outbound.bytesSent ?? 0;
        const packetsLost = remoteInbound?.packetsLost ?? 0;

        if (!previous) {
          qualitySampleRef.current.set(remoteId, { timestamp: now, bytesSent, packetsLost, packetsSent: outbound.packetsSent ?? 0 });
          continue;
        }

        const elapsed = Math.max(1, now - previous.timestamp);
        const bitrate = ((bytesSent - previous.bytesSent) * 8 * 1000) / elapsed;
        const lossDelta = Math.max(0, packetsLost - previous.packetsLost);
        const packetsSentDelta = Math.max(1, (outbound.packetsSent ?? 0) - previous.packetsSent);
        const currentLossRate = lossDelta / packetsSentDelta;

        const sender = peer.getSenders().find((item) => item.track?.kind === "video");
        if (sender) {
          const params = sender.getParameters();
          if (!params.encodings?.length) params.encodings = [{}];

          const current = params.encodings[0].maxBitrate ?? VIDEO_MAX_BITRATE;
          let next = current;

          if (currentLossRate > 0.08 || bitrate < current * 0.55) {
            next = Math.max(VIDEO_MIN_BITRATE, Math.round(current * 0.72));
          } else if (currentLossRate < 0.02 && bitrate > current * 0.75) {
            next = Math.min(VIDEO_MAX_BITRATE, Math.round(current * 1.12));
          }

          if (next !== current) {
            params.encodings[0].maxBitrate = next;
            params.encodings[0].maxFramerate = VIDEO_MAX_FRAMERATE;
            await sender.setParameters(params);
          }
        }

        qualitySampleRef.current.set(remoteId, { timestamp: now, bytesSent, packetsLost, packetsSent: outbound.packetsSent ?? 0 });
      } catch {
        // Stats are advisory; a failed stats read must never interrupt the booth.
      }
    }
  }, []);

  const createOffer = useCallback(async (remoteId: string, iceRestart = false) => {
    const me = participantIdRef.current;
    if (!me || me > remoteId || makingOfferRef.current.has(remoteId)) return;
    const peer = await createPeer(remoteId);
    if (!peer || peer.signalingState !== "stable") return;
    makingOfferRef.current.add(remoteId);
    try {
      const offer = await peer.createOffer(iceRestart ? { iceRestart: true } : undefined);
      await peer.setLocalDescription(offer);
      const description = peer.localDescription;
      if (!description) return;
      await sendSignal("offer", {
        toParticipantId: remoteId,
        fromParticipantId: me,
        type: description.type,
        sdp: description.sdp ?? null,
      });
    } catch (err) {
      console.error("Offer creation failed:", err);
    } finally {
      makingOfferRef.current.delete(remoteId);
    }
  }, [createPeer, sendSignal]);

  const ensurePeers = useCallback(async (participants: BoothParticipant[]) => {
    const me = participantIdRef.current;
    if (!me || !localStreamRef.current) return;

    const remotes = participants.filter((participant) => participant.id && participant.id !== me);

    // Create all peer objects in parallel so a third/fourth participant does
    // not have to wait for the previous peer's ICE configuration request.
    await Promise.all(remotes.map((participant) => createPeer(participant.id)));

    // Only the lower participant id creates the offer for a pair.
    await Promise.all(
      remotes
        .filter((participant) => me < participant.id)
        .map(async (participant) => {
          const peer = peerConnectionsRef.current.get(participant.id)?.peer;
          if (peer && !peer.localDescription) {
            await createOffer(participant.id);
          }
        })
    );
  }, [createOffer, createPeer]);

  const handleSignal = useCallback(async (signal: Signal) => {
    const payload = signal.payload;
    const me = participantIdRef.current;
    const target = typeof payload.toParticipantId === "string" ? payload.toParticipantId : null;
    const from = typeof payload.fromParticipantId === "string" ? payload.fromParticipantId : null;
    if (target && target !== me) return;
    if (!from || from === me) {
      if (signal.type !== "capture") return;
    }

    if (signal.type === "capture") {
      const captureId = typeof payload.captureId === "string" ? payload.captureId : signal.id;
      if (processedCaptureIdsRef.current.has(captureId)) return;
      processedCaptureIdsRef.current.add(captureId);
      const participantIds = Array.isArray(payload.participantIds)
        ? payload.participantIds.filter((id): id is string => typeof id === "string")
        : activeParticipantsRef.current.map((item) => item.id);
      const names = activeParticipantsRef.current.reduce<Record<string, string>>((acc, item) => {
        acc[item.id] = participantName(item);
        return acc;
      }, {});
      captureExpectedParticipantsRef.current.set(captureId, participantIds);
      captureFramesRef.current.set(captureId, new Map());
      currentCaptureIdRef.current = captureId;
      setLocalCapture(null);
      setRemoteCapture(null);
      setCaptures([]);
      setCaptureReady(false);
      setSharedFinalPhoto(null);
      setEditorOpen(false);
      setSaveOpen(false);
      captureRunningRef.current = true;
      setCapturing(true);
      setCaptureStatus("CAPTURING TOGETHER ♡");
      const captureAt = typeof payload.captureAt === "number" ? payload.captureAt : Date.now();
      scheduleLocalCapture(captureId, captureAt);
      scheduleCaptureFinalize(captureId);
      void names;
      return;
    }

    if (!from) return;
    const peer = await createPeer(from);
    if (!peer) return;

    try {
      if (signal.type === "offer") {
        const sdp = typeof payload.sdp === "string" ? payload.sdp : null;
        if (!sdp || peer.signalingState !== "stable") return;
        await peer.setRemoteDescription({ type: "offer", sdp });
        remoteDescriptionReadyRef.current.add(from);
        const queued = pendingIceCandidatesRef.current.get(from) ?? [];
        for (const candidate of queued) {
          try { await peer.addIceCandidate(candidate); } catch (err) { console.error("Queued ICE failed:", err); }
        }
        pendingIceCandidatesRef.current.set(from, []);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        const description = peer.localDescription;
        if (!description) return;
        await sendSignal("answer", {
          toParticipantId: from,
          fromParticipantId: me,
          type: description.type,
          sdp: description.sdp ?? null,
        });
        return;
      }

      if (signal.type === "answer") {
        const sdp = typeof payload.sdp === "string" ? payload.sdp : null;
        if (!sdp || peer.signalingState !== "have-local-offer") return;
        await peer.setRemoteDescription({ type: "answer", sdp });
        remoteDescriptionReadyRef.current.add(from);
        const queued = pendingIceCandidatesRef.current.get(from) ?? [];
        for (const candidate of queued) {
          try { await peer.addIceCandidate(candidate); } catch (err) { console.error("Queued ICE failed:", err); }
        }
        pendingIceCandidatesRef.current.set(from, []);
        return;
      }

      if (signal.type === "candidate") {
        const candidate = typeof payload.candidate === "string" ? payload.candidate : null;
        if (!candidate) return;
        const init: RTCIceCandidateInit = {
          candidate,
          sdpMid: typeof payload.sdpMid === "string" ? payload.sdpMid : null,
          sdpMLineIndex: typeof payload.sdpMLineIndex === "number" ? payload.sdpMLineIndex : null,
          usernameFragment: typeof payload.usernameFragment === "string" ? payload.usernameFragment : null,
        };
        if (!peer.remoteDescription) {
          const queued = pendingIceCandidatesRef.current.get(from) ?? [];
          queued.push(init);
          pendingIceCandidatesRef.current.set(from, queued);
          return;
        }
        await peer.addIceCandidate(init);
      }
    } catch (err) {
      console.error(`Failed to process ${signal.type}:`, err);
    }
  }, [createPeer, participantName, scheduleCaptureFinalize, scheduleLocalCapture, sendSignal]);

  const activeParticipantsRef = useRef<BoothParticipant[]>([]);
  useEffect(() => {
    activeParticipantsRef.current = activeParticipants;
  }, [activeParticipants]);

  const pollSignals = useCallback(async () => {
    if (!boothId || !participantIdRef.current || processingSignalsRef.current) return;
    processingSignalsRef.current = true;
    try {
      const since = lastSignalTimeRef.current;
      const query = since ? `?since=${encodeURIComponent(since)}` : "";
      const response = await fetch(`/api/booths/${boothId}/signal${query}`, { credentials: "include", cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json().catch(() => null) as { signals?: Signal[]; participants?: BoothParticipant[] } | null;
      const participants = Array.isArray(data?.participants) ? data.participants : [];
      if (participants.length) {
        updateParticipantState(participants);
        void ensurePeers(participants);
      }
      const signals = Array.isArray(data?.signals) ? data.signals : [];
      for (const signal of signals) {
        if (processedSignalIdsRef.current.has(signal.id)) continue;
        processedSignalIdsRef.current.add(signal.id);
        if (processedSignalIdsRef.current.size > 700) {
          const oldest = processedSignalIdsRef.current.values().next().value;
          if (oldest) processedSignalIdsRef.current.delete(oldest);
        }
        await handleSignal(signal);
        lastSignalTimeRef.current = signal.createdAt;
      }
    } catch (err) {
      console.error("Signal polling failed:", err);
    } finally {
      processingSignalsRef.current = false;
      pollTimerRef.current = setTimeout(() => void pollSignals(), POLL_INTERVAL);
    }
  }, [boothId, ensurePeers, handleSignal, updateParticipantState]);

  useEffect(() => {
    if (!roomReady) return;

    const timer = window.setInterval(() => {
      void adaptPeerQuality();
    }, QUALITY_SAMPLE_INTERVAL);

    return () => window.clearInterval(timer);
  }, [adaptPeerQuality, roomReady]);

  const joinSession = useCallback(async () => {
    if (!boothId) return false;
    try {
      const response = await fetch(`/api/booths/${boothId}/session`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json().catch(() => ({})) as SessionResponse;
      if (!response.ok) throw new Error(data.error ?? "Unable to join this booth.");
      if (data.booth?.type === "SOLO" || data.booth?.type === "COUPLE" || data.booth?.type === "RANDOM") {
        setBoothType(data.booth.type);
        setConnectionStatus(
          data.booth.type === "SOLO"
            ? "READY TO CAPTURE ♡"
            : activeParticipantsRef.current.length > 1
              ? "CONNECTING CAMERAS..."
              : "WAITING FOR MORE CAMERAS"
        );
      }
      if (data.participant?.id) participantIdRef.current = data.participant.id;
      initiatorIdRef.current = data.initiatorId ?? null;
      if (Array.isArray(data.activeParticipants)) {
        updateParticipantState(data.activeParticipants);
      }
      if (typeof data.plan?.participantLimit === "number" || data.plan?.participantLimit === null) {
        setParticipantLimit(data.plan.participantLimit ?? null);
      }

      if (data.plan?.participantPlan === "FREE" || data.plan?.participantPlan === "PLUS" || data.plan?.participantPlan === "PRO") {
        setParticipantPlan(data.plan.participantPlan);
      }

      if (typeof data.plan?.participantUnlimited === "boolean") {
        setParticipantUnlimited(data.plan.participantUnlimited);
      }

      if (typeof data.plan?.participantLevel === "number") {
        setParticipantLevel(Math.max(1, Math.min(3, data.plan.participantLevel)));
      } else {
        const fallbackPlan = data.plan?.participantPlan;
        setParticipantLevel(
          data.plan?.participantUnlimited
            ? 3
            : fallbackPlan === "PRO"
              ? 3
              : fallbackPlan === "PLUS"
                ? 2
                : 1
        );
      }

      if (typeof data.template === "string" && data.template.trim()) {
        const normalizedTemplate = data.template.trim().toLowerCase();
        if (BOOTH_TEMPLATES.some(([id]) => id === normalizedTemplate)) setSelectedTemplate(normalizedTemplate);
      }
      setSessionId(data.session?.id ?? null);
      setRoomReady(true);
      return true;
    } catch (err) {
      console.error("Booth session error:", err);
      setError(err instanceof Error ? err.message : "Unable to join booth.");
      return false;
    }
  }, [boothId, updateParticipantState]);

  async function startCamera() {
    if (startedRef.current) return;
    setError("");
    setCameraStarting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access is unavailable in this browser.");
      let stream: MediaStream;
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: VIDEO_WIDTH, max: VIDEO_WIDTH },
        height: { ideal: VIDEO_HEIGHT, max: VIDEO_HEIGHT },
        frameRate: { ideal: VIDEO_FRAME_RATE, max: 30 },
        facingMode: { ideal: cameraFacingRef.current },
      };
      const audioConstraints: MediaTrackConstraints = {
        channelCount: { ideal: 1 },
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: audioConstraints });
      } catch (preferredError) {
        console.warn("Preferred camera/mic request failed; trying simpler media settings:", preferredError);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } }, audio: true });
        } catch (cameraMicError) {
          console.warn("Camera + microphone request failed; trying camera only:", cameraMicError);
          stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } }, audio: false });
        }
      }
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play();
      }
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      setCameraEnabled(videoTrack ? videoTrack.enabled : false);
      setMicEnabled(audioTrack ? audioTrack.enabled : false);
      setCameraReady(true);

      const joined = await joinSession();
      if (!joined) {
        stream.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
        setCameraReady(false);
        return;
      }

      startedRef.current = true;
      setConnectionStatus(
        boothType === "SOLO"
          ? "SOLO CAMERA READY ♡"
          : activeParticipantsRef.current.length > 1
            ? "CONNECTING CAMERAS..."
            : "WAITING FOR MORE CAMERAS"
      );
      lastSignalTimeRef.current = new Date().toISOString();
      void ensurePeers(activeParticipantsRef.current);
      void pollSignals();
    } catch (err) {
      console.error("UsBooth camera error:", err);
      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError": setError("Camera or microphone permission was denied."); break;
          case "NotFoundError": setError("No camera or microphone was found."); break;
          case "NotReadableError": setError("Your camera or microphone is already being used by another application."); break;
          case "SecurityError": setError("The browser blocked camera or microphone access."); break;
          case "OverconstrainedError": setError("The requested camera settings are unavailable."); break;
          default: setError(`Media error: ${err.name}`);
        }
      } else if (err instanceof Error) setError(err.message);
      else setError("Unable to start the camera.");
      setCameraReady(false);
    } finally {
      setCameraStarting(false);
    }
  }

  function toggleCamera() {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraEnabled(track.enabled);
  }

  function toggleMicrophone() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicEnabled(track.enabled);
  }

  async function flipCamera() {
    const stream = localStreamRef.current;
    const currentTrack = stream?.getVideoTracks()[0];
    if (!stream || !currentTrack) return;
    const nextFacing = cameraFacingRef.current === "user" ? "environment" : "user";
    try {
      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: VIDEO_WIDTH, max: VIDEO_WIDTH }, height: { ideal: VIDEO_HEIGHT, max: VIDEO_HEIGHT }, frameRate: { ideal: VIDEO_FRAME_RATE, max: 30 }, facingMode: { ideal: nextFacing } }, audio: false });
      } catch (preferredFlipError) {
        console.warn("Preferred flip camera request failed; trying any camera:", preferredFlipError);
        newStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } }, audio: false });
      }
      const newTrack = newStream.getVideoTracks()[0];
      if (!newTrack) return;
      for (const state of peerConnectionsRef.current.values()) {
        const sender = state.peer.getSenders().find((item) => item.track?.kind === "video");
        if (sender) await sender.replaceTrack(newTrack);
      }
      currentTrack.stop();
      stream.removeTrack(currentTrack);
      stream.addTrack(newTrack);
      cameraFacingRef.current = nextFacing;
      setCameraFacing(nextFacing);
      newTrack.enabled = cameraEnabled;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play();
      }
    } catch (err) {
      console.error("Camera flip failed:", err);
      setError("Unable to switch cameras on this device.");
    }
  }

  const stopEverything = useCallback(() => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = null;
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = null;
    for (const timer of captureFinalizeTimersRef.current.values()) clearTimeout(timer);
    for (const timer of captureTimersRef.current.values()) clearTimeout(timer);
    captureFinalizeTimersRef.current.clear();
    captureTimersRef.current.clear();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    for (const element of remoteVideoRefs.current.values()) element.srcObject = null;
    for (const element of remotePreviewVideoRefs.current.values()) element.srcObject = null;
    for (const state of peerConnectionsRef.current.values()) state.peer.close();
    peerConnectionsRef.current.clear();
    peerCreationPromisesRef.current.clear();
    remoteStreamsRef.current.clear();
    remoteVideoRefCallbacks.current.clear();
    participantSignatureRef.current = "";
    frameAssemblyRef.current.clear();
    finalPhotoAssemblyRef.current.clear();
    finalPhotoBroadcastedRef.current.clear();
    captureFramesRef.current.clear();
    captureExpectedParticipantsRef.current.clear();
    openedCaptureIdsRef.current.clear();
    currentCaptureIdRef.current = null;
    startedRef.current = false;
    participantIdRef.current = null;
    initiatorIdRef.current = null;
    makingOfferRef.current.clear();
    pendingIceCandidatesRef.current.clear();
    remoteDescriptionReadyRef.current.clear();
    processedSignalIdsRef.current.clear();
    processedCaptureIdsRef.current.clear();
    iceServersRef.current = null;
    iceServersPromiseRef.current = null;
    captureRunningRef.current = false;
    soloShotsRef.current = [];
  }, []);

  useEffect(() => {
    if (localPreviewVideoRef.current && localStreamRef.current) {
      localPreviewVideoRef.current.srcObject = localStreamRef.current;
      void localPreviewVideoRef.current.play().catch(() => {});
    }
  }, [cameraReady]);

  useEffect(() => () => stopEverything(), [stopEverything]);

  const startCaptureCountdown = useCallback(async () => {
    const currentParticipants = activeParticipantsRef.current;
    if (captureRunningRef.current || !cameraReady || currentParticipants.length < (boothType === "SOLO" ? 1 : 2)) return;
    const captureId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const participantIds = currentParticipants.map((item) => item.id);
    const captureAt = Date.now() + COUNTDOWN_SECONDS * 1000;
    currentCaptureIdRef.current = captureId;
    captureExpectedParticipantsRef.current.set(captureId, participantIds);
    captureFramesRef.current.set(captureId, new Map());
    if (boothType === "SOLO") {
      const targetShots = Math.max(1, getTemplatePhotoSlotCount(selectedTemplate));
      if (soloShotsRef.current.length >= targetShots) {
        soloShotsRef.current = [];
        setCaptures([]);
      }
    } else {
      setCaptures([]);
    }
    setLocalCapture(null);
    setRemoteCapture(null);
    setCaptureReady(false);
    setSharedFinalPhoto(null);
    setEditorOpen(false);
    setSaveOpen(false);
    captureRunningRef.current = true;
    setCapturing(true);
    setCaptureStatus("GET READY...");
    processedCaptureIdsRef.current.add(captureId);
    const sent = await sendSignal("capture", {
      action: "countdown",
      captureId,
      participantIds,
      captureAt,
      countdown: COUNTDOWN_SECONDS,
      timestamp: Date.now(),
    });
    if (!sent) {
      captureRunningRef.current = false;
      setCapturing(false);
      setCaptureStatus("SYNC FAILED — TRY AGAIN");
      return;
    }
    scheduleCaptureFinalize(captureId);
    let remaining = COUNTDOWN_SECONDS;
    setCountdown(remaining);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setCountdown(remaining);
        return;
      }
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
      setCountdown(null);
      setCaptureStatus("CAPTURING TOGETHER ♡");
      void captureAndSendFrame(captureId);
    }, 1000);
  }, [boothType, cameraReady, captureAndSendFrame, scheduleCaptureFinalize, sendSignal, selectedTemplate]);

  const liveTemplateStyle = getTemplateStyle(selectedTemplate);

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <main className="booth-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="booth-header">
        <Link
          href="/"
          className="booth-logo"
        >
          USBOOTH<span>♥</span>
        </Link>

        <div className="booth-room">
          <span>ROOM</span>

          <strong>
            {boothId ||
              "LOADING..."}
          </strong>
        </div>

        <Link
          href="/account"
          className="booth-exit"
          onClick={
            stopEverything
          }
        >
          EXIT BOOTH
        </Link>
      </header>

      {/* =================================================
          WORKSPACE
      ================================================= */}

      <section className="booth-workspace">
        <div className="booth-eyebrow">
          ✦ &nbsp; VIRTUAL PHOTOBOOTH
          &nbsp; ✦
        </div>

        <h1>
          {boothType === "SOLO" ? "Capture your" : "Capture it"}
          <span>
            {" "}{boothType === "SOLO" ? "moment." : "together."}
          </span>
        </h1>

        <p className="booth-description">
          One room.
          <br />
          {Math.max(1, activeParticipants.length)} camera{activeParticipants.length === 1 ? "" : "s"}. One little
          moment. ♡
        </p>

        {/* =================================================
            CAMERA STAGE
        ================================================= */}

        <div className={`camera-stage multi-camera-grid camera-count-${Math.max(1, activeParticipants.length)}`}>
          <div className="camera-panel">
            <div className="camera-header">
              <span>♡ &nbsp; YOUR CAMERA</span>
              <span className="camera-live">● {cameraReady ? "LIVE" : "OFF"}</span>
            </div>
            <div className="camera-feed camera-a">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: cameraReady ? "block" : "none",
                  transform: cameraFacing === "user" ? "scaleX(-1)" : "scaleX(1)",
                }}
              />
              {cameraReady && localFaceEffect !== "none" && (
                <FaceEffectsOverlay
                  videoRef={localVideoRef}
                  effectId={localFaceEffect}
                  landmarksRef={faceLandmarksRef}
                  mirror={cameraFacing === "user"}
                />
              )}
              {!cameraReady && (
                <div className="camera-placeholder">
                  <span>♡</span>
                  <strong>YOUR CAMERA</strong>
                  <small>{cameraStarting ? "Starting camera..." : "Your camera will appear here"}</small>
                </div>
              )}
            </div>
          </div>

          {activeParticipants
            .filter((participant) => participant.id !== participantIdRef.current)
            .map((participant) => {
              const stream = remoteStreamsRef.current.get(participant.id);
              const connected = Boolean(stream) && peerConnectionsRef.current.get(participant.id)?.peer.connectionState === "connected";
              return (
                <div className="camera-panel" key={participant.id}>
                  <div className="camera-header">
                    <span>♡ &nbsp; {participantName(participant).toUpperCase()}</span>
                    <span className="camera-live">● {connected ? "LIVE" : "WAITING"}</span>
                  </div>
                  <div className="camera-feed camera-b">
                    <video
                      ref={getRemoteVideoRef(participant.id)}
                      autoPlay
                      playsInline
                      muted={false}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: connected ? "block" : "none",
                      }}
                    />
                    {!connected && (
                      <div className="camera-placeholder">
                        <span>♡</span>
                        <strong>{participantName(participant).toUpperCase()}</strong>
                        <small>Connecting camera...</small>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          {boothType !== "SOLO" && activeParticipants.length === 1 && (
            <div className="camera-panel camera-waiting-panel">
              <div className="camera-header">
                <span>♡ &nbsp; NEXT CAMERA</span>
                <span className="camera-live">● WAITING</span>
              </div>
              <div className="camera-feed camera-b">
                <div className="camera-placeholder">
                  <span>♡</span>
                  <strong>WAITING FOR A FRIEND</strong>
                  <small>Share the room code to add another camera.</small>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =================================================
            HIDDEN CANVASES
        ================================================= */}

        <canvas ref={localCanvasRef} style={{ display: "none" }} />

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            style={{
              maxWidth: "700px",
              margin:
                "20px auto 0",

              padding:
                "14px 18px",

              border:
                "1px solid rgba(212, 91, 96, 0.4)",

              borderRadius:
                "10px",

              background:
                "rgba(183, 63, 69, 0.1)",

              color:
                "#f0c5c1",

              fontSize:
                "10px",

              lineHeight:
                1.6,
            }}
          >
            {error}
          </div>
        )}

        {/* =================================================
            START CAMERA
        ================================================= */}

        {!cameraReady && (
          <button
            type="button"
            onClick={
              startCamera
            }
            disabled={
              cameraStarting
            }
            style={{
              marginTop:
                "28px",

              minHeight:
                "46px",

              padding:
                "0 28px",

              borderRadius:
                "8px",

              border:
                "1px solid #b73f45",

              background:
                "linear-gradient(135deg, #b73f45, #d45b60)",

              color:
                "#fff1e7",

              cursor:
                cameraStarting
                  ? "wait"
                  : "pointer",

              fontFamily:
                "inherit",

              fontSize:
                "9px",

              fontWeight:
                700,

              letterSpacing:
                "0.12em",

              opacity:
                cameraStarting
                  ? 0.7
                  : 1,
            }}
          >
            {cameraStarting
              ? "STARTING CAMERA..."
              : "♡ TURN ON CAMERA"}
          </button>
        )}

        {/* =================================================
            CAMERA CONTROLS
        ================================================= */}

        {cameraReady && (
          <div
            style={{
              display:
                "flex",

              justifyContent:
                "center",

              alignItems:
                "center",

              flexWrap:
                "wrap",

              gap:
                "9px",

              marginTop:
                "22px",
            }}
          >
            <button
              type="button"
              onClick={
                toggleMicrophone
              }
              style={{
                padding:
                  "10px 14px",

                border:
                  "1px solid #332d28",

                background:
                  micEnabled
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(183,63,69,0.15)",

                color:
                  micEnabled
                    ? "#c9bba8"
                    : "#d45b60",

                cursor:
                  "pointer",

                fontSize:
                  "8px",

                letterSpacing:
                  "0.1em",
              }}
            >
              {micEnabled
                ? "🎙 MIC ON"
                : "🔇 MIC OFF"}
            </button>

            <button
              type="button"
              onClick={
                flipCamera
              }
              style={{
                padding:
                  "10px 14px",

                border:
                  "1px solid #332d28",

                background:
                  "rgba(255,255,255,0.02)",

                color:
                  "#c9bba8",

                cursor:
                  "pointer",

                fontSize:
                  "8px",

                letterSpacing:
                  "0.1em",
              }}
            >
              🔄 FLIP
            </button>

            <button
              type="button"
              onClick={
                toggleCamera
              }
              style={{
                padding:
                  "10px 14px",

                border:
                  "1px solid #332d28",

                background:
                  cameraEnabled
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(183,63,69,0.15)",

                color:
                  cameraEnabled
                    ? "#c9bba8"
                    : "#d45b60",

                cursor:
                  "pointer",

                fontSize:
                  "8px",

                letterSpacing:
                  "0.1em",
              }}
            >
              {cameraEnabled
                ? "📷 CAMERA ON"
                : "📷 CAMERA OFF"}
            </button>
          </div>
        )}

        {/* =================================================
            CONNECTION STATUS
        ================================================= */}

        <div
          className="connection-status"
          style={{
            justifyContent:
              "center",

            marginTop:
              "18px",
          }}
        >
          <span
            className="connection-dot"
            style={{
              background:
                remoteConnected
                  ? "#d45b60"
                  : "#8a5c52",
            }}
          />

          {connectionStatus}
        </div>

        {/* =================================================
            COUNTDOWN
        ================================================= */}

        {countdown !== null && (
          <div
            style={{
              marginTop:
                "22px",

              fontFamily:
                '"Cormorant Garamond", Georgia, serif',

              fontSize:
                "72px",

              lineHeight:
                1,

              color:
                "#d45b60",

              fontWeight:
                500,
            }}
          >
            {countdown}
          </div>
        )}

        {/* =================================================
            SHUTTER
        ================================================= */}

        <div className="shutter-area">
          <button
            type="button"
            className="shutter-button"
            onClick={() => void startCaptureCountdown()}
            aria-label="Take photo"
            style={{
              position: "relative",
              zIndex: 100,
              pointerEvents: "auto",
              opacity: cameraReady && (boothType === "SOLO" || activeParticipants.length >= 2) && !captureRunningRef.current ? 1 : 0.35,
              cursor: cameraReady && (boothType === "SOLO" || activeParticipants.length >= 2) && !captureRunningRef.current ? "pointer" : "not-allowed",
            }}
          >
            <span />
          </button>
          <small className="shutter-hint">
            {capturing
              ? countdown !== null
                ? `CAPTURING IN ${countdown}...`
                : "CAPTURING..."
              : boothType === "SOLO"
                ? soloShotsRef.current.length > 0
                  ? `SHOT ${soloShotsRef.current.length + 1} READY · CLICK THE SHUTTER ♡`
                  : "CLICK THE SHUTTER · SOLO MODE ♡"
                : activeParticipants.length >= 2
                  ? `CLICK THE SHUTTER · ${activeParticipants.length} CAMERAS ♡`
                  : "WAITING FOR AT LEAST 2 CAMERAS"}
          </small>
        </div>

        {/* =================================================
            LIVE PREVIEW
        ================================================= */}

        <section className="preview-section">
          <div className="preview-heading">
            <div>
              <span>✦ &nbsp; LIVE PREVIEW</span>
              <h2>Your photo,<em>{" "}together.</em></h2>
            </div>
            <span className="preview-ratio">{editorLayout} · {editorFilter}</span>
          </div>

          <div style={{display:"flex",justifyContent:"center",flexWrap:"wrap",gap:"7px",marginBottom:"12px"}}>
            {[
              `LAYOUT: ${editorLayout}`,
              `FRAME: ${editorFrame}`,
              `FILTER: ${editorFilter}`,
              editorCaption ? "CAPTION ON" : "CAPTION OFF",
              editorPolaroid ? "POLAROID ON" : "POLAROID OFF",
              `BG: ${editorBackground}`,
            ].map((label) => (
              <span key={label} style={{padding:"6px 9px",borderRadius:"999px",border:"1px solid #332d28",color:"#b9aa9b",fontSize:"7px",letterSpacing:".08em"}}>
                {label}
              </span>
            ))}
          </div>

          {/* LIVE PREVIEW: the template is a foreground mask. Its photo windows are
              transparent, so the real camera streams remain visible underneath. */}
          {(() => {
            const previewSlots = getTemplatePhotoSlots(
              selectedTemplate,
              1400,
              Math.round(1400 * 1230 / 698)
            );
            const soloPreviewItems = boothType === "SOLO"
              ? [
                  ...captures.map((capture, index) => ({
                    id: `solo-shot-${index}`,
                    name: `SHOT ${index + 1}`,
                    live: false,
                    mirror: false,
                    dataUrl: capture.dataUrl,
                  })),
                  ...(captures.length < previewSlots.length
                    ? [{
                        id: "solo-live",
                        name: `SHOT ${captures.length + 1} LIVE`,
                        live: cameraReady,
                        mirror: true,
                        dataUrl: null,
                      }]
                    : []),
                ]
              : null;
            const previewImageItems = soloPreviewItems ?? [
              { id: "local", name: "YOUR LIVE FRAME", live: cameraReady, mirror: true, dataUrl: null },
              ...activeParticipants
                .filter((participant) => participant.id !== participantIdRef.current)
                .map((participant) => ({
                  id: participant.id,
                  name: `${participantName(participant).toUpperCase()} LIVE FRAME`,
                  live: Boolean(remoteStreamsRef.current.get(participant.id)),
                  mirror: false,
                  dataUrl: null,
                })),
            ];
            return (
              <div
                className="preview-frame"
                style={{
                  transform:"rotate(-0.5deg)",
                  position:"relative",
                  overflow:"hidden",
                  width:"min(100%, 698px)",
                  aspectRatio:"698 / 1230",
                  margin:"0 auto",
                  padding:0,
                  background:liveTemplateStyle.background,
                  border:editorBorder==="WIDE" ? `8px solid ${liveTemplateStyle.border}` : editorBorder==="THIN" ? `2px solid ${liveTemplateStyle.border}` : "0",
                  boxShadow:editorPolaroid ? "0 18px 45px rgba(45,25,20,.28)" : "0 10px 28px rgba(45,25,20,.18)",
                }}
              >
                <TemplateArtworkLayer
                  templateId={selectedTemplate}
                  width={1400}
                  height={Math.round(1400 * 1230 / 698)}
                  participantCount={Math.max(1, activeParticipants.length)}
                  layer="background"
                />

                {/* Every template owns its own slot geometry. Render all of those
                    masks/placeholders first, then place only the streams that exist. */}
                <TemplateArtworkLayer
                  templateId={selectedTemplate}
                  width={1400}
                  height={Math.round(1400 * 1230 / 698)}
                  participantCount={Math.max(1, activeParticipants.length)}
                  layer="slots"
                />

                {previewSlots.map((slot, index) => {
                  const item = previewImageItems[index];
                  if (!item) return null;
                  const left = (slot.x / 1400) * 100;
                  const top = (slot.y / (1400 * 1230 / 698)) * 100;
                  const width = (slot.w / 1400) * 100;
                  const height = (slot.h / (1400 * 1230 / 698)) * 100;
                  const rotation = ((slot.rotation ?? 0) * 180) / Math.PI;
                  return (
                    <div
                      key={item.id}
                      style={{
                        position:"absolute",
                        left:`${left}%`,
                        top:`${top}%`,
                        width:`${width}%`,
                        height:`${height}%`,
                        overflow:"hidden",
                        borderRadius:slot.shape === "ellipse" ? "50%" : slot.radius ? `${Math.min(slot.radius, 28)}px` : "0",
                        transform:`rotate(${rotation}deg)`,
                        transformOrigin:"center center",
                        background:"#171311",
                        zIndex:2,
                      }}
                    >
                      {item.dataUrl ? (
                        <img
                          src={item.dataUrl}
                          alt=""
                          style={{
                            width:"100%",
                            height:"100%",
                            objectFit:"cover",
                            display:"block",
                            filter:
                              editorFilter==="WARM" ? "sepia(.16) saturate(1.12) contrast(1.03)" :
                              editorFilter==="SOFT" ? "saturate(.88) contrast(.92) brightness(1.04)" :
                              editorFilter==="BW" ? "grayscale(1) contrast(1.05)" :
                              editorFilter==="VINTAGE" ? "sepia(.28) saturate(.8) contrast(.92)" :
                              editorFilter==="FADE" ? "saturate(.72) contrast(.86) brightness(1.08)" :
                              editorFilter==="ROSE" ? "sepia(.1) hue-rotate(-8deg) saturate(1.12)" :
                              editorFilter==="DUSK" ? "brightness(.78) saturate(.85) contrast(1.08)" :
                              editorFilter==="GOLD" ? "sepia(.22) saturate(1.2) brightness(1.02)" :
                              editorFilter==="MATTE" ? "contrast(.88) saturate(.82) brightness(1.03)" : "none",
                          }}
                        />
                      ) : (
                        <video
                          ref={(element) => {
                            if (item.id === "local" || item.id === "solo-live") {
                              localPreviewVideoRef.current = element;
                              if (element && localStreamRef.current && element.srcObject !== localStreamRef.current) {
                                element.srcObject = localStreamRef.current;
                                void element.play().catch(() => {});
                              }
                            } else if (element) {
                              remotePreviewVideoRefs.current.set(item.id, element);
                              const remoteStream = remoteStreamsRef.current.get(item.id);
                              if (remoteStream && element.srcObject !== remoteStream) {
                                element.srcObject = remoteStream;
                                void element.play().catch(() => {});
                              }
                            } else {
                              remotePreviewVideoRefs.current.delete(item.id);
                            }
                          }}
                          autoPlay
                          playsInline
                          muted={item.id === "local" || item.id === "solo-live"}
                          style={{
                            width:"100%",
                            height:"100%",
                            objectFit:"cover",
                            display:item.live ? "block" : "none",
                            transform:item.mirror ? "scaleX(-1)" : "none",
                            filter:
                              editorFilter==="WARM" ? "sepia(.16) saturate(1.12) contrast(1.03)" :
                              editorFilter==="SOFT" ? "saturate(.88) contrast(.92) brightness(1.04)" :
                              editorFilter==="BW" ? "grayscale(1) contrast(1.05)" :
                              editorFilter==="VINTAGE" ? "sepia(.28) saturate(.8) contrast(.92)" :
                              editorFilter==="FADE" ? "saturate(.72) contrast(.86) brightness(1.08)" :
                              editorFilter==="ROSE" ? "sepia(.1) hue-rotate(-8deg) saturate(1.12)" :
                              editorFilter==="DUSK" ? "brightness(.78) saturate(.85) contrast(1.08)" :
                              editorFilter==="GOLD" ? "sepia(.22) saturate(1.2) brightness(1.02)" :
                              editorFilter==="MATTE" ? "contrast(.88) saturate(.82) brightness(1.03)" : "none",
                          }}
                        />
                      )}
                      {!item.live && (
                        <span style={{position:"absolute",inset:0,display:"grid",placeItems:"center",color:"#8f8177",fontSize:"8px",letterSpacing:".12em",textAlign:"center"}}>
                          {item.name}
                        </span>
                      )}
                    </div>
                  );
                })}

                <TemplateArtworkLayer
                  templateId={selectedTemplate}
                  width={1400}
                  height={Math.round(1400 * 1230 / 698)}
                  participantCount={Math.max(1, activeParticipants.length)}
                  participantNames={activeParticipants.map((participant) => participantName(participant))}
                  layer="text"
                />

                {editorFrame !== "NONE" && (
                  <div
                    style={{
                      position:"absolute",inset:0,pointerEvents:"none",zIndex:5,
                      border:
                        editorFrame==="DOUBLE" ? "5px double rgba(121,78,70,.72)" :
                        editorFrame==="POSTCARD" ? "12px solid #f5eadb" :
                        editorFrame==="DARK" ? "10px solid #292120" :
                        editorFrame==="FILM" ? "9px solid #171313" :
                        editorFrame==="BLUSH" ? "10px solid #dca9a6" :
                        editorFrame==="LACE" ? "7px solid #f3dfd3" :
                        editorFrame==="ROSE" ? "10px solid #c98986" : "10px solid #ead9c5",
                      boxSizing:"border-box",
                    }}
                  />
                )}

                {editorSticker !== "NONE" && (
                  <span style={{position:"absolute",top:"13px",right:"16px",fontSize:"21px",color:"#fff1e7",textShadow:"0 2px 8px rgba(0,0,0,.35)",zIndex:6}}>
                    {editorSticker==="HEART" ? "♡" : editorSticker==="SPARKLE" ? "✦" : editorSticker==="STAR" ? "★" : "✿"}
                  </span>
                )}

                {editorCaption && (
                  <div
                    style={{
                      position:captionPosition==="OVERLAY" ? "absolute" : "absolute",
                      left:"50%",
                      bottom:captionPosition==="TOP" ? undefined : "18px",
                      top:captionPosition==="TOP" ? "18px" : undefined,
                      transform:"translateX(-50%)",
                      width:"88%",
                      textAlign:"center",
                      padding:"9px 12px",
                      color:captionColor==="CREAM" ? "#f7eadb" : captionColor==="INK" ? "#4b3934" : captionColor==="WHITE" ? "#fff" : "#c98282",
                      fontFamily:captionFont==="SCRIPT" ? "cursive" : captionFont==="SANS" ? "Arial,sans-serif" : captionFont==="MONO" ? "monospace" : "Georgia,serif",
                      fontSize:"15px",
                      zIndex:6,
                      textShadow:"0 2px 10px rgba(0,0,0,.35)",
                    }}
                  >
                    {captionText || "You, Me & Every Moment ♡"}
                  </div>
                )}

                {editorDateStamp && (
                  <small style={{position:"absolute",right:"14px",bottom:"10px",color:"#f4e8dc",fontSize:"7px",letterSpacing:".08em",zIndex:7}}>
                    {new Date().toLocaleDateString(undefined,{day:"2-digit",month:"2-digit",year:"numeric"})}
                  </small>
                )}

                {editorPolaroid && (
                  <div style={{position:"absolute",left:0,right:0,bottom:"12px",textAlign:"center",color:"#6f514a",font:"600 12px Georgia,serif",zIndex:7}}>
                    {editorCaption ? captionText || "You, Me & Every Moment ♡" : "♡"}
                  </div>
                )}
              </div>
            );
          })()}

          <p style={{textAlign:"center",margin:"12px 0 0",color:"#8f8177",fontSize:"8px",letterSpacing:".08em"}}>
            ✦ LIVE — your selections will carry into the final photo
          </p>

          {/* PRE-CAPTURE STYLE CONTROLS */}
          <div style={{marginTop:"18px",padding:"14px 16px",border:"1px solid rgba(215,195,180,.28)",borderRadius:"16px",background:"rgba(255,248,239,.025)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",marginBottom:"10px"}}>
              <span style={{fontSize:"8px",letterSpacing:".16em",fontWeight:800,color:"#c9bba8"}}>✦ PHOTO STYLE</span>
              <span style={{fontSize:"8px",letterSpacing:".08em",color:"#8f8177"}}>
                {participantPlanLabel} ACCESS · LIVE BEFORE CAPTURE
              </span>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:"8px"}}>
              <EditorSelect
                label="TEMPLATE"
                value={
                  BOOTH_TEMPLATES.find(
                    ([id]) => id === selectedTemplate
                  )?.[1] ?? "Classic Strip"
                }
                onClick={() => setTemplatePickerOpen(true)}
              />

              <EditorSelect
                label="LAYOUT"
                value={editorLayout}
                onClick={() =>
                  setEditorLayout(
                    editorLayout === "JOINED"
                      ? "STACKED"
                      : editorLayout === "STACKED"
                        ? "GRID"
                        : editorLayout === "GRID"
                          ? "FILM"
                          : editorLayout === "FILM"
                            ? "STRIP"
                            : "JOINED"
                  )
                }
              />

              <EditorSelect
                label="FRAME"
                value={editorFrame}
                onClick={() =>
                  setEditorFrame(
                    editorFrame === "CREAM"
                      ? "ROSE"
                      : editorFrame === "ROSE"
                        ? "FILM"
                        : editorFrame === "FILM"
                          ? "DARK"
                          : editorFrame === "DARK"
                            ? "BLUSH"
                            : editorFrame === "BLUSH"
                              ? "LACE"
                              : editorFrame === "LACE"
                                ? "DOUBLE"
                                : editorFrame === "DOUBLE"
                                  ? "POSTCARD"
                                  : editorFrame === "POSTCARD"
                                    ? "NONE"
                                    : "CREAM"
                  )
                }
              />

              <EditorSelect
                label="FILTER"
                value={editorFilter}
                onClick={() =>
                  setEditorFilter(
                    editorFilter === "SOFT"
                      ? "WARM"
                      : editorFilter === "WARM"
                        ? "VINTAGE"
                        : editorFilter === "VINTAGE"
                          ? "FADE"
                          : editorFilter === "FADE"
                            ? "ROSE"
                            : editorFilter === "ROSE"
                              ? "DUSK"
                              : editorFilter === "DUSK"
                                ? "GOLD"
                                : editorFilter === "GOLD"
                                  ? "MATTE"
                                  : editorFilter === "MATTE"
                                    ? "BW"
                                    : "SOFT"
                  )
                }
              />

              <EditorSelect
                label="FACE EFFECT"
                value={localFaceEffectName}
                onClick={() => setFaceEffectPickerOpen(true)}
              />

              <EditorSelect
                label="BACKGROUND"
                value={canUsePlusFeatures ? editorBackground : "PLUS"}
                onClick={() => {
                  if (!canUsePlusFeatures) return;
                  setEditorBackground(
                    editorBackground === "CREAM"
                      ? "BLUSH"
                      : editorBackground === "BLUSH"
                        ? "PAPER"
                        : editorBackground === "PAPER"
                          ? "DUSK"
                          : "CREAM"
                  );
                }}
              />

              <EditorSelect
                label="SPACING"
                value={canUsePlusFeatures ? editorSpacing : "PLUS"}
                onClick={() => {
                  if (!canUsePlusFeatures) return;
                  setEditorSpacing(
                    editorSpacing === "TIGHT" ? "RELAXED" : "TIGHT"
                  );
                }}
              />

              <EditorSelect
                label="BORDER"
                value={canUsePlusFeatures ? editorBorder : "PLUS"}
                onClick={() => {
                  if (!canUsePlusFeatures) return;
                  setEditorBorder(
                    editorBorder === "THIN"
                      ? "WIDE"
                      : editorBorder === "WIDE"
                        ? "NONE"
                        : "THIN"
                  );
                }}
              />

              <EditorSelect
                label="STICKER"
                value={canUsePlusFeatures ? editorSticker : "PLUS"}
                onClick={() => {
                  if (!canUsePlusFeatures) return;
                  setEditorSticker(
                    editorSticker === "NONE"
                      ? "HEART"
                      : editorSticker === "HEART"
                        ? "SPARKLE"
                        : editorSticker === "SPARKLE"
                          ? "STAR"
                          : editorSticker === "STAR"
                            ? "FLOWER"
                            : "NONE"
                  );
                }}
              />

              <EditorSelect
                label="DATE STAMP"
                value={canUsePlusFeatures ? (editorDateStamp ? "ON" : "OFF") : "PLUS"}
                onClick={() => {
                  if (!canUsePlusFeatures) return;
                  setEditorDateStamp((value) => !value);
                }}
              />

              <EditorSelect
                label="POLAROID"
                value={canUsePlusFeatures ? (editorPolaroid ? "ON" : "OFF") : "PLUS"}
                onClick={() => {
                  if (!canUsePlusFeatures) return;
                  setEditorPolaroid((value) => !value);
                }}
              />
            </div>

            <div className="caption-controls-grid">
              <label style={{display:"grid",gap:"5px"}}>
                <span style={{fontSize:"7px",letterSpacing:".13em",fontWeight:800,color:"#c9bba8"}}>CUSTOM CAPTION</span>
                <input value={captionText} maxLength={80} onChange={(e)=>{setCaptionText(e.target.value);setEditorCaption(Boolean(e.target.value.trim()));}} placeholder="Write your caption..." style={{height:"42px",borderRadius:"12px",border:"1px solid #d7c3b4",background:"#fff8ef",color:"#624640",padding:"0 12px",outline:"none"}}/>
              </label>
              <EditorSelect
                label="FONT"
                value={canUsePlusFeatures ? captionFont : "PLUS"}
                onClick={() => {
                  if (!canUsePlusFeatures) return;
                  setCaptionFont(
                    captionFont === "SERIF"
                      ? "SCRIPT"
                      : captionFont === "SCRIPT"
                        ? "SANS"
                        : captionFont === "SANS"
                          ? "MONO"
                          : "SERIF"
                  );
                }}
              />

              <EditorSelect
                label="CAPTION POSITION"
                value={canUsePlusFeatures ? captionPosition : "PLUS"}
                onClick={() => {
                  if (!canUsePlusFeatures) return;
                  setCaptionPosition(
                    captionPosition === "BOTTOM"
                      ? "TOP"
                      : captionPosition === "TOP"
                        ? "OVERLAY"
                        : "BOTTOM"
                  );
                }}
              />

              <EditorSelect
                label="CAPTION COLOR"
                value={canUsePlusFeatures ? captionColor : "PLUS"}
                onClick={() => {
                  if (!canUsePlusFeatures) return;
                  setCaptionColor(
                    captionColor === "ROSE"
                      ? "CREAM"
                      : captionColor === "CREAM"
                        ? "INK"
                        : captionColor === "INK"
                          ? "WHITE"
                          : "ROSE"
                  );
                }}
              />
            </div>
          </div>

          {/* =================================================
              CAPTURE STATUS
          ================================================= */}

          {captureReady && (
            <div
              style={{
                marginTop:
                  "18px",

                color:
                  "#d45b60",

                fontSize:
                  "8px",

                letterSpacing:
                  "0.14em",
              }}
            >
              ✦ {captures.length} FRAME{captures.length === 1 ? "" : "S"} CAPTURED TOGETHER ♡
            </div>
          )}
        </section>
      </section>

      {/* =====================================================
          TEMPLATE PICKER
      ===================================================== */}

      {templatePickerOpen && (
        <div
          className="template-picker-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setTemplatePickerOpen(false)}
        >
          <div
            className="template-picker"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="template-picker-head">
              <div>
                <span className="template-picker-eyebrow">
                  ✦ PHOTO TEMPLATE
                </span>
                <h3>Choose your look.</h3>
                <p>
                  Pick a design before you capture. Your choice will shape the final photo.
                </p>
              </div>

              <button
                type="button"
                className="template-picker-close"
                onClick={() => setTemplatePickerOpen(false)}
                aria-label="Close templates"
              >
                ×
              </button>
            </div>

            <div className="template-picker-section-head">
              <span>✦ {templatePeopleCount === 1 ? "SOLO" : templatePeopleCount + " PEOPLE"} TEMPLATES</span>
              <small>
                  {boothType === "SOLO"
                    ? "Solo mode fills every photo hole one shot at a time."
                    : "Only designs with the exact matching number of photo holes are shown."}
                </small>
            </div>

            <div className="template-picker-grid">
              {BOOTH_TEMPLATES
                .filter(([id]) =>
                  boothType === "SOLO"
                    ? true
                    : getTemplatePhotoSlotCount(id) === templatePeopleCount
                )
                .map(
                ([id, name, tag]) => (
                  <button
                    type="button"
                    key={id}
                    disabled={!canUseTemplate(id)}
                    className={`template-choice${
                      selectedTemplate === id
                        ? " is-selected"
                        : ""
                    }${
                      canUseTemplate(id)
                        ? ""
                        : " is-locked"
                    }`}
                    style={{
                      borderColor:
                        selectedTemplate === id
                          ? getTemplateStyle(id).accent
                          : getTemplateStyle(id).border,
                      background:
                        `linear-gradient(145deg, ${getTemplateStyle(id).background}, #17100f)`,
                      opacity: canUseTemplate(id) ? 1 : 0.48,
                      cursor: canUseTemplate(id) ? "pointer" : "not-allowed",
                    }}
                    onClick={() => {
                      if (!canUseTemplate(id)) return;
                      setSelectedTemplate(id);
                      // A SOLO template change changes the required number and
                      // geometry of sequential shots, so never carry old shots
                      // into a new template.
                      if (boothType === "SOLO") {
                        soloShotsRef.current = [];
                        setCaptures([]);
                        setLocalCapture(null);
                        setRemoteCapture(null);
                        setCaptureReady(false);
                        setSharedFinalPhoto(null);
                        setEditorOpen(false);
                        setSaveOpen(false);
                        setCaptureStatus("SOLO TEMPLATE READY ♡");
                      }
                      setTemplatePickerOpen(false);
                    }}
                  >
                    <span className="template-choice-preview">
                      <TemplateThumbnail
                        templateId={id}
                        className="template-choice-thumbnail"
                      />
                      <span className="template-choice-status">
                        {canUseTemplate(id)
                          ? selectedTemplate === id
                            ? "✓"
                            : ""
                          : "🔒"}
                      </span>
                    </span>

                    <strong>{name}</strong>

                    <small>
                      {tag} · {getTemplateRequiredPlan(id)}
                    </small>
                  </button>
                )
              )}
            </div>
            {BOOTH_TEMPLATES.filter(
              ([id]) =>
                boothType === "SOLO"
                  ? true
                  : getTemplatePhotoSlotCount(id) === templatePeopleCount
            ).length === 0 && (
              <div className="template-picker-empty">
                New {templatePeopleCount === 1 ? "solo" : templatePeopleCount + "-person"} designs will appear here.
              </div>
            )}
          </div>
        </div>
      )}

      {faceEffectPickerOpen && (
        <div
          className="template-picker-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setFaceEffectPickerOpen(false)}
        >
          <div className="template-picker" onClick={(event) => event.stopPropagation()}>
            <div className="template-picker-head">
              <div>
                <span className="template-picker-eyebrow">✦ YOUR FACE EFFECT</span>
                <h3>Make it yours.</h3>
                <p>This choice is local to your camera. Everyone in the room can pick their own effect.</p>
              </div>
              <button type="button" className="template-picker-close" onClick={() => setFaceEffectPickerOpen(false)} aria-label="Close face effects">×</button>
            </div>

            <div className="template-picker-grid">
              {FACE_EFFECTS.map((effect) => {
                const allowed = canUseFaceEffect(effect.id);
                return (
                  <button
                    type="button"
                    key={effect.id}
                    disabled={!allowed}
                    className={`template-choice${localFaceEffect === effect.id ? " is-selected" : ""}${allowed ? "" : " is-locked"}`}
                    style={{
                      borderColor: localFaceEffect === effect.id ? "#c86d69" : "#8b6d60",
                      background: "linear-gradient(145deg,#3a2520,#17100f)",
                      opacity: allowed ? 1 : 0.48,
                      cursor: allowed ? "pointer" : "not-allowed",
                    }}
                    onClick={() => {
                      if (!allowed) return;
                      setLocalFaceEffect(effect.id);
                      setFaceEffectPickerOpen(false);
                    }}
                  >
                    <span className="template-choice-mark" style={{ background: "#c86d69", color: "#fff7ee" }}>
                      {allowed ? (localFaceEffect === effect.id ? "✓" : "✦") : "🔒"}
                    </span>
                    <strong>{effect.name}</strong>
                    <small>{effect.description} · {effect.plan}</small>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          PHOTO EDITOR
      ===================================================== */}

      {editorOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setEditorOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(24, 15, 14, 0.82)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(940px, 96vw)",
              maxHeight: "92vh",
              overflow: "auto",
              borderRadius: "24px",
              background: "#f4eadb",
              color: "#3a2925",
              padding: "22px",
              boxShadow: "0 30px 100px rgba(0,0,0,.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "9px",
                    letterSpacing: ".18em",
                    fontWeight: 800,
                    color: "#9c6860",
                  }}
                >
                  ✦ YOUR LITTLE MOMENT
                </div>
                <h2
                  style={{
                    margin: "7px 0 0",
                    fontFamily: "Georgia, serif",
                    fontWeight: 400,
                    fontSize: "30px",
                  }}
                >
                  Review your moment.
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                style={{
                  border: "1px solid #d7c3b4",
                  background: "#fff8ef",
                  color: "#76534c",
                  borderRadius: "999px",
                  width: "38px",
                  height: "38px",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
                aria-label="Close editor"
              >
                ×
              </button>
            </div>

            {/* EDITED PREVIEW: use the exact same final renderer as export/save. */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "10px 0 22px",
              }}
            >
              <div style={{ width: "min(720px, 100%)" }}>
                <TemplateRenderPreview
                  captures={captures}
                  options={{
                    layout: editorLayout,
                    filter: editorFilter,
                    caption: editorCaption,
                    captionText,
                    captionFont,
                    captionPosition,
                    captionColor,
                    polaroid: editorPolaroid,
                    border: editorBorder,
                    spacing: editorSpacing,
                    dateStamp: editorDateStamp,
                    sticker: editorSticker,
                    background: editorBackground,
                    frame: editorFrame,
                    selectedTemplate,
                    participantNames: captures.map((capture) => capture.name),
                  }}
                  style={liveTemplateStyle}
                  alt="Selected template preview"
                />
              </div>
            </div>

            {/* EDITOR OPTIONS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "9px",
              }}
            >
              <EditorOption
                label="TEMPLATE LAYOUT"
                value="LOCKED TO TEMPLATE"
                disabled
                onClick={() => {}}
              />

              <EditorOption
                label="FRAME"
                value={editorFrame}
                onClick={() =>
                  setEditorFrame(
                    editorFrame === "CREAM"
                      ? "ROSE"
                      : editorFrame === "ROSE"
                        ? "FILM"
                        : editorFrame === "FILM"
                          ? "NONE"
                          : "CREAM"
                  )
                }
              />

              <EditorOption
                label="FILTER"
                value={editorFilter}
                onClick={() =>
                  setEditorFilter(
                    editorFilter === "SOFT"
                      ? "WARM"
                      : editorFilter === "WARM"
                        ? "BW"
                        : editorFilter === "BW"
                          ? "NONE"
                          : "SOFT"
                  )
                }
              />

              <EditorOption
                label="CAPTION"
                value={editorCaption ? "ON" : "OFF"}
                onClick={() =>
                  setEditorCaption((value) => !value)
                }
              />

              <EditorOption
                label="POLAROID"
                value={
                  canUsePlusFeatures
                    ? editorPolaroid
                      ? "ON"
                      : "OFF"
                    : "PLUS"
                }
                onClick={() => {
                  if (!canUsePlusFeatures) return;
                  setEditorPolaroid((value) => !value);
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "9px",
                marginTop: "18px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                style={{
                  minHeight: "44px",
                  padding: "0 18px",
                  borderRadius: "999px",
                  border: "1px solid #cdb7a8",
                  background: "transparent",
                  color: "#76534c",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "9px",
                  letterSpacing: ".1em",
                }}
              >
                KEEP EDITING
              </button>

              <button
                type="button"
                disabled={captures.length < (boothType === "SOLO" ? 1 : 2)}
                onClick={() => {
                  if (captures.length >= (boothType === "SOLO" ? 1 : 2)) {
                    setSaveOpen(true);
                  }
                }}
                style={{
                  minHeight: "44px",
                  padding: "0 22px",
                  borderRadius: "999px",
                  border: "0",
                  background: "#a9635e",
                  color: "#fff8ef",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: "9px",
                  letterSpacing: ".1em",
                  opacity: captures.length >= (boothType === "SOLO" ? 1 : 2) ? 1 : 0.45,
                }}
              >
                {captures.length >= (boothType === "SOLO" ? 1 : 2)
                  ? "SAVE THIS MOMENT ♡"
                  : "PREPARING CAMERAS..."}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          SAVE POPUP
      ===================================================== */}

      {saveOpen &&
        captureReady &&
        captures.length >= (boothType === "SOLO" ? 1 : 2) && (
        <SavePhotoPopup
          captures={captures}
          preRenderedPhotoDataUrl={sharedFinalPhoto ?? undefined}
          localCapture={localCapture ?? captures[0].dataUrl}
          remoteCapture={remoteCapture ?? captures[1].dataUrl}
          layout={editorLayout}
          filter={editorFilter}
          caption={editorCaption}
          captionText={captionText}
          captionFont={captionFont}
          captionPosition={captionPosition}
          captionColor={captionColor}
          polaroid={editorPolaroid}
          border={editorBorder}
          spacing={editorSpacing}
          dateStamp={editorDateStamp}
          sticker={editorSticker}
          background={editorBackground}
          frame={editorFrame}
          selectedTemplate={selectedTemplate}
          participantNames={captures.map((capture) => capture.name)}
          participantCount={boothType === "SOLO" ? 1 : activeParticipants.length}
          sessionId={sessionId}
          saving={savingPhoto}
          setSaving={setSavingPhoto}
          onClose={() => setSaveOpen(false)}
        />
      )}
    </main>
  );
}

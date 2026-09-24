"use client";

import { useState } from "react";

type CameraShutterProps = {
  enabled: boolean;
  busy?: boolean;
  onCapture: () => void | Promise<void>;
};

export default function CameraShutter({
  enabled,
  busy = false,
  onCapture,
}: CameraShutterProps) {
  const [pressed, setPressed] = useState(false);

  async function handleClick() {
    if (!enabled || busy) return;

    setPressed(true);
    try {
      await onCapture();
    } finally {
      window.setTimeout(() => setPressed(false), 180);
    }
  }

  return (
    <div className="camera-shutter">
      <button
        type="button"
        className={`camera-shutter-button${pressed ? " is-pressed" : ""}`}
        onClick={handleClick}
        disabled={!enabled || busy}
        aria-label="Take photo"
      >
        <span className="camera-shutter-ring" />
        <span className="camera-shutter-core" />
      </button>

      <small className="camera-shutter-label">
        {busy
          ? "CAPTURING..."
          : enabled
            ? "TAKE PHOTO"
            : "WAITING FOR BOTH CAMERAS"}
      </small>
    </div>
  );
}

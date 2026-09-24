"use client";

import { useState } from "react";

type Props = {
  onFinish: () => void;
};

export default function WelcomeGuide({ onFinish }: Props) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      number: "01",
      title: "Create a booth",
      text: "Choose Solo when you want to take multiple shots yourself, or create a shared booth for friends.",
      icon: "✦",
    },
    {
      number: "02",
      title: "Connect & capture",
      text: "Open the booth, allow your camera, and invite the people joining you. Every shutter click creates a new moment.",
      icon: "◉",
    },
    {
      number: "03",
      title: "Make it yours",
      text: "Pick a template, review your photos, and add your own captions and edits.",
      icon: "✎",
    },
    {
      number: "04",
      title: "Keep the memory",
      text: "Save your finished photo to Memories or download it whenever you're ready.",
      icon: "♡",
    },
  ];

  const current = steps[step];
  const last = step === steps.length - 1;

  return (
    <div className="welcome-guide-backdrop" role="presentation">
      <section
        className="welcome-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-guide-title"
      >
        <button
          type="button"
          className="welcome-guide-close"
          onClick={onFinish}
          aria-label="Close welcome guide"
        >
          ×
        </button>

        <div className="welcome-guide-orb" aria-hidden="true">
          {current.icon}
        </div>

        <p className="welcome-guide-eyebrow">✦ WELCOME TO USBOOTH ✦</p>

        <div className="welcome-guide-progress" aria-hidden="true">
          {steps.map((item, index) => (
            <span
              key={item.number}
              className={index <= step ? "active" : ""}
            />
          ))}
        </div>

        <span className="welcome-guide-number">{current.number}</span>
        <h2 id="welcome-guide-title">{current.title}</h2>
        <p className="welcome-guide-text">{current.text}</p>

        <div className="welcome-guide-actions">
          {step > 0 && (
            <button
              type="button"
              className="welcome-guide-secondary"
              onClick={() => setStep((value) => value - 1)}
            >
              BACK
            </button>
          )}

          <button
            type="button"
            className="welcome-guide-primary"
            onClick={() => (last ? onFinish() : setStep((value) => value + 1))}
          >
            {last ? "LET'S MAKE ONE ↗" : "NEXT →"}
          </button>
        </div>

        {!last && (
          <button
            type="button"
            className="welcome-guide-skip"
            onClick={onFinish}
          >
            Skip guide
          </button>
        )}
      </section>
    </div>
  );
}

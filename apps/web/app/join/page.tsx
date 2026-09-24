"use client";

import "./join.css";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type User = {
  id: string;
  email: string;
  displayName: string;
  username?: string | null;
};

type Booth = {
  id: string;
  name: string;
  roomCode: string;
  type: "COUPLE" | "RANDOM";
};

export default function JoinPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();

      if (data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setCheckingSession(false);
    }
  }

  function formatRoomCode(value: string) {
    const cleaned = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

    const withoutPrefix = cleaned.startsWith("USB")
      ? cleaned.slice(3)
      : cleaned;

    const code = withoutPrefix.slice(0, 8);

    if (code.length <= 4) {
      return `USB-${code}`;
    }

    return `USB-${code.slice(0, 4)}-${code.slice(4)}`;
  }

  function handleCodeChange(value: string) {
    setError("");
    setRoomCode(formatRoomCode(value));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (joining) return;

    setError("");

    const code = roomCode.trim().toUpperCase();

    if (!/^USB-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
      setError("Please enter a valid booth code like USB-ABCD-EFGH.");
      return;
    }

    try {
      setJoining(true);

      const response = await fetch("/api/booths/join", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomCode: code,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error || "We couldn't find that booth."
        );
      }

      const booth: Booth | undefined = data?.booth;

      if (!booth?.id) {
        throw new Error(
          "The booth was found, but no booth ID was returned."
        );
      }

      const sessionResponse = await fetch(
        `/api/booths/${booth.id}/session`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            guestName: guestName.trim(),
          }),
        }
      );

      const sessionData = await sessionResponse
        .json()
        .catch(() => ({}));

      if (!sessionResponse.ok) {
        throw new Error(
          sessionData?.error || "Unable to join this booth."
        );
      }

      window.location.href = `/booth/${booth.id}`;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to join the booth."
      );
    } finally {
      setJoining(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="join-page">
        <div className="join-loading">
          <div className="join-loading-logo">
            USBOOTH<span>♥</span>
          </div>

          <div className="join-loading-line" />

          <p>Checking your space...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="join-page">
      <div className="join-shell">
        <header className="join-header">
          <Link href="/" className="join-logo">
            USBOOTH<span>♥</span>
          </Link>

          <Link href="/" className="join-back">
            BACK TO HOME
          </Link>
        </header>

        <section className="join-content">
          <div className="join-intro">
            <p className="join-eyebrow">
              ✦ &nbsp; JOIN A BOOTH &nbsp; ✦
            </p>

            <h1>
              Someone saved
              <br />
              <em>a place for you.</em>
            </h1>

            <p className="join-description">
              Enter the booth code they shared with you
              and jump straight into the moment.
            </p>

            {user ? (
              <div className="join-account-note">
                <span>●</span>

                <div>
                  <strong>You're signed in.</strong>

                  <small>
                    Joining as {user.displayName || user.email}
                  </small>
                </div>
              </div>
            ) : (
              <div className="join-account-note guest">
                <span>♡</span>

                <div>
                  <strong>No account required.</strong>

                  <small>
                    You can join this booth as a guest.
                  </small>
                </div>
              </div>
            )}
          </div>

          <form
            className="join-form"
            onSubmit={handleSubmit}
          >
            {!user && (
              <div className="join-code-field join-guest-name-field">
                <label htmlFor="guest-name">YOUR NAME</label>
                <input
                  id="guest-name"
                  type="text"
                  autoComplete="name"
                  maxLength={40}
                  value={guestName}
                  onChange={(event) => {
                    setGuestName(event.target.value);
                    setError("");
                  }}
                  placeholder="What should we call you?"
                  disabled={joining}
                />
                <small>This name is shown to the other people in the booth.</small>
              </div>
            )}

            <div className="join-code-field">
              <label htmlFor="room-code">
                BOOTH CODE
              </label>

              <input
                id="room-code"
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                maxLength={13}
                value={roomCode}
                onChange={(event) =>
                  handleCodeChange(event.target.value)
                }
                placeholder="USB-ABCD-EFGH"
                disabled={joining}
              />

              <small>
                Your friend should have shared an
                <strong> USB-XXXX-XXXX </strong>
                code with you.
              </small>
            </div>

            {error && (
              <div className="join-error">
                <span>!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="join-submit"
              disabled={joining}
            >
              {joining
                ? "OPENING BOOTH..."
                : "JOIN BOOTH  ↗"}
            </button>

            <p className="join-footnote">
              {user
                ? "You'll join using your UsBooth account."
                : "No sign-up or password needed to join as a guest."}
            </p>
          </form>
        </section>

        <section className="join-how">
          <div className="join-how-label">
            ✦ &nbsp; HOW IT WORKS &nbsp; ✦
          </div>

          <div className="join-steps">
            <div className="join-step">
              <span>01</span>
              <strong>Get the code.</strong>
              <p>
                Your friend creates a booth and
                shares their code with you.
              </p>
            </div>

            <div className="join-step">
              <span>02</span>
              <strong>Enter it here.</strong>
              <p>
                Type the eight characters exactly
                as they were shared.
              </p>
            </div>

            <div className="join-step">
              <span>03</span>
              <strong>Make the moment.</strong>
              <p>
                Turn on your camera and get ready
                for your photo together.
              </p>
            </div>
          </div>
        </section>

        <footer className="join-footer">
          <span>USBOOTH · TWO PHONES. ONE MOMENT.</span>
          <span>© 2026</span>
        </footer>
      </div>
    </main>
  );
}

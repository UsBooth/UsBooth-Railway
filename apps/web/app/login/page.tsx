"use client";

import "./login.css";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  function getSafeNext() {
    if (typeof window === "undefined") return "/";
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  async function checkExistingSession() {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();

      if (data?.user) {
        window.location.replace(getSafeNext());
        return;
      }
    } catch {
      // Allow login if session checking fails.
    } finally {
      setCheckingSession(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to sign in."
        );
      }

      window.location.replace(getSafeNext());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="login-page">
        <div className="login-loading">
          <div className="login-brand">
            USBOOTH<span>♥</span>
          </div>

          <div className="login-loading-line" />

          <p>Checking your space...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page">
      <div className="login-shell">
        <header className="login-header">
          <Link
            href="/"
            className="login-logo"
          >
            USBOOTH<span>♥</span>
          </Link>

          <Link
            href="/"
            className="back-link"
          >
            BACK TO HOME
          </Link>
        </header>

        <section className="login-content">
          <div className="login-intro">
            <p className="login-eyebrow">
              ✦ &nbsp; WELCOME BACK &nbsp; ✦
            </p>

            <h1>
              Come back to
              <br />
              <em>your moments.</em>
            </h1>

            <p className="login-description">
              Sign in to open your booths,
              <br />
              memories and little spaces together.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            <div className="form-field">
              <label htmlFor="email">
                EMAIL
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">
                PASSWORD
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Your password"
                disabled={loading}
              />
            </div>

            <div className="forgot-password-link-wrap">
              <Link
                href="/forgot-password"
                className="forgot-password-link"
              >
                FORGOT PASSWORD?
              </Link>
            </div>

            {error && (
              <div className="login-error">
                <span>!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading
                ? "SIGNING YOU IN..."
                : "SIGN IN  ↗"}
            </button>

            <p className="register-prompt">
              Don't have a UsBooth account?
              <br />

              <Link href="/register">
                CREATE ONE
              </Link>
            </p>
          </form>
        </section>

        <footer className="login-footer">
          <span>
            USBOOTH · FOUNDATION
          </span>

          <span>
            TWO PHONES. ONE MOMENT.
          </span>

          <span>
            © 2026
          </span>
        </footer>
      </div>
    </main>
  );
}

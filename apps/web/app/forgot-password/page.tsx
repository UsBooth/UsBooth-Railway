"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import "./forgot-password.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError(
        "Enter the email address you used for UsBooth."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to send the reset email."
        );
      }

      setMessage(data.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send the reset email."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="forgot-password-page">
      <div className="forgot-password-shell">
        <header className="forgot-password-header">
          <Link
            href="/"
            className="forgot-password-logo"
          >
            USBOOTH<span>♥</span>
          </Link>

          <Link
            href="/login"
            className="forgot-password-back"
          >
            BACK TO LOGIN
          </Link>
        </header>

        <section className="forgot-password-content">
          <div className="forgot-password-intro">
            <p className="forgot-password-eyebrow">
              ✦ &nbsp; ACCOUNT RECOVERY &nbsp; ✦
            </p>

            <h1>
              Come back to
              <br />
              <em>your moments.</em>
            </h1>

            <p>
              Enter the email linked to your
              UsBooth account and we'll send you
              a secure password reset link.
            </p>
          </div>

          <form
            className="forgot-password-form"
            onSubmit={handleSubmit}
          >
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
              autoFocus
            />

            {error && (
              <div className="forgot-password-error">
                ! &nbsp; {error}
              </div>
            )}

            {message && (
              <div className="forgot-password-success">
                ✓ &nbsp; {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "SENDING..."
                : "SEND RESET LINK  ↗"}
            </button>

            <p className="forgot-password-login">
              Remember your password?{" "}
              <Link href="/login">
                BACK TO LOGIN
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import "./reset-password.css";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    setToken(
      params.get("token") || ""
    );
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!token) {
      setError(
        "This reset link is missing its token."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Your new password must be at least 8 characters."
      );
      return;
    }

    if (
      password !== confirmPassword
    ) {
      setError(
        "The passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/auth/reset-password",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to reset your password."
        );
      }

      setMessage(data.message);

      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset your password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="reset-password-page">
      <div className="reset-password-shell">

        <header className="reset-password-header">

          <Link
            href="/"
            className="reset-password-logo"
          >
            USBOOTH<span>♥</span>
          </Link>

          <Link
            href="/login"
            className="reset-password-back"
          >
            BACK TO LOGIN
          </Link>

        </header>

        <section className="reset-password-content">

          <div className="reset-password-intro">

            <p className="reset-password-eyebrow">
              ✦ &nbsp; NEW PASSWORD &nbsp; ✦
            </p>

            <h1>
              Make a fresh
              <br />
              <em>start.</em>
            </h1>

            <p>
              Choose a new password for your
              UsBooth account. You'll be able
              to sign in normally afterwards.
            </p>

          </div>

          <form
            className="reset-password-form"
            onSubmit={handleSubmit}
          >

            <label htmlFor="password">
              NEW PASSWORD
            </label>

            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="At least 8 characters"
              disabled={
                loading || !!message
              }
            />

            <label htmlFor="confirmPassword">
              CONFIRM PASSWORD
            </label>

            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Enter it again"
              disabled={
                loading || !!message
              }
            />

            {error && (
              <div className="reset-password-error">
                ! &nbsp; {error}
              </div>
            )}

            {message && (
              <div className="reset-password-success">
                ✓ &nbsp; {message}
              </div>
            )}

            {!message && (
              <button
                type="submit"
                disabled={
                  loading || !token
                }
              >
                {loading
                  ? "RESETTING..."
                  : "RESET PASSWORD  ↗"}
              </button>
            )}

            {message && (
              <Link
                href="/login"
                className="reset-password-login-button"
              >
                GO TO LOGIN  ↗
              </Link>
            )}

          </form>

        </section>

      </div>
    </main>
  );
}

"use client";

import "./register.css";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import WelcomeGuide from "../../components/WelcomeGuide";

export default function RegisterPage() {
  const [displayName, setDisplayName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [showWelcomeGuide, setShowWelcomeGuide] =
    useState(false);

  useEffect(() => {
    checkExistingSession();
  }, []);

  async function checkExistingSession() {
    try {
      const response = await fetch(
        "/api/auth/me",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return;
      }

      const data =
        await response.json();

      if (data?.user) {
        window.location.replace(
          "/account"
        );
        return;
      }
    } catch {
      // Allow registration if session
      // checking fails.
    } finally {
      setCheckingSession(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const cleanName =
      displayName.trim();

    const cleanEmail =
      email.trim();

    if (
      !cleanName ||
      !cleanEmail ||
      !password ||
      !confirmPassword
    ) {
      setError(
        "Please fill in every field."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Your passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await fetch(
          "/api/auth/register",
          {
            method: "POST",
            credentials:
              "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              displayName:
                cleanName,
              email:
                cleanEmail,
              password,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to create your account."
        );
      }

      /*
       * The registration API creates
       * the session automatically.
       *
       * Send the new user directly
       * to their account.
       */

      setShowWelcomeGuide(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="register-page">
        <div className="register-loading">
          <div className="register-brand">
            USBOOTH<span>♥</span>
          </div>

          <div className="register-loading-line" />

          <p>
            Preparing your space...
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="register-page">
      <div className="register-shell">
        <header className="register-header">
          <Link
            href="/"
            className="register-logo"
          >
            USBOOTH<span>♥</span>
          </Link>

          <Link
            href="/login"
            className="register-login-link"
          >
            ALREADY HAVE AN ACCOUNT?
            <strong>
              &nbsp; LOG IN
            </strong>
          </Link>
        </header>

        <section className="register-content">
          <div className="register-intro">
            <p className="register-eyebrow">
              ✦ &nbsp; YOUR SPACE STARTS
              HERE &nbsp; ✦
            </p>

            <h1>
              Keep your
              <br />
              <em>moments close.</em>
            </h1>

            <p className="register-description">
              Create your UsBooth account
              <br />
              and start making memories
              together.
            </p>

            <div className="register-note">
              <span>♡</span>

              <p>
                Your account lets you
                create booths, join rooms
                and keep your memories in
                one place.
              </p>
            </div>
          </div>

          <form
            className="register-form"
            onSubmit={handleSubmit}
          >
            <div className="form-field">
              <label htmlFor="displayName">
                DISPLAY NAME
              </label>

              <input
                id="displayName"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(event) =>
                  setDisplayName(
                    event.target.value
                  )
                }
                placeholder="What should we call you?"
                disabled={loading}
                maxLength={80}
              />
            </div>

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
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">
                PASSWORD
              </label>

              <div className="password-wrap">
                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Create a password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  disabled={loading}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword">
                CONFIRM PASSWORD
              </label>

              <div className="password-wrap">
                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={
                    confirmPassword
                  }
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter it again"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                  aria-pressed={showConfirmPassword}
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                  disabled={loading}
                >
                  {showConfirmPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && (
              <div className="register-error">
                <span>!</span>

                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="register-submit"
              disabled={loading}
            >
              {loading
                ? "CREATING YOUR SPACE..."
                : "CREATE ACCOUNT  ↗"}
            </button>

            <p className="register-terms">
              By creating an account,
              you agree to use UsBooth
              responsibly and respectfully.
            </p>
          </form>
        </section>

        <footer className="register-footer">
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

      {showWelcomeGuide && (
        <WelcomeGuide
          onFinish={() => window.location.replace("/account")}
        />
      )}
    </>
  );
}

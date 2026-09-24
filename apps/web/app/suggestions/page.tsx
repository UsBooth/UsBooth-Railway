"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import styles from "./suggestions.module.css";

const suggestionTypes = [
  {
    id: "feature",
    number: "01",
    icon: "✦",
    title: "A feature",
    description:
      "Something you'd love UsBooth to be able to do.",
  },
  {
    id: "template",
    number: "02",
    icon: "♡",
    title: "A template",
    description:
      "A frame, layout, aesthetic or theme you'd love to see.",
  },
  {
    id: "improvement",
    number: "03",
    icon: "◇",
    title: "An improvement",
    description:
      "Something that already exists but could work better.",
  },
  {
    id: "other",
    number: "04",
    icon: "✧",
    title: "Something else",
    description:
      "A completely different idea we haven't thought of.",
  },
];

type ApiUser = {
  email?: string | null;
};

export default function SuggestionsPage() {
  const [selectedType, setSelectedType] =
    useState<string | null>(null);

  const [suggestion, setSuggestion] = useState("");
  const [email, setEmail] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const formRef = useRef<HTMLElement | null>(null);

  function selectSuggestion(type: string) {
    setSelectedType(type);
    setSubmitted(false);
    setError("");

    window.setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);
  }

  function changeType(type: string) {
    setSelectedType(type);
    setSubmitted(false);
    setError("");
  }

  async function submitSuggestion() {
    if (
      !selectedType ||
      !suggestion.trim() ||
      submitting
    ) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSubmitted(false);

    try {
      let replyEmail = email.trim();

      /*
       * If the user is logged in and didn't manually enter
       * an email, use the email attached to their account.
       */
      if (!replyEmail) {
        try {
          const me = await fetch("/api/auth/me", {
            credentials: "include",
            cache: "no-store",
          });

          if (me.ok) {
            const data = await me.json();

            replyEmail =
              (
                data.user as ApiUser | undefined
              )?.email?.trim() ?? "";
          }
        } catch {
          // Email is optional.
        }
      }

      const response = await fetch(
        "/api/suggestions",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category: selectedType,
            suggestion: suggestion.trim(),
            email: replyEmail || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to send suggestion."
        );
      }

      setSubmitted(true);
      setSuggestion("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send suggestion."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selected =
    suggestionTypes.find(
      (item) => item.id === selectedType
    );

  return (
    <main className={styles.page}>
      {/* HEADER */}

      <header className={styles.header}>
        <Link
          href="/"
          className={styles.logo}
        >
          USBOOTH<span>♥</span>
        </Link>

        <nav className={styles.headerNav}>
          <Link href="/about">
            Help & About
          </Link>

          <Link href="/pricing">
            Plans & Pricing
          </Link>
        </nav>
      </header>

      {/* HERO */}

      <section className={styles.hero}>
        <div className={styles.eyebrow}>
          ✦ &nbsp; THE SUGGESTION BOX &nbsp; ✦
        </div>

        <h1>
          What should we
          <br />
          <em>build next?</em>
        </h1>

        <p>
          UsBooth is still growing. We'd rather build
          things people actually want than guess what
          they need.
        </p>

        <div className={styles.heroNote}>
          <span>♡</span>
          <p>
            Your ideas help shape what UsBooth becomes.
          </p>
        </div>
      </section>

      {/* TYPES */}

      <section className={styles.ideas}>
        <div className={styles.sectionHeading}>
          <span>01 — CHOOSE ONE</span>

          <h2>
            What kind of idea
            <br />
            <em>do you have?</em>
          </h2>
        </div>

        <div className={styles.cards}>
          {suggestionTypes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.card} ${
                selectedType === item.id
                  ? styles.selected
                  : ""
              }`}
              onClick={() =>
                selectSuggestion(item.id)
              }
            >
              <div className={styles.cardTop}>
                <span className={styles.cardIcon}>
                  {item.icon}
                </span>

                <span className={styles.cardNumber}>
                  {item.number}
                </span>
              </div>

              <h3>{item.title}</h3>

              <p>{item.description}</p>

              <strong>
                {selectedType === item.id
                  ? "Selected ✓"
                  : "Suggest this →"}
              </strong>
            </button>
          ))}
        </div>
      </section>

      {/* FORM */}

      {selectedType && (
        <section
          ref={formRef}
          className={styles.formSection}
        >
          <div className={styles.formIntro}>
            <span>
              02 — YOUR IDEA
            </span>

            <div className={styles.selectedBadge}>
              {selected?.icon}{" "}
              {selected?.title}
            </div>

            <h2>
              Tell us what you're
              <br />
              <em>thinking.</em>
            </h2>

            <p>
              Don't worry about making it perfect.
              Explain the idea however makes sense to
              you. A sentence is enough. A whole
              paragraph is fine too.
            </p>

            <div className={styles.formSwitch}>
              <span>Want a different category?</span>

              <button
                type="button"
                onClick={() => {
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
              >
                Choose another →
              </button>
            </div>
          </div>

          <div className={styles.form}>
            <label>
              <span className={styles.labelTitle}>
                YOUR SUGGESTION
              </span>

              <textarea
                value={suggestion}
                onChange={(event) =>
                  setSuggestion(
                    event.target.value
                  )
                }
                placeholder="I'd love it if UsBooth could..."
                rows={8}
                maxLength={4000}
              />

              <small>
                {suggestion.length}/4000
              </small>
            </label>

            <label>
              <span className={styles.labelTitle}>
                YOUR EMAIL
              </span>

              <span className={styles.optional}>
                OPTIONAL — ONLY IF YOU WANT A REPLY
              </span>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                maxLength={320}
              />
            </label>

            <button
              type="button"
              className={styles.submit}
              onClick={submitSuggestion}
              disabled={
                !suggestion.trim() ||
                submitting
              }
            >
              {submitting
                ? "SENDING..."
                : "SEND SUGGESTION →"}
            </button>

            {error && (
              <div className={styles.messageError}>
                {error}
              </div>
            )}

            {submitted && (
              <div className={styles.messageSuccess}>
                <strong>
                  Suggestion received ♡
                </strong>

                <span>
                  Thanks for helping shape UsBooth.
                  Your idea has been sent to the team.
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* NOTE */}

      <section className={styles.note}>
        <div>
          <span>03 — A LITTLE NOTE</span>

          <h2>
            No idea is too
            <br />
            <em>small.</em>
          </h2>
        </div>

        <div>
          <p>
            A tiny interaction that feels awkward. A
            template you've always wanted. A new booth
            mode. A filter. A sticker. Something that
            would make taking a photo together just a
            little nicer.
          </p>

          <p>
            Tell us.
          </p>

          <p>
            Suggestions don't guarantee that a feature
            will be built, but they help us understand
            what matters to the people actually using
            UsBooth.
          </p>
        </div>
      </section>

      {/* FOOTER */}

      <footer className={styles.footer}>
        <div>
          <Link href="/about">
            ← Help & About
          </Link>

          <Link href="/pricing">
            Plans & Pricing
          </Link>

          <Link href="/contact">
            Contact Us
          </Link>
        </div>

        <span>
          USBOOTH<span>♥</span>
        </span>
      </footer>
    </main>
  );
}

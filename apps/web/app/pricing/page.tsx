"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./pricing.module.css";

type User = {
  id: string;
  email: string;
  displayName: string;
  plan?: "FREE" | "PLUS" | "PRO";
};

type PlanId = "FREE" | "PLUS" | "PRO";

const FULL_ACCESS_EMAILS = new Set([
  "usboothphotographs@gmail.com",
  "vawesh.srivastava@gmail.com",
  "garimagupta67576@gmail.com",
]);

const PLANS: {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  description: string;
  participants: string;
  booths: string;
  features: string[];
  status: string;
  featured?: boolean;
}[] = [
  {
    id: "FREE",
    name: "Free",
    price: "₹0",
    period: "forever",
    description:
      "Everything you need to make your first little moments.",
    participants: "2 people",
    booths: "3 booths",
    features: [
      "2-person photobooths",
      "Synchronized photo capture",
      "Core templates",
      "Filters & frames",
      "Save memories",
      "Join booths as a guest",
    ],
    status: "AVAILABLE",
  },
  {
    id: "PLUS",
    name: "Plus",
    price: "COMING SOON",
    period: "",
    description:
      "More room for more people and more little moments.",
    participants: "3 people",
    booths: "5 booths",
    features: [
      "Everything in Free",
      "Up to 3 participants",
      "Up to 5 booths",
      "More templates",
      "More customization",
      "Expanded memories",
    ],
    status: "COMING SOON",
    featured: true,
  },
  {
    id: "PRO",
    name: "Pro",
    price: "COMING SOON",
    period: "",
    description:
      "The complete UsBooth experience for bigger moments.",
    participants: "5 people",
    booths: "10 booths",
    features: [
      "Everything in Plus",
      "Up to 5 participants",
      "Up to 10 booths",
      "Premium template collections",
      "Advanced customization",
      "More future features",
    ],
    status: "COMING SOON",
  },
];

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  const isFullAccess = user?.email
    ? FULL_ACCESS_EMAILS.has(user.email.trim().toLowerCase())
    : false;

  const currentPlan = user?.plan ?? "FREE";

  function planAction(plan: PlanId) {
    if (plan === "FREE") {
      if (user) {
        return {
          href: "/account",
          label:
            currentPlan === "FREE"
              ? "OPEN MY BOOTHS"
              : "USE FREE",
        };
      }

      return {
        href: "/register",
        label: "GET STARTED",
      };
    }

    return {
      href: "#coming-soon",
      label: "COMING SOON",
    };
  }

  return (
    <main className={styles.page}>
      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          USBOOTH<span>♥</span>
        </Link>

        <nav className={styles.nav}>
          <Link href="/">Home</Link>
          <Link href="/account">My Booths</Link>
          <Link href="/memories">Memories</Link>
          <Link href="/templates">Templates</Link>
          <Link href="/pricing" className={styles.active}>
            Pricing
          </Link>
        </nav>

        <div className={styles.headerAction}>
          {loading ? (
            <span className={styles.loading}>...</span>
          ) : user ? (
            <Link href="/account" className={styles.account}>
              <span>●</span>
              {user.displayName || "Account"}
            </Link>
          ) : (
            <Link href="/login" className={styles.login}>
              LOG IN
            </Link>
          )}
        </div>
      </header>

      {/* =====================================================
          HERO
          ===================================================== */}

      <section className={styles.hero}>
        <p className={styles.eyebrow}>
          ✦ &nbsp; PLANS & PRICING &nbsp; ✦
        </p>

        <h1>
          Pick the space
          <br />
          that fits your <em>moments.</em>
        </h1>

        <p className={styles.subtitle}>
          Start free. Upgrade when you need more room for your
          people and memories.
        </p>

        {isFullAccess && (
          <div className={styles.fullAccessBanner}>
            <span>♥</span>

            <div>
              <strong>FULL ACCESS</strong>

              <small>
                Your UsBooth account has unlimited access
                to current features.
              </small>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================
          PLANS
          ===================================================== */}

      <section className={styles.plans}>
        <div className={styles.plansGrid}>
          {PLANS.map((plan) => {
            const action = planAction(plan.id);

            const isCurrent =
              !isFullAccess &&
              !!user &&
              currentPlan === plan.id;

            return (
              <article
                key={plan.id}
                className={`${styles.planCard} ${
                  plan.featured ? styles.featured : ""
                }`}
              >
                {plan.featured && (
                  <div className={styles.popular}>
                    MOST ROOM
                  </div>
                )}

                <div className={styles.planInner}>
                  <span className={styles.planName}>
                    {plan.id}
                  </span>

                  <div className={styles.planPrice}>
                    <strong>{plan.price}</strong>

                    {plan.period && (
                      <span>/ {plan.period}</span>
                    )}
                  </div>

                  <p className={styles.planDescription}>
                    {plan.description}
                  </p>

                  <div className={styles.planLimits}>
                    <div className={styles.planLimit}>
                      <span>PEOPLE</span>
                      <strong>{plan.participants}</strong>
                    </div>

                    <div className={styles.planLimit}>
                      <span>BOOTHS</span>
                      <strong>{plan.booths}</strong>
                    </div>
                  </div>

                  <div className={styles.planDivider} />

                  <span className={styles.included}>
                    INCLUDED
                  </span>

                  <ul className={styles.features}>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <span>✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className={styles.planAction}>
                    <Link
                      href={action.href}
                      className={`${styles.planButton} ${
                        plan.id !== "FREE"
                          ? styles.disabled
                          : ""
                      }`}
                    >
                      {isCurrent
                        ? "CURRENT PLAN"
                        : action.label}
                    </Link>
                  </div>

                  <p className={styles.note}>
                    {plan.status}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          COMPARISON
          ===================================================== */}

      <section
        className={styles.comparison}
        id="coming-soon"
      >
        <div className={styles.comparisonIntro}>
          <span>✦ &nbsp; THE DIFFERENCE &nbsp; ✦</span>

          <h2>
            More people.
            <br />
            <em>More room.</em>
          </h2>

          <p>
            UsBooth is starting simple. As Plus and Pro launch,
            they'll give you more space to create together.
          </p>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.featureColumn}>
                  FEATURE
                </th>
                <th>FREE</th>
                <th className={styles.plusColumn}>PLUS</th>
                <th>PRO</th>
              </tr>
            </thead>

            <tbody>
              <tr className={styles.category}>
                <td colSpan={4}>CORE ACCESS</td>
              </tr>

              <tr>
                <td>Participants</td>
                <td>
                  <span className={styles.comparisonValue}>
                    2
                  </span>
                </td>
                <td className={styles.plusColumn}>
                  <span className={styles.comparisonValue}>
                    3
                  </span>
                </td>
                <td>
                  <span className={styles.comparisonValue}>
                    5
                  </span>
                </td>
              </tr>

              <tr>
                <td>Booths</td>
                <td>
                  <span className={styles.comparisonValue}>
                    3
                  </span>
                </td>
                <td className={styles.plusColumn}>
                  <span className={styles.comparisonValue}>
                    5
                  </span>
                </td>
                <td>
                  <span className={styles.comparisonValue}>
                    10
                  </span>
                </td>
              </tr>

              <tr>
                <td>Synchronized capture</td>
                <td>
                  <span className={styles.comparisonCheck}>
                    ✓
                  </span>
                </td>
                <td className={styles.plusColumn}>
                  <span className={styles.comparisonCheck}>
                    ✓
                  </span>
                </td>
                <td>
                  <span className={styles.comparisonCheck}>
                    ✓
                  </span>
                </td>
              </tr>

              <tr>
                <td>Memories</td>
                <td>
                  <span className={styles.comparisonCheck}>
                    ✓
                  </span>
                </td>
                <td className={styles.plusColumn}>
                  <span className={styles.comparisonCheck}>
                    ✓
                  </span>
                </td>
                <td>
                  <span className={styles.comparisonCheck}>
                    ✓
                  </span>
                </td>
              </tr>

              <tr>
                <td>More templates</td>
                <td>
                  <span className={styles.comparisonDash}>
                    —
                  </span>
                </td>
                <td className={styles.plusColumn}>
                  <span className={styles.comparisonValue}>
                    SOON
                  </span>
                </td>
                <td>
                  <span className={styles.comparisonValue}>
                    SOON
                  </span>
                </td>
              </tr>

              <tr>
                <td>Advanced features</td>
                <td>
                  <span className={styles.comparisonDash}>
                    —
                  </span>
                </td>
                <td className={styles.plusColumn}>
                  <span className={styles.comparisonValue}>
                    SOON
                  </span>
                </td>
                <td>
                  <span className={styles.comparisonValue}>
                    SOON
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* =====================================================
          CREATIVE LIBRARY
          ===================================================== */}

      <section className={styles.creative}>
        <div className={styles.creativeCopy}>
          <span>✦ &nbsp; CREATIVE TOOLS &nbsp; ✦</span>

          <h2>
            Make every
            <br />
            frame <em>yours.</em>
          </h2>

          <p>
            UsBooth is built around the little details that
            make a memory feel personal. Templates, frames,
            filters and more creative tools will continue to
            grow with the platform.
          </p>
        </div>

        <div className={styles.creativeGrid}>
          <div className={styles.creativeCard}>
            <div className={styles.creativeIcon}>✦</div>

            <h3>Templates</h3>

            <p>
              Different layouts and styles for every kind of
              moment.
            </p>
          </div>

          <div className={styles.creativeCard}>
            <div className={styles.creativeIcon}>◌</div>

            <h3>Filters</h3>

            <p>
              Give your photos a look that feels like yours.
            </p>
          </div>

          <div className={styles.creativeCard}>
            <div className={styles.creativeIcon}>♡</div>

            <h3>Memories</h3>

            <p>
              Keep the moments you create together in one
              place.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          EFFECTS
          ===================================================== */}

      <section className={styles.effects}>
        <div className={styles.effectsCard}>
          <div>
            <span>COMING WITH USBOOTH</span>

            <h2>
              More ways
              <br />
              to <em>create.</em>
            </h2>

            <p>
              We're keeping the core experience simple for
              now, while building more creative possibilities
              for future plans.
            </p>
          </div>

          <div className={styles.effectsList}>
            <span>MORE TEMPLATES</span>
            <span>MORE FRAMES</span>
            <span>ADVANCED EFFECTS</span>
            <span>MORE CUSTOMIZATION</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
          ===================================================== */}

      <section className={styles.cta}>
        <div>
          <span>READY WHEN YOU ARE</span>

          <h2>
            Start making
            <br />
            <em>memories.</em>
          </h2>

          <p>
            No complicated setup. No expensive equipment.
            Just two phones and a moment worth keeping.
          </p>
        </div>

        <div className={styles.ctaActions}>
          <Link
            href={user ? "/account" : "/register"}
            className={styles.ctaPrimary}
          >
            {user ? "OPEN MY BOOTHS" : "GET STARTED"}
          </Link>

          <Link
            href="/about"
            className={styles.ctaSecondary}
          >
            LEARN MORE
          </Link>
        </div>
      </section>

      {/* =====================================================
          BACK
          ===================================================== */}

      <div className={styles.back}>
        <Link href="/">← BACK TO USBOOTH</Link>
      </div>
    </main>
  );
}

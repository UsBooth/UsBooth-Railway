"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { showToast } from "../../components/Toast";
import "./account.css";

type BoothType = "SOLO" | "COUPLE" | "RANDOM";

type Booth = {
  id: string;
  ownerId: string;
  type: BoothType;
  name: string;
  roomCode: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type BoothResponse = {
  booths: Booth[];
  limit: number | null;
  remaining: number | null;
};

type User = {
  id: string;
  email: string;
  displayName: string;
};

const FULL_ACCESS_EMAILS = new Set([
  "usboothphotographs@gmail.com",
  "vawesh.srivastava@gmail.com",
  "garimagupta67576@gmail.com",
]);

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [booths, setBooths] = useState<Booth[]>([]);

  const [limit, setLimit] =
    useState<number | null>(3);

  const [remaining, setRemaining] =
    useState<number | null>(3);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showCreate, setShowCreate] =
    useState(false);

  const [newName, setNewName] =
    useState("");

  const [newType, setNewType] =
    useState<BoothType>("COUPLE");


  useEffect(() => {
    loadAccount();

    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "true") {
      setShowCreate(true);
      window.history.replaceState({}, "", "/account");
    }
  }, []);

  async function loadAccount() {
    try {
      setLoading(true);
      setError("");

      const [
        userResponse,
        boothResponse,
      ] = await Promise.all([
        fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        }),

        fetch("/api/booths", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      if (userResponse.status === 401) {
        window.location.href = "/";
        return;
      }

      const userData =
        await userResponse.json();

      const boothData: BoothResponse =
        await boothResponse.json();

      if (!userResponse.ok) {
        throw new Error(
          userData.error ||
            "Unable to load account."
        );
      }

      if (!boothResponse.ok) {
        throw new Error(
          boothData &&
          typeof boothData === "object" &&
          "error" in boothData
            ? String(
                (
                  boothData as {
                    error: string;
                  }
                ).error
              )
            : "Unable to load booths."
        );
      }

      const loadedUser =
        userData.user as User;

      const email =
        loadedUser?.email
          ?.trim()
          .toLowerCase();

      const hasFullAccess =
        FULL_ACCESS_EMAILS.has(
          email || ""
        );

      setUser(loadedUser);

      setBooths(
        Array.isArray(
          boothData.booths
        )
          ? boothData.booths
          : []
      );

      /*
       * Full-access accounts are unlimited.
       *
       * We deliberately keep the normal
       * API values for everyone else.
       */
      if (hasFullAccess) {
        setLimit(null);
        setRemaining(null);
      } else {
        setLimit(
          typeof boothData.limit ===
            "number"
            ? boothData.limit
            : 3
        );

        setRemaining(
          typeof boothData.remaining ===
            "number"
            ? boothData.remaining
            : Math.max(
                0,
                3 -
                  (
                    boothData.booths
                      ?.length ?? 0
                  )
              )
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  const isFullAccess =
    user?.email
      ? FULL_ACCESS_EMAILS.has(
          user.email
            .trim()
            .toLowerCase()
        )
      : false;

  const hasBoothSpace =
    isFullAccess ||
    (
      typeof limit === "number" &&
      booths.length < limit
    );

  async function createBooth() {
    if (!newName.trim()) {
      setError(
        "Give your booth a name first."
      );
      return;
    }

    if (!hasBoothSpace) {
      setError(
        `You've reached your ${
          limit ?? 3
        }-booth limit.`
      );
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response =
        await fetch("/api/booths", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: newName.trim(),
            type: newType,
          }),
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create booth."
        );
      }

      setBooths((current) => [
        ...current,
        data.booth,
      ]);

      if (
        !isFullAccess &&
        typeof limit === "number"
      ) {
        setRemaining(
          Math.max(
            0,
            limit -
              (
                booths.length + 1
              )
          )
        );
      }

      setNewName("");
      setNewType("COUPLE");
      setShowCreate(false);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create booth."
      );
    } finally {
      setCreating(false);
    }
  }

  async function copyCode(
    code: string
  ) {
    try {
      await navigator.clipboard.writeText(
        code
      );

      setError("");
      showToast("Room code copied");
    } catch {
      setError(
        "Couldn't copy the room code."
      );
    }
  }

  async function logout() {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );
    } finally {
      window.location.href = "/";
    }
  }

  if (loading) {
    return (
      <main className="account-page">
        <div className="account-loading">
          <div className="loading-mark">
            USBOOTH<span>♥</span>
          </div>

          <div className="loading-line" />

          <p>
            Opening your little spaces...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page">

      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <div className="account-main">

        <header className="account-nav">

          <Link
            href="/"
            className="account-logo"
          >
            USBOOTH<span>♥</span>
          </Link>

          <div className="account-nav-right">

            <span className="user-email">
              {user?.email}
            </span>

            <button
              type="button"
              className="logout-button"
              onClick={logout}
            >
              LOG OUT
            </button>

          </div>

        </header>

        {/* =====================================================
            HERO
            ===================================================== */}

        <section className="account-hero">

          <div>

            <p className="account-eyebrow">
              ✦ &nbsp; YOUR USBOOTH &nbsp; ✦
            </p>

            <h1>
              Hello,{" "}
              <span>
                {user?.displayName ||
                  "there"}.
              </span>
            </h1>

            <p className="account-subtitle">
              Your little spaces,
              your memories,
              <br />
              your moments together.
            </p>

          </div>

          <div className="booth-counter">

            <div className="counter-number">

              {booths.length}

              <span>
                /
                {isFullAccess
                  ? " ∞"
                  : ` ${
                      limit ?? 3
                    }`}
              </span>

            </div>

            <div className="counter-copy">

              <strong>
                {isFullAccess
                  ? "FULL ACCESS"
                  : "BOOTHS CREATED"}
              </strong>

              <small>
                {isFullAccess
                  ? "Unlimited booth spaces"
                  : `${
                      remaining ??
                      0
                    } ${
                      (
                        remaining ??
                        0
                      ) === 1
                        ? "space"
                        : "spaces"
                    } remaining`}
              </small>

            </div>

          </div>

        </section>

        {/* =====================================================
            ERROR
            ===================================================== */}


        {error && (
          <div className="account-error">

            <span>!</span>

            {error}

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>

          </div>
        )}

        {/* =====================================================
            BOOTHS
            ===================================================== */}

        <section className="booths-section">

          <div className="section-header">

            <div>

              <p className="account-eyebrow">
                ✦ &nbsp; YOUR ROOMS &nbsp; ✦
              </p>

              <h2>
                Places for your
                <br />
                <em>
                  little moments.
                </em>
              </h2>

            </div>

            {hasBoothSpace && (
              <button
                type="button"
                className="create-button"
                onClick={() =>
                  setShowCreate(true)
                }
              >
                <span>＋</span>
                CREATE A BOOTH
              </button>
            )}

          </div>

          {booths.length === 0 ? (

            <div className="empty-booths">

              <div className="empty-heart">
                ♡
              </div>

              <h3>
                Your first booth is
                waiting.
              </h3>

              <p>
                Create a permanent
                room for the people
                and moments you never
                want to lose.
              </p>

              <button
                type="button"
                className="create-button"
                onClick={() =>
                  setShowCreate(true)
                }
              >
                CREATE YOUR FIRST BOOTH
              </button>

            </div>

          ) : (

            <div className="booth-grid">

              {booths.map(
                (booth, index) => (

                  <article
                    className={`booth-card ${
                      booth.type === "SOLO"
                        ? "solo-card"
                        : booth.type === "COUPLE"
                          ? "couple-card"
                          : "random-card"
                    }`}
                    key={booth.id}
                  >

                    <div className="booth-card-top">

                      <span className="booth-index">
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      <span className="booth-type">

                        {booth.type === "SOLO"
                          ? "◉ SOLO"
                          : booth.type === "COUPLE"
                            ? "♥ COUPLE"
                            : "✦ RANDOM"}

                      </span>

                    </div>

                    <div className="booth-visual">

                      <div className="visual-orbit orbit-a" />

                      <div className="visual-orbit orbit-b" />

                      {booth.type === "SOLO" ? (
                        <>
                          <div className="visual-camera">◎</div>
                          <div className="visual-star">✦</div>
                        </>
                      ) : booth.type === "COUPLE" ? (
                        <>
                          <div className="visual-heart">♥</div>
                          <div className="visual-person person-a" />
                          <div className="visual-person person-b" />
                        </>
                      ) : (
                        <>
                          <div className="visual-star">✦</div>
                          <div className="visual-camera">◎</div>
                        </>
                      )}

                      <span className="visual-label">
                        USBOOTH
                      </span>

                    </div>

                    <div className="booth-card-content">

                      <div>

                        <h3>
                          {booth.name}
                        </h3>

                        <p>
                          {booth.description ||
                            (
                              booth.type ===
                              "COUPLE"
                                ? "A permanent room for two."
                                : "A room for spontaneous memories."
                            )}
                        </p>

                      </div>

                      <div className="room-code">

                        <span>
                          ROOM CODE
                        </span>

                        <strong>
                          {booth.roomCode}
                        </strong>

                      </div>

                      <div className="booth-actions">

                        <Link
                          href={`/booth/${booth.id}`}
                          className="open-booth"
                        >
                          OPEN BOOTH
                          <span>
                            ↗
                          </span>
                        </Link>

                        <button
                          type="button"
                          className="copy-code"
                          onClick={() =>
                            copyCode(
                              booth.roomCode
                            )
                          }
                        >
                          COPY CODE
                        </button>

                      </div>

                    </div>

                  </article>

                )
              )}

              {hasBoothSpace && (
                <button
                  type="button"
                  className="add-booth-card"
                  onClick={() =>
                    setShowCreate(true)
                  }
                >

                  <span>＋</span>

                  <strong>
                    CREATE ANOTHER BOOTH
                  </strong>

                  <small>
                    {isFullAccess
                      ? "Unlimited slots"
                      : `${
                          remaining ??
                          0
                        } slots remaining`}
                  </small>

                </button>
              )}

            </div>

          )}

        </section>

        {/* =====================================================
            FOOTER MESSAGE
            ===================================================== */}

        <section className="account-footer-message">

          <span>♡</span>

          <p>
            Two phones. One moment.
            <br />
            <em>
              That's all it takes.
            </em>
          </p>

        </section>

        {/* =====================================================
            FOOTER
            ===================================================== */}

        <footer className="account-footer">

          <Link
            href="/"
            className="account-logo"
          >
            USBOOTH<span>♥</span>
          </Link>

          <span>
            © 2026 USBOOTH · MADE FOR
            THE MOMENTS THAT MATTER
          </span>

        </footer>

      </div>

      {/* =====================================================
          CREATE BOOTH MODAL
          ===================================================== */}

      {showCreate && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setShowCreate(false);
            }

          }}
        >

          <div className="create-modal">

            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setShowCreate(false)
              }
            >
              ×
            </button>

            <p className="account-eyebrow">
              ✦ &nbsp; NEW SPACE &nbsp; ✦
            </p>

            <h2>
              Create a little
              <br />
              <em>
                room of your own.
              </em>
            </h2>

            <label>

              BOOTH NAME

              <input
                autoFocus
                value={newName}
                onChange={(event) =>
                  setNewName(
                    event.target.value
                  )
                }
                placeholder="Our Little Room"
                maxLength={80}
              />

            </label>

            <label>
              WHAT KIND OF ROOM?
            </label>

            <div className="type-options">

              <button
                type="button"
                className={
                  newType === "SOLO"
                    ? "selected"
                    : ""
                }
                onClick={() => setNewType("SOLO")}
              >
                <span>◉</span>
                <strong>SOLO</strong>
                <small>
                  One camera, one person.
                </small>
              </button>

              <button
                type="button"
                className={
                  newType === "COUPLE"
                    ? "selected"
                    : ""
                }
                onClick={() => setNewType("COUPLE")}
              >
                <span>♥</span>
                <strong>COUPLE</strong>
                <small>
                  A permanent space for two.
                </small>
              </button>

              <button
                type="button"
                className={
                  newType === "RANDOM"
                    ? "selected"
                    : ""
                }
                onClick={() => setNewType("RANDOM")}
              >
                <span>✦</span>
                <strong>RANDOM</strong>
                <small>
                  For spontaneous photo sessions.
                </small>
              </button>

            </div>

            <button
              type="button"
              className="modal-create"
              onClick={createBooth}
              disabled={creating}
            >
              {creating
                ? "CREATING..."
                : "CREATE MY BOOTH  ↗"}
            </button>

          </div>

        </div>
      )}

    </main>
  );
}

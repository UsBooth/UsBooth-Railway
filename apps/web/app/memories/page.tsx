"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./memories.module.css";

type User = {
  id: string;
  displayName: string;
  email: string;
};

type Memory = {
  id: string;
  title: string | null;
  sessionId?: string | null;
  layout?: string | null;
  template?: string | null;
  privacy?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  asset: {
    id: string;
    photoDataUrl: string;
    mimeType: string;
    width: number | null;
    height: number | null;
  } | null;
};

const samples = [
  { title: "A little moment", meta: "POLAROID · WARM", kind: "sunset" },
  { title: "Miles apart", meta: "FILM · NOSTALGIC", kind: "film" },
  { title: "Just us", meta: "LOVE NOTE · SOFT", kind: "note" },
];

async function downloadMemoryPhoto(
  photoDataUrl: string,
  title: string | null,
  memoryId: string,
  setNotice: (message: string) => void
) {
  try {
    const response = await fetch(photoDataUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const safeTitle =
      (title || "UsBooth memory")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "usbooth-memory";

    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeTitle}-${memoryId.slice(0, 8)}.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1500);
  } catch (error) {
    console.error("Unable to download memory:", error);
    setNotice("We couldn't download this memory right now.");
  }
}

export default function MemoriesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [memoryLoading, setMemoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [selectedMemory, setSelectedMemory] =
    useState<Memory | null>(null);
  const [editingTitle, setEditingTitle] =
    useState(false);
  const [memoryTitleDraft, setMemoryTitleDraft] =
    useState("");
  const [memoryActionBusy, setMemoryActionBusy] =
    useState(false);

  useEffect(() => {
    void loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);
      setMemoryLoading(true);
      setError("");

      const userResponse = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!userResponse.ok) {
        window.location.replace("/login?next=/memories");
        return;
      }

      const userData = await userResponse.json();
      setUser(userData?.user || null);

      const memoryResponse = await fetch("/api/memories", {
        credentials: "include",
        cache: "no-store",
      });

      const memoryData = await memoryResponse.json().catch(() => ({}));

      if (!memoryResponse.ok) {
        throw new Error(memoryData?.error || "Unable to load memories.");
      }

      setMemories(
        Array.isArray(memoryData?.memories)
          ? memoryData.memories
          : []
      );
    } catch (err) {
      console.error("Unable to load memories:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your memories."
      );
    } finally {
      setLoading(false);
      setMemoryLoading(false);
    }
  }


  async function updateMemoryTitle() {
    if (!selectedMemory) return;

    const title = memoryTitleDraft.trim();
    if (!title) return;

    try {
      setMemoryActionBusy(true);

      const response = await fetch("/api/memories", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memoryId: selectedMemory.id,
          title,
        }),
      });

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to rename this memory."
        );
      }

      setMemories((current) =>
        current.map((memory) =>
          memory.id === selectedMemory.id
            ? {
                ...memory,
                title,
              }
            : memory
        )
      );

      setSelectedMemory({
        ...selectedMemory,
        title,
      });

      setEditingTitle(false);
    } catch (err) {
      setActionNotice(
        err instanceof Error
          ? err.message
          : "Unable to rename this memory."
      );
    } finally {
      setMemoryActionBusy(false);
    }
  }

  async function deleteSelectedMemory() {
    if (!selectedMemory) return;

    const confirmed =
      window.confirm(
        "Delete this memory permanently?"
      );

    if (!confirmed) return;

    try {
      setMemoryActionBusy(true);

      const response = await fetch(
        `/api/memories?memoryId=${encodeURIComponent(
          selectedMemory.id
        )}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to delete this memory."
        );
      }

      setMemories((current) =>
        current.filter(
          (memory) =>
            memory.id !== selectedMemory.id
        )
      );

      setSelectedMemory(null);
      setEditingTitle(false);
    } catch (err) {
      setActionNotice(
        err instanceof Error
          ? err.message
          : "Unable to delete this memory."
      );
    } finally {
      setMemoryActionBusy(false);
    }
  }

  function openMemoryFullscreen() {
    const image = document.querySelector(`.${styles.memoryViewerImage}`) as HTMLElement | null;
    if (image?.requestFullscreen) void image.requestFullscreen();
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>✦ &nbsp; MEMORY VAULT &nbsp; ✦</p>
        <h1>
          Your moments,
          <br />
          <em>kept here.</em>
        </h1>
        <p className={styles.lead}>
          A quiet little place for the photos you make together — the ones you
          will want to find again later.
        </p>
      </section>

      <section className={styles.vault}>
        <div className={styles.vaultTop}>
          <div>
            <p className={styles.eyebrow}>YOUR COLLECTION</p>
            <h2>
              {user
                ? `Hey, ${user.displayName.split(" ")[0]}.`
                : "Your vault."}
            </h2>
          </div>
          <span className={styles.count}>
            {memories.length} {memories.length === 1 ? "MEMORY" : "MEMORIES"}
          </span>
        </div>

        {error && <div className={styles.error}>{error}</div>}        {actionNotice && <div className={styles.actionNotice} role="status" aria-live="polite"><span>{actionNotice}</span><button type="button" onClick={() => setActionNotice("")} aria-label="Dismiss notification">×</button></div>}

        {memoryLoading ? (
          <div className={styles.empty}>
            <div className={styles.memoryMark}>
              <span>♡</span>
            </div>
            <p className={styles.eyebrow}>OPENING YOUR VAULT</p>
            <h3>Finding your little moments...</h3>
          </div>
        ) : memories.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.memoryMark}>
              <span>♡</span>
            </div>

            <p className={styles.eyebrow}>NOTHING HERE YET</p>

            <h3>Your first memory is waiting.</h3>

            <p className={styles.emptyText}>
              Create a booth, bring your person in, and take your first photo.
              Finished captures will appear here.
            </p>

            <div className={styles.actions}>
              <Link href={user ? "/account?create=true" : "/login?next=%2Faccount%3Fcreate%3Dtrue"} className={styles.primary}>
                CREATE A BOOTH ↗
              </Link>
              <Link href="/templates" className={styles.secondary}>
                EXPLORE TEMPLATES
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.memoryGallery}>
            {memories.map((memory) => (
              <article key={memory.id} className={styles.savedMemory}>
                <button
                  type="button"
                  className={styles.memoryOpenButton}
                  onClick={() => {
                    setSelectedMemory(memory);
                    setMemoryTitleDraft(
                      memory.title || "A little moment"
                    );
                    setEditingTitle(false);
                  }}
                >
                  {memory.asset?.photoDataUrl ? (
                    <img
                      src={memory.asset.photoDataUrl}
                      alt={memory.title || "UsBooth memory"}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.savedMemoryPlaceholder}>
                      ♡
                    </div>
                  )}
                </button>
                <div className={styles.savedMemoryMeta}>
                  <div className={styles.savedMemoryInfo}>
                    <strong>{memory.title || "A little moment"}</strong>
                    <small>
                      {new Date(memory.createdAt).toLocaleDateString(
                        undefined,
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </small>
                  </div>

                  {memory.asset?.photoDataUrl && (
                    <button
                      type="button"
                      className={styles.memoryDownload}
                      onClick={() =>
                        void downloadMemoryPhoto(
                          memory.asset!.photoDataUrl,
                          memory.title,
                          memory.id
                        ,
                        setActionNotice)
                      }
                      aria-label={`Download ${memory.title || "memory"}`}
                    >
                      ↓ DOWNLOAD
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>


      {selectedMemory && (
        <div
          className={styles.memoryViewerBackdrop}
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (!memoryActionBusy) {
              setSelectedMemory(null);
              setEditingTitle(false);
            }
          }}
        >
          <div
            className={styles.memoryViewer}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className={styles.memoryViewerClose}
              onClick={() => {
                if (!memoryActionBusy) {
                  setSelectedMemory(null);
                  setEditingTitle(false);
                }
              }}
              aria-label="Close memory"
            >
              ×
            </button>

            {selectedMemory.asset?.photoDataUrl && (
              <img
                className={styles.memoryViewerImage}
                src={selectedMemory.asset.photoDataUrl}
                alt={selectedMemory.title || "UsBooth memory"}
              />
            )}

            <div className={styles.memoryViewerMeta}>
              <span className={styles.eyebrow}>
                ✦ MEMORY
              </span>

              {editingTitle ? (
                <div className={styles.memoryTitleEditor}>
                  <input
                    value={memoryTitleDraft}
                    maxLength={120}
                    onChange={(event) =>
                      setMemoryTitleDraft(
                        event.target.value
                      )
                    }
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={
                      memoryActionBusy ||
                      !memoryTitleDraft.trim()
                    }
                    onClick={() =>
                      void updateMemoryTitle()
                    }
                  >
                    SAVE TITLE
                  </button>
                </div>
              ) : (
                <div className={styles.memoryViewerTitleRow}>
                  <h2>
                    {selectedMemory.title ||
                      "A little moment"}
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingTitle(true)
                    }
                  >
                    EDIT TITLE
                  </button>
                </div>
              )}

              <small>
                {new Date(
                  selectedMemory.createdAt
                ).toLocaleDateString(
                  undefined,
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </small>

              <div className={styles.memoryMetadata}>
                <span>{selectedMemory.template || "classic-strip"}</span>
                <span>{selectedMemory.layout || "JOINED"}</span>
                <span>{selectedMemory.privacy || "PRIVATE"}</span>
                {Boolean(selectedMemory.metadata?.templateName) && (
                  <span>{String(selectedMemory.metadata?.templateName)}</span>
                )}
              </div>

              <div className={styles.memoryViewerActions}>
                {selectedMemory.asset?.photoDataUrl && (
                  <button type="button" onClick={openMemoryFullscreen}>⛶ FULLSCREEN</button>
                )}
                {selectedMemory.asset?.photoDataUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      void downloadMemoryPhoto(
                        selectedMemory.asset!.photoDataUrl,
                        selectedMemory.title,
                        selectedMemory.id
                      ,
                        setActionNotice)
                    }
                  >
                    ↓ DOWNLOAD
                  </button>
                )}

                <button
                  type="button"
                  className={styles.dangerAction}
                  disabled={memoryActionBusy}
                  onClick={() =>
                    void deleteSelectedMemory()
                  }
                >
                  DELETE MEMORY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className={styles.inspiration}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>✦ &nbsp; KEEP THE FEELING &nbsp; ✦</p>
            <h2>
              Little ways to
              <br />
              <em>keep a moment.</em>
            </h2>
          </div>
          <p>
            Try a different frame, film style, or handwritten treatment for
            your next booth.
          </p>
        </div>

        <div className={styles.grid}>
          {samples.map((sample, index) => (
            <article key={sample.title} className={styles.card}>
              <div className={`${styles.art} ${styles[sample.kind]}`}>
                <div className={styles.artFrame}>
                  <span>{index === 1 ? "✦" : "♡"}</span>
                </div>
                <small>{sample.meta}</small>
              </div>
              <div className={styles.cardText}>
                <strong>{sample.title}</strong>
                <Link href="/templates">EXPLORE ↗</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.bottomCta}>
        <p className={styles.eyebrow}>✦ &nbsp; MAKE THE NEXT ONE &nbsp; ✦</p>
        <h2>
          Some moments are
          <br />
          worth <em>keeping.</em>
        </h2>
        <Link href={user ? "/account?create=true" : "/login?next=%2Faccount%3Fcreate%3Dtrue"} className={styles.primary}>
          START A MEMORY ↗
        </Link>
      </section>

      <footer className={styles.footer}>
        <Link href="/" className={styles.footerLogo}>
          USBOOTH<span>♥</span>
        </Link>
        <div className={styles.footerLinks}>
          <Link href="/templates">Templates</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <small>Two phones. One moment.</small>
      </footer>

      {!loading && !user && (
        <div className={styles.loginHint}>
          <Link href="/login">Log in</Link> to keep your future memories in one place.
        </div>
      )}
    </main>
  );
}

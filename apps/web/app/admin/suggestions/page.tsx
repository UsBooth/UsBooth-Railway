"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./admin-suggestions.module.css";

type SuggestionStatus =
  | "NEW"
  | "REVIEWING"
  | "PLANNED"
  | "BUILDING"
  | "SHIPPED";

type SuggestionCategory =
  | "FEATURE"
  | "TEMPLATE"
  | "IMPROVEMENT"
  | "OTHER";

type Suggestion = {
  id: string;
  category: SuggestionCategory;
  suggestion: string;
  email: string | null;
  status: SuggestionStatus;
  adminNotes: string | null;
  createdAt: string;
  userDisplayName: string | null;
  userEmail: string | null;
};

const statuses: ("ALL" | SuggestionStatus)[] = [
  "ALL",
  "NEW",
  "REVIEWING",
  "PLANNED",
  "BUILDING",
  "SHIPPED",
];

const suggestionStatuses: SuggestionStatus[] = [
  "NEW",
  "REVIEWING",
  "PLANNED",
  "BUILDING",
  "SHIPPED",
];

const categoryLabels: Record<
  SuggestionCategory,
  string
> = {
  FEATURE: "Feature",
  TEMPLATE: "Template",
  IMPROVEMENT: "Improvement",
  OTHER: "Other",
};

export default function AdminSuggestionsPage() {
  const [items, setItems] =
    useState<Suggestion[]>([]);

  const [selected, setSelected] =
    useState<Suggestion | null>(null);

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | SuggestionStatus>("ALL");

  const [search, setSearch] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/suggestions",
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load suggestions."
        );
      }

      setItems(
        data.suggestions || []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load suggestions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        item.status === statusFilter;

      const haystack =
        `${item.suggestion} ${
          item.email || ""
        } ${
          item.userDisplayName || ""
        } ${
          item.userEmail || ""
        } ${
          categoryLabels[item.category]
        }`.toLowerCase();

      return (
        matchesStatus &&
        (!query ||
          haystack.includes(query))
      );
    });
  }, [
    items,
    search,
    statusFilter,
  ]);

  function open(item: Suggestion) {
    setSelected(item);
    setNotes(
      item.adminNotes || ""
    );
    setError("");
  }

  async function update(
    status: SuggestionStatus
  ) {
    if (!selected || saving) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/admin/suggestions",
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id: selected.id,
              status,
              adminNotes: notes,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update suggestion."
        );
      }

      setItems((current) =>
        current.map((item) =>
          item.id === selected.id
            ? data.suggestion
            : item
        )
      );

      setSelected(
        data.suggestion
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update suggestion."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (
      !selected ||
      saving ||
      !window.confirm(
        "Delete this suggestion permanently?"
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/admin/suggestions",
          {
            method: "DELETE",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id: selected.id,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to delete suggestion."
        );
      }

      setItems((current) =>
        current.filter(
          (item) =>
            item.id !== selected.id
        )
      );

      setSelected(null);
      setNotes("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete suggestion."
      );
    } finally {
      setSaving(false);
    }
  }

  const counts = Object.fromEntries(
    suggestionStatuses.map(
      (status) => [
        status,
        items.filter(
          (item) =>
            item.status === status
        ).length,
      ]
    )
  ) as Record<
    SuggestionStatus,
    number
  >;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link
          href="/"
          className={styles.logo}
        >
          USBOOTH<span>♥</span>
        </Link>

        <div
          className={
            styles.headerRight
          }
        >
          <span>
            ADMIN / SUGGESTIONS
          </span>

          <Link href="/account">
            ← Account
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div>
          <p
            className={
              styles.eyebrow
            }
          >
            ✦ PRODUCT FEEDBACK ✦
          </p>

          <h1>
            What should we
            <br />
            <em>build next?</em>
          </h1>

          <p
            className={
              styles.sub
            }
          >
            Every suggestion, in one
            place.
          </p>
        </div>

        <div
          className={styles.total}
        >
          <strong>
            {items.length}
          </strong>

          <span>
            TOTAL IDEAS
          </span>
        </div>
      </section>

      {error && (
        <div
          className={styles.error}
        >
          {error}
        </div>
      )}

      <section
        className={
          styles.toolbar
        }
      >
        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search suggestions..."
        />

        <div
          className={
            styles.filters
          }
        >
          {statuses.map(
            (status) => (
              <button
                key={status}
                type="button"
                className={
                  statusFilter ===
                  status
                    ? styles.active
                    : ""
                }
                onClick={() =>
                  setStatusFilter(
                    status
                  )
                }
              >
                {status ===
                "ALL"
                  ? "ALL"
                  : `${status} ${
                      counts[
                        status
                      ] ?? 0
                    }`}
              </button>
            )
          )}
        </div>
      </section>

      <section
        className={
          styles.content
        }
      >
        <div
          className={styles.list}
        >
          {loading ? (
            <div
              className={
                styles.empty
              }
            >
              Loading suggestions...
            </div>
          ) : filtered.length ===
            0 ? (
            <div
              className={
                styles.empty
              }
            >
              No suggestions found.
            </div>
          ) : (
            filtered.map(
              (item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.item} ${
                    selected?.id ===
                    item.id
                      ? styles.itemSelected
                      : ""
                  }`}
                  onClick={() =>
                    open(item)
                  }
                >
                  <div
                    className={
                      styles.itemTop
                    }
                  >
                    <span
                      className={
                        styles.category
                      }
                    >
                      {
                        categoryLabels[
                          item.category
                        ]
                      }
                    </span>

                    <span
                      className={`${styles.status} ${
                        styles[
                          item.status.toLowerCase()
                        ]
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <h2>
                    {item.suggestion
                      .length > 110
                      ? `${item.suggestion.slice(
                          0,
                          110
                        )}…`
                      : item.suggestion}
                  </h2>

                  <p>
                    {item.userDisplayName ||
                      item.email ||
                      "Anonymous"}{" "}
                    ·{" "}
                    {new Date(
                      item.createdAt
                    ).toLocaleString()}
                  </p>
                </button>
              )
            )
          )}
        </div>

        <aside
          className={
            styles.detail
          }
        >
          {!selected ? (
            <div
              className={
                styles.emptyDetail
              }
            >
              <span>♡</span>

              <p>
                Select a suggestion
                to review it.
              </p>
            </div>
          ) : (
            <>
              <div
                className={
                  styles.detailTop
                }
              >
                <div>
                  <span
                    className={
                      styles.category
                    }
                  >
                    {
                      categoryLabels[
                        selected.category
                      ]
                    }
                  </span>

                  <h2>
                    Suggestion
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelected(null)
                  }
                >
                  ×
                </button>
              </div>

              <blockquote>
                {
                  selected.suggestion
                }
              </blockquote>

              <div
                className={
                  styles.meta
                }
              >
                <div>
                  <span>
                    FROM
                  </span>

                  <strong>
                    {selected.userDisplayName ||
                      "Anonymous"}
                  </strong>
                </div>

                <div>
                  <span>
                    EMAIL
                  </span>

                  <strong>
                    {selected.email ||
                      selected.userEmail ||
                      "Not provided"}
                  </strong>
                </div>

                <div>
                  <span>
                    RECEIVED
                  </span>

                  <strong>
                    {new Date(
                      selected.createdAt
                    ).toLocaleString()}
                  </strong>
                </div>
              </div>

              <label
                className={
                  styles.notes
                }
              >
                ADMIN NOTES

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value
                    )
                  }
                  maxLength={4000}
                  placeholder="Internal notes..."
                />
              </label>

              <div
                className={
                  styles.statusButtons
                }
              >
                {suggestionStatuses.map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      className={
                        selected.status ===
                        status
                          ? styles.current
                          : ""
                      }
                      disabled={saving}
                      onClick={() =>
                        update(
                          status
                        )
                      }
                    >
                      {status}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                className={
                  styles.delete
                }
                disabled={saving}
                onClick={remove}
              >
                DELETE SUGGESTION
              </button>
            </>
          )}
        </aside>
      </section>
    </main>
  );
}

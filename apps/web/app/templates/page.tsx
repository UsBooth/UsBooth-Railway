"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./templates.module.css";
import { BOOTH_TEMPLATES } from "../../lib/templates/templates";
import TemplateThumbnail from "../../components/booth/TemplateThumbnail";
import { getTemplatePhotoSlotCount } from "../../lib/templates/template-graphics";

const templates = BOOTH_TEMPLATES.map(([id, name, tag, plan]) => ({
  id,
  name,
  tag,
  plan,
}));

type Filter = "ALL" | "FREE" | "PLUS" | "PRO";

function TemplatePreview({
  templateId,
  name,
}: {
  templateId: string;
  name: string;
}) {
  return (
    <div className={styles["template-image-wrap"]}>
      <TemplateThumbnail
        templateId={templateId}
        className={styles["template-image"]}
      />
      <span className="sr-only">{name} template preview</span>
    </div>
  );
}

export default function TemplatesPage() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      ALL: templates.length,
      FREE: templates.filter((template) => template.plan === "FREE").length,
      PLUS: templates.filter((template) => template.plan === "PLUS").length,
      PRO: templates.filter((template) => template.plan === "PRO").length,
    }),
    []
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates
      .map((template) => ({
        ...template,
        photoSlotCount: getTemplatePhotoSlotCount(template.id),
      }))
      .filter((template) => {
        const matchesPlan = filter === "ALL" || template.plan === filter;
        const matchesSearch =
          !q ||
          template.name.toLowerCase().includes(q) ||
          template.tag.toLowerCase().includes(q);
        return matchesPlan && matchesSearch;
      });
  }, [filter, query]);

  const templateSections = useMemo(
    () =>
      [1, 2, 3, 4, 5].map((photoSlotCount) => ({
        photoSlotCount,
        templates: visible.filter(
          (template) => template.photoSlotCount === photoSlotCount
        ),
      })),
    [visible]
  );

  const hasFilters = Boolean(query.trim()) || filter !== "ALL";

  function clearFilters() {
    setQuery("");
    setFilter("ALL");
  }

  return (
    <div className={styles["templates-page"]}>
      <main className={styles["templates-main"]}>
        <section className={styles["templates-hero"]}>
          <div>
            <p className={styles.eyebrow}>✦ USBOOTH TEMPLATES</p>
            <h1>
              Give every memory
              <br />
              <em>its own little look.</em>
            </h1>
            <p className={styles["templates-intro"]}>
              Browse the full collection with real artwork previews. Find a
              layout first, then choose it when you capture your memory.
            </p>
          </div>
          <Link href="/" className={styles["templates-back"]}>
            ← BACK TO HOME
          </Link>
        </section>

        <section className={styles["template-controls"]} aria-label="Template filters">
          <div className={styles["template-filter-row"]}>
            <div className={styles["template-tabs"]} role="tablist" aria-label="Filter by plan">
              {(["ALL", "FREE", "PLUS", "PRO"] as Filter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={filter === item}
                  className={filter === item ? styles.active : ""}
                  onClick={() => setFilter(item)}
                >
                  {item}
                  <span>{counts[item]}</span>
                </button>
              ))}
            </div>
            <span className={styles["template-result-count"]} aria-live="polite">
              Showing {visible.length} of {templates.length}
            </span>
          </div>

          <div className={styles["template-search-wrap"]}>
            <span aria-hidden="true">⌕</span>
            <input
              className={styles["template-search"]}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or style..."
              aria-label="Search templates by name or style"
            />
            {query && (
              <button
                type="button"
                className={styles["template-clear"]}
                onClick={() => setQuery("")}
                aria-label="Clear template search"
              >
                ×
              </button>
            )}
          </div>
        </section>

        {visible.length === 0 ? (
          <div className={styles["template-empty"]}>
            <span>♡</span>
            <h2>Nothing found.</h2>
            <p>Try another word or clear the filters to see every template.</p>
            <button type="button" onClick={clearFilters}>
              SHOW ALL TEMPLATES
            </button>
          </div>
        ) : (
          <div className={styles["template-sections"]} aria-label="UsBooth templates by photo slot count">
            {templateSections.map((section) => (
              <section key={section.photoSlotCount} className={styles["template-section"]}>
                <div className={styles["template-section-head"]}>
                  <div>
                    <span className={styles.eyebrow}>✦ PHOTO SLOT COLLECTION</span>
                    <h2>{section.photoSlotCount === 1 ? "SOLO / 1 SHOT" : section.photoSlotCount + " PHOTO SLOTS"}</h2>
                  </div>
                  <span className={styles["template-section-count"]}>
                    {section.templates.length} design{section.templates.length === 1 ? "" : "s"}
                  </span>
                </div>

                {section.templates.length ? (
                  <div className={styles["template-grid"]}>
                    {section.templates.map((template) => (
                      <article
                        key={template.id}
                        className={styles["template-card"] + " " + (
                          template.plan === "PRO"
                            ? styles["template-pro"]
                            : template.plan === "PLUS"
                              ? styles["template-plus"]
                              : ""
                        )}
                      >
                        <div className={styles["template-preview"]}>
                          <TemplatePreview templateId={template.id} name={template.name} />
                          <span className={styles["template-plan"]}>{template.plan}</span>
                        </div>
                        <div className={styles["template-info"]}>
                          <div>
                            <h2>{template.name}</h2>
                            <p>{template.tag}</p>
                          </div>
                          <span className={styles["template-arrow"]} aria-hidden="true">↗</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={styles["template-section-empty"]}>
                    New {section.photoSlotCount === 1 ? "solo" : section.photoSlotCount + "-slot"} designs will appear here.
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {hasFilters && visible.length > 0 && (
          <div className={styles["template-bottom-action"]}>
            <button type="button" onClick={clearFilters}>
              CLEAR FILTERS
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

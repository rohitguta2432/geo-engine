"use client";

import { useState } from "react";
import type { Asset } from "@/lib/types";

type Tab = "preview" | "markdown" | "schema";

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn-ghost px-3 py-1.5 text-xs"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

/** Modal that previews a generated asset: rendered HTML, raw markdown, JSON-LD. */
export function ContentModal({
  asset,
  loading,
  onClose,
}: {
  asset: Asset | null;
  loading: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("preview");
  if (!loading && !asset) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {loading || !asset ? (
          <div className="grid h-72 place-items-center text-sm text-[var(--muted)]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
              Writing citation-optimized content…
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="chip uppercase">{asset.type}</span>
                  <span className="text-xs text-[var(--muted)]">for “{asset.prompt}”</span>
                </div>
                <h3 className="text-lg font-semibold">{asset.title}</h3>
              </div>
              <button className="btn-ghost px-2.5 py-1.5 text-sm" onClick={onClose}>
                ✕
              </button>
            </div>

            <div className="flex items-center gap-1 border-b border-[var(--border)] px-4 pt-3">
              {(["preview", "markdown", "schema"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`-mb-px rounded-t-lg border-b-2 px-3 py-2 text-sm capitalize ${
                    tab === t
                      ? "border-[var(--accent)] text-[var(--text)]"
                      : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {t === "schema" ? "JSON-LD" : t}
                </button>
              ))}
              <div className="ml-auto pb-2">
                <CopyButton
                  text={
                    tab === "markdown"
                      ? asset.bodyMd
                      : tab === "schema"
                        ? asset.schemaJsonld
                        : asset.bodyHtml
                  }
                />
              </div>
            </div>

            <div className="overflow-auto p-5">
              {tab === "preview" && (
                <div
                  className="prose-geo"
                  dangerouslySetInnerHTML={{ __html: asset.bodyHtml }}
                />
              )}
              {tab === "markdown" && (
                <pre className="whitespace-pre-wrap font-mono text-xs text-[var(--muted)]">
                  {asset.bodyMd}
                </pre>
              )}
              {tab === "schema" && (
                <pre className="whitespace-pre-wrap font-mono text-xs text-[var(--muted)]">
                  {asset.schemaJsonld}
                </pre>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

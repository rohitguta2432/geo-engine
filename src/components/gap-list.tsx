"use client";

import { useState } from "react";
import type { AssetType, GapPrompt } from "@/lib/types";
import { engineLabel } from "@/lib/engines/labels";

const TYPES: { id: AssetType; label: string }[] = [
  { id: "qa", label: "FAQ page" },
  { id: "comparison", label: "Comparison" },
  { id: "listicle", label: "Listicle" },
];

function GapRow({
  gap,
  busy,
  onGenerate,
}: {
  gap: GapPrompt;
  busy: boolean;
  onGenerate: (prompt: string, type: AssetType) => void;
}) {
  const [type, setType] = useState<AssetType>("qa");
  return (
    <div className="flex flex-col gap-3 border-t border-[var(--border)] p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{gap.prompt}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[var(--muted)]">Rivals cited:</span>
          {gap.competitorsFound.map((c) => (
            <span key={c} className="chip">
              {c}
            </span>
          ))}
          {gap.engines.map((e) => (
            <span key={e} className="chip border-[var(--accent)]/40 text-[var(--accent)]">
              {engineLabel(e)}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AssetType)}
          className="input w-auto py-2"
          disabled={busy}
        >
          {TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          className="btn-primary whitespace-nowrap py-2"
          disabled={busy}
          onClick={() => onGenerate(gap.prompt, type)}
        >
          {busy ? "Writing…" : "Generate"}
        </button>
      </div>
    </div>
  );
}

export function GapList({
  gaps,
  busyPrompt,
  onGenerate,
}: {
  gaps: GapPrompt[];
  busyPrompt: string | null;
  onGenerate: (prompt: string, type: AssetType) => void;
}) {
  if (gaps.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-[var(--muted)]">
        No gaps found — your brand is showing up wherever competitors are. 🎉
      </div>
    );
  }
  return (
    <div>
      {gaps.map((g) => (
        <GapRow
          key={g.prompt}
          gap={g}
          busy={busyPrompt === g.prompt}
          onGenerate={onGenerate}
        />
      ))}
    </div>
  );
}

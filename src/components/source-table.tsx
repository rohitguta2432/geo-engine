import type { CitationSource } from "@/lib/types";

const OWNER_BADGE: Record<
  CitationSource["owner"],
  { label: string; cls: string } | null
> = {
  brand: { label: "YOU", cls: "bg-[var(--accent)] text-white" },
  competitor: {
    label: "RIVAL",
    cls: "border border-[var(--bad)]/40 text-[var(--bad)]",
  },
  "third-party": null,
};

/**
 * Where the answer-engines source their answers. Third-party rows (no badge)
 * are the actionable GEO target list — sites to earn a mention on so the
 * engines start citing the brand instead of only its rivals.
 */
export function SourceTable({ sources }: { sources: CitationSource[] }) {
  if (sources.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-[var(--muted)]">
        No citations recorded — the engines answered without surfacing sources.
      </div>
    );
  }

  const max = Math.max(1, ...sources.map((s) => s.count));
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--panel-2)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
            <th className="px-4 py-2.5 font-medium">#</th>
            <th className="px-4 py-2.5 font-medium">Source domain</th>
            <th className="px-4 py-2.5 font-medium">Citation frequency</th>
            <th className="px-4 py-2.5 text-right font-medium">Prompts</th>
            <th className="px-4 py-2.5 text-right font-medium">Cited</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s, i) => {
            const badge = OWNER_BADGE[s.owner];
            const mine = s.owner === "brand";
            return (
              <tr
                key={s.domain}
                className={`border-t border-[var(--border)] ${mine ? "bg-[var(--accent)]/10" : ""}`}
              >
                <td className="px-4 py-3 tabular-nums text-[var(--muted)]">{i + 1}</td>
                <td className="px-4 py-3">
                  <a
                    href={`https://${s.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:text-[var(--accent)]"
                  >
                    {s.domain}
                  </a>
                  {badge && (
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}
                    >
                      {s.owner === "competitor" && s.ownerName
                        ? s.ownerName
                        : badge.label}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-[var(--panel-2)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(s.count / max) * 100}%`,
                        background: mine ? "var(--accent)" : "var(--muted)",
                      }}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--muted)]">
                  {s.prompts}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{s.count}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

import type { AuditScore } from "@/lib/types";

/** Brand-vs-competitor share-of-voice leaderboard. */
export function CompetitorTable({
  leaderboard,
  brand,
}: {
  leaderboard: AuditScore["leaderboard"];
  brand: string;
}) {
  const max = Math.max(1, ...leaderboard.map((r) => r.mentions));
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--panel-2)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
            <th className="px-4 py-2.5 font-medium">#</th>
            <th className="px-4 py-2.5 font-medium">Brand</th>
            <th className="px-4 py-2.5 font-medium">Share of voice</th>
            <th className="px-4 py-2.5 text-right font-medium">Mentions</th>
            <th className="px-4 py-2.5 text-right font-medium">Citations</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((row, i) => {
            const you = row.name === brand;
            return (
              <tr
                key={row.name}
                className={`border-t border-[var(--border)] ${you ? "bg-[var(--accent)]/10" : ""}`}
              >
                <td className="px-4 py-3 tabular-nums text-[var(--muted)]">{i + 1}</td>
                <td className="px-4 py-3 font-medium">
                  {row.name}
                  {you && (
                    <span className="ml-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-white">
                      YOU
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-[var(--panel-2)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(row.mentions / max) * 100}%`,
                          background: you ? "var(--accent)" : "var(--muted)",
                        }}
                      />
                    </div>
                    <span className="tabular-nums text-xs text-[var(--muted)]">{row.share}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{row.mentions}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {row.citations > 0 ? (
                    <span className="text-[var(--good)]">{row.citations}</span>
                  ) : (
                    <span className="text-[var(--muted)]">0</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

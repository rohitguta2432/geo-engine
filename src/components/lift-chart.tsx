"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LiftPoint } from "@/lib/types";

/** Visibility-over-time line, plotted across a project's completed audits. */
export function LiftChart({ lift }: { lift: LiftPoint[] }) {
  const data = lift.map((p, i) => ({
    n: `#${i + 1}`,
    score: p.visibilityScore,
    date: new Date(p.at).toLocaleDateString(),
  }));

  if (data.length < 2) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Run the audit again after publishing content to chart your visibility lift over time.
        {data.length === 1 && ` Baseline: ${data[0].score}.`}
      </p>
    );
  }

  const first = data[0].score;
  const last = data[data.length - 1].score;
  const delta = +(last - first).toFixed(1);

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums">{last}</span>
        <span
          className={`text-sm font-medium ${delta >= 0 ? "text-[var(--good)]" : "text-[var(--bad)]"}`}
        >
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} since baseline
        </span>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <XAxis dataKey="n" stroke="var(--muted)" fontSize={12} tickLine={false} />
            <YAxis domain={[0, 100]} stroke="var(--muted)" fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--panel-2)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--text)",
              }}
              labelFormatter={(_l, p) => p?.[0]?.payload?.date ?? ""}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "var(--accent)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function tone(score: number): { color: string; label: string } {
  if (score >= 65) return { color: "var(--good)", label: "Strong" };
  if (score >= 35) return { color: "var(--warn)", label: "Emerging" };
  return { color: "var(--bad)", label: "Invisible" };
}

/** Circular 0-100 visibility gauge. */
export function ScoreGauge({ score, size = 168 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const { color, label } = tone(score);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={10} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold tabular-nums" style={{ color }}>
          {score.toFixed(0)}
        </span>
        <span className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</span>
      </div>
    </div>
  );
}

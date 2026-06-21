"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuditView } from "@/lib/audit/view";
import type { Asset, AssetType } from "@/lib/types";
import { engineLabel } from "@/lib/engines/labels";
import { ScoreGauge } from "@/components/score-gauge";
import { CompetitorTable } from "@/components/competitor-table";
import { SourceTable } from "@/components/source-table";
import { GapList } from "@/components/gap-list";
import { LiftChart } from "@/components/lift-chart";
import { ContentModal } from "@/components/content-modal";

function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    completed: ["Completed", "var(--good)"],
    running: ["Running", "var(--warn)"],
    pending: ["Queued", "var(--muted)"],
    error: ["Error", "var(--bad)"],
  };
  const [label, color] = map[status] ?? [status, "var(--muted)"];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
      style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-[var(--muted)]">{sub}</div>}
    </div>
  );
}

export function AuditDashboard({ initial }: { initial: AuditView }) {
  const router = useRouter();
  const [view, setView] = useState<AuditView>(initial);
  const [busyPrompt, setBusyPrompt] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [reauditing, setReauditing] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { audit, project, score, lift } = view;
  const live = audit.status === "running" || audit.status === "pending";

  useEffect(() => {
    if (!live) {
      if (timer.current) clearInterval(timer.current);
      return;
    }
    timer.current = setInterval(async () => {
      const res = await fetch(`/api/audit/${audit.id}`, { cache: "no-store" });
      if (res.ok) setView(await res.json());
    }, 2000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [live, audit.id]);

  const onGenerate = useCallback(
    async (prompt: string, type: AssetType) => {
      setBusyPrompt(prompt);
      setGenError(null);
      setAsset(null);
      setModalLoading(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ projectId: project.id, auditId: audit.id, prompt, type }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Generation failed");
        setAsset(data as Asset);
      } catch (e) {
        setGenError((e as Error).message);
      } finally {
        setModalLoading(false);
        setBusyPrompt(null);
      }
    },
    [project.id, audit.id],
  );

  async function reaudit() {
    setReauditing(true);
    const res = await fetch("/api/reaudit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId: project.id }),
    });
    const data = await res.json();
    if (res.ok) router.push(`/audit/${data.auditId}`);
    else setReauditing(false);
  }

  const pct = audit.progressTotal
    ? Math.round((audit.progressDone / audit.progressTotal) * 100)
    : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1.5 flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.brand}</h1>
            <StatusPill status={audit.status} />
          </div>
          <p className="text-sm text-[var(--muted)]">
            {project.domain} · {project.category}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {audit.engines.map((e) => (
              <span key={e} className="chip">
                {engineLabel(e)}
              </span>
            ))}
          </div>
        </div>
        <button className="btn-ghost" onClick={reaudit} disabled={reauditing || live}>
          {reauditing ? "Starting…" : "↻ Re-run audit"}
        </button>
      </div>

      {/* Live progress */}
      {live && (
        <div className="card mb-6 p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Probing answer engines…</span>
            <span className="tabular-nums text-[var(--muted)]">
              {audit.progressDone} / {audit.progressTotal}
            </span>
          </div>
          <div className="shimmer h-2.5 w-full overflow-hidden rounded-full bg-[var(--panel-2)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] transition-all"
              style={{ width: `${Math.max(4, pct)}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Generating buyer-intent prompts, asking each engine, and detecting whether {project.brand} gets cited.
          </p>
        </div>
      )}

      {audit.status === "error" && (
        <div className="card mb-6 border-[var(--bad)]/40 p-5 text-sm text-[var(--bad)]">
          Audit failed: {audit.error}
        </div>
      )}

      {genError && (
        <div className="card mb-6 border-[var(--bad)]/40 p-4 text-sm text-[var(--bad)]">
          {genError}
        </div>
      )}

      {score && (
        <>
          {/* Score + stats */}
          <div className="mb-6 grid gap-4 lg:grid-cols-[auto_1fr]">
            <div className="card flex items-center justify-center p-6">
              <div className="flex flex-col items-center gap-2">
                <ScoreGauge score={score.visibilityScore} />
                <span className="text-sm font-medium text-[var(--muted)]">Visibility Score</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat
                label="Brand citation rate"
                value={`${score.brandCitationRate}%`}
                sub="answers citing your domain"
              />
              <Stat
                label="Surfaced in"
                value={`${score.promptsWithBrand}/${score.promptsTotal}`}
                sub="engine answers"
              />
              <Stat label="Gaps found" value={`${score.gaps.length}`} sub="prompts to win" />
              <Stat label="Competitors tracked" value={`${project.competitors.length}`} />
              <Stat label="Prompts probed" value={`${audit.promptCount}`} />
              <Stat label="Engines" value={`${audit.engines.length}`} />
            </div>
          </div>

          {/* Leaderboard */}
          <section className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">Share of voice</h2>
            <CompetitorTable leaderboard={score.leaderboard} brand={project.brand} />
          </section>

          {/* Cited sources */}
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Top cited sources</h2>
              <span className="text-sm text-[var(--muted)]">
                Domains the engines pull answers from — earn a mention to get cited
              </span>
            </div>
            <SourceTable sources={score.sources} />
          </section>

          {/* Gaps */}
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Citation gaps</h2>
              <span className="text-sm text-[var(--muted)]">
                Queries where rivals are cited but you&apos;re invisible
              </span>
            </div>
            <div className="card overflow-hidden">
              <GapList gaps={score.gaps} busyPrompt={busyPrompt} onGenerate={onGenerate} />
            </div>
          </section>

          {/* Lift */}
          <section className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">Visibility over time</h2>
            <div className="card p-5">
              <LiftChart lift={lift} />
            </div>
          </section>

          {/* Raw results */}
          <ResultsExplorer view={view} />
        </>
      )}

      {!score && !live && audit.status !== "error" && (
        <div className="card p-8 text-center text-sm text-[var(--muted)]">
          No results yet.
        </div>
      )}

      <ContentModal
        asset={asset}
        loading={modalLoading}
        onClose={() => {
          if (!modalLoading) setAsset(null);
        }}
      />
    </div>
  );
}

function ResultsExplorer({ view }: { view: AuditView }) {
  const [open, setOpen] = useState(false);
  const results = view.results;
  if (!results.length) return null;
  return (
    <section className="mb-6">
      <button
        className="btn-ghost mb-3"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Hide" : "Show"} raw engine answers ({results.length})
      </button>
      {open && (
        <div className="space-y-2">
          {results.map((r) => (
            <details key={r.id} className="card p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip">{engineLabel(r.engine)}</span>
                  <span className="flex-1 truncate text-sm">{r.prompt}</span>
                  {r.brandCited ? (
                    <span className="chip border-[var(--good)]/40 text-[var(--good)]">cited</span>
                  ) : r.brandMentioned ? (
                    <span className="chip border-[var(--warn)]/40 text-[var(--warn)]">mentioned</span>
                  ) : (
                    <span className="chip border-[var(--bad)]/40 text-[var(--bad)]">absent</span>
                  )}
                </div>
              </summary>
              <div className="mt-3 whitespace-pre-wrap text-sm text-[var(--muted)]">
                {r.answer.slice(0, 1200)}
                {r.answer.length > 1200 ? "…" : ""}
              </div>
              {r.citations.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.citations.slice(0, 8).map((c, i) => (
                    <a
                      key={i}
                      href={c}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chip hover:text-[var(--text)]"
                    >
                      {hostOf(c)}
                    </a>
                  ))}
                </div>
              )}
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

function hostOf(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}

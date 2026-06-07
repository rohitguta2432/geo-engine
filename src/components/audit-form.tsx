"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EngineOpt {
  id: string;
  label: string;
}

export function AuditForm({ engines }: { engines: EngineOpt[] }) {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [domain, setDomain] = useState("");
  const [category, setCategory] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [selected, setSelected] = useState<string[]>(engines.map((e) => e.id));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noEngines = engines.length === 0;

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          brand: brand.trim(),
          domain: domain.trim(),
          category: category.trim(),
          competitors: competitors
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          engines: selected,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.formErrors?.[0] ?? data?.error ?? "Request failed");
      router.push(`/audit/${data.auditId}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Brand name</label>
          <input
            className="input"
            placeholder="MyFinancial"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Domain</label>
          <input
            className="input"
            placeholder="myfinancial.in"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Category / what you do</label>
        <input
          className="input"
          placeholder="SEBI-registered investment advisory for retail investors"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />
      </div>

      <div className="mt-4">
        <label className="label">Competitors (comma-separated, optional)</label>
        <input
          className="input"
          placeholder="Zerodha, Groww, ET Money"
          value={competitors}
          onChange={(e) => setCompetitors(e.target.value)}
        />
      </div>

      <div className="mt-5">
        <label className="label">Answer engines to probe</label>
        {noEngines ? (
          <div className="rounded-xl border border-[var(--warn)]/40 bg-[var(--warn)]/10 px-4 py-3 text-sm text-[var(--warn)]">
            No engine credentials detected. Set <code>ANTHROPIC_API_KEY</code> in{" "}
            <code>.env.local</code> and restart to run a live audit.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {engines.map((e) => {
              const on = selected.includes(e.id);
              return (
                <button
                  type="button"
                  key={e.id}
                  onClick={() => toggle(e.id)}
                  className={`rounded-xl border px-3.5 py-2 text-sm transition-colors ${
                    on
                      ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--text)]"
                      : "border-[var(--border)] bg-[var(--panel-2)] text-[var(--muted)]"
                  }`}
                >
                  {on ? "✓ " : ""}
                  {e.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-[var(--bad)]/10 px-3 py-2 text-sm text-[var(--bad)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn-primary mt-6 w-full py-3 text-base"
        disabled={submitting || noEngines || selected.length === 0}
      >
        {submitting ? "Starting audit…" : "Run free AI visibility audit →"}
      </button>
      <p className="mt-2 text-center text-xs text-[var(--muted)]">
        Probes each engine with ~12 buyer-intent queries. Takes about a minute.
      </p>
    </form>
  );
}

import { AuditForm } from "@/components/audit-form";
import { availableEngines } from "@/lib/engines";

const STEPS = [
  {
    n: "01",
    t: "Audit",
    d: "We ask ChatGPT, Claude, Perplexity & Google AI Overviews the buyer-intent questions your customers actually type — and record who gets cited.",
  },
  {
    n: "02",
    t: "Diagnose",
    d: "A Visibility Score and share-of-voice leaderboard show exactly where competitors are recommended and you're invisible.",
  },
  {
    n: "03",
    t: "Generate",
    d: "One click writes citation-optimized content — FAQ pages, comparisons, listicles — with Schema.org JSON-LD baked in.",
  },
  {
    n: "04",
    t: "Track",
    d: "Re-run the audit after publishing to chart your visibility lift over time, engine by engine.",
  },
];

export default function Home() {
  const engines = availableEngines().map((e) => ({ id: e.id, label: e.label }));

  return (
    <main className="mx-auto w-full max-w-6xl px-5">
      {/* Hero */}
      <section className="grid items-start gap-10 py-12 lg:grid-cols-2 lg:py-20">
        <div className="lg:pt-6">
          <div className="chip mb-5 border-[var(--accent)]/40 text-[var(--accent)]">
            Generative Engine Optimization
          </div>
          <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            Do AI engines recommend{" "}
            <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">
              you
            </span>{" "}
            — or your competitors?
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--muted)]">
            Search is moving from ten blue links to a single AI answer. EchoRank shows
            whether ChatGPT, Claude, Perplexity and Google&apos;s AI Overviews cite your
            brand — then auto-generates the content that closes the gap.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              ["4", "answer engines"],
              ["~12", "buyer-intent probes"],
              ["1-click", "content fixes"],
            ].map(([a, b]) => (
              <div key={b}>
                <div className="text-2xl font-bold">{a}</div>
                <div className="text-xs text-[var(--muted)]">{b}</div>
              </div>
            ))}
          </div>
        </div>

        <div id="audit">
          <AuditForm engines={engines} />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[var(--border)] py-14">
        <h2 className="mb-2 text-2xl font-bold">From invisible to cited, in four steps</h2>
        <p className="mb-8 max-w-xl text-[var(--muted)]">
          The full GEO loop — measure, diagnose, fix, and prove the lift.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-5">
              <div className="mb-3 font-mono text-sm text-[var(--accent)]">{s.n}</div>
              <h3 className="mb-1.5 text-lg font-semibold">{s.t}</h3>
              <p className="text-sm leading-relaxed text-[var(--muted)]">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

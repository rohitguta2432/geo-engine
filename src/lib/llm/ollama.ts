import { config } from "@/lib/config";

/** Strip <think>...</think> blocks emitted by reasoning models (e.g. qwen3). */
export function stripThink(s: string): string {
  return s.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

/**
 * Local generation via Ollama — free, used for the high-volume cheap steps
 * (prompt-set generation, drafts). Throws if Ollama is unreachable so callers
 * can fall back to Claude.
 */
export async function ollamaChat(opts: {
  system?: string;
  prompt: string;
  json?: boolean;
  temperature?: number;
}): Promise<string> {
  const res = await fetch(`${config.ollama.host.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: config.ollama.model,
      stream: false,
      think: false,
      messages: [
        ...(opts.system ? [{ role: "system", content: opts.system }] : []),
        { role: "user", content: opts.prompt },
      ],
      ...(opts.json ? { format: "json" } : {}),
      options: { temperature: opts.temperature ?? 0.4 },
    }),
    // Local models can be slow on first load; give them room.
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`ollama ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { message?: { content?: string } };
  return stripThink(data.message?.content ?? "");
}

import Anthropic from "@anthropic-ai/sdk";
import { config } from "@/lib/config";

let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: config.anthropic.apiKey,
      baseURL: config.anthropic.baseURL,
    });
  }
  return _client;
}

export interface ClaudeAnswer {
  text: string;
  citations: string[];
  webSearchUsed: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseBlocks(content: any[], webSearchUsed: boolean): ClaudeAnswer {
  const textParts: string[] = [];
  const urls = new Set<string>();
  let usedTool = webSearchUsed;

  for (const block of content ?? []) {
    if (block?.type === "text") {
      if (typeof block.text === "string") textParts.push(block.text);
      for (const c of block.citations ?? []) {
        if (c?.url) urls.add(c.url);
      }
    } else if (block?.type === "web_search_tool_result") {
      usedTool = true;
      const inner = Array.isArray(block.content) ? block.content : [];
      for (const r of inner) {
        if (r?.url) urls.add(r.url);
      }
    } else if (block?.type === "server_tool_use") {
      usedTool = true;
    }
  }

  return { text: textParts.join("\n").trim(), citations: [...urls], webSearchUsed: usedTool };
}

/**
 * Ask Claude a question with its live web-search tool, so the answer reflects
 * what an AI answer-engine would actually say. Falls back to a plain completion
 * if the configured model/gateway rejects server-side tools.
 */
export async function askClaudeWithWebSearch(
  prompt: string,
  model = config.anthropic.auditModel,
): Promise<ClaudeAnswer> {
  const client = anthropic();
  const messages = [{ role: "user" as const, content: prompt }];
  const webSearchTool = { type: "web_search_20250305", name: "web_search", max_uses: 5 };

  try {
    const res = await client.messages.create({
      model,
      max_tokens: 1024,
      messages,
      tools: [webSearchTool] as any,
    });
    return parseBlocks(res.content as any[], true);
  } catch {
    const res = await client.messages.create({ model, max_tokens: 1024, messages });
    return parseBlocks(res.content as any[], false);
  }
}

export async function claudeComplete(opts: {
  system?: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  const client = anthropic();
  const res = await client.messages.create({
    model: opts.model ?? config.anthropic.contentModel,
    max_tokens: opts.maxTokens ?? 2048,
    ...(opts.system ? { system: opts.system } : {}),
    messages: [{ role: "user", content: opts.prompt }],
  });
  const out: string[] = [];
  for (const block of res.content as any[]) {
    if (block?.type === "text" && typeof block.text === "string") out.push(block.text);
  }
  return out.join("\n").trim();
}

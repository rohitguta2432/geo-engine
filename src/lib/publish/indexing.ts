import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";
import { config } from "@/lib/config";

/**
 * Notify Google's Indexing API that a URL was published/updated so AI engines
 * (which lean on fresh, indexed pages) pick it up faster. Reuses an existing
 * service-account JSON via GOOGLE_INDEXING_SA; no-ops gracefully when absent.
 */

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

let saCache: ServiceAccount | null = null;
function loadSa(): ServiceAccount {
  if (saCache) return saCache;
  const raw = readFileSync(config.google.indexingSaPath, "utf8");
  saCache = JSON.parse(raw) as ServiceAccount;
  return saCache;
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

async function getAccessToken(): Promise<string> {
  const sa = loadSa();
  const tokenUri = sa.token_uri ?? "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/indexing",
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claim}`;
  const signature = createSign("RSA-SHA256")
    .update(signingInput)
    .sign(sa.private_key)
    .toString("base64url");
  const assertion = `${signingInput}.${signature}`;

  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`token ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("no access_token from Google");
  return data.access_token;
}

export interface IndexResult {
  url: string;
  ok: boolean;
  error?: string;
}

/**
 * Ping Google for each URL. Returns a per-URL result list; when no SA is
 * configured every entry is reported as skipped (ok:false, error:"disabled")
 * so callers can degrade without throwing.
 */
export async function publishIndexing(
  urls: string[],
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED",
): Promise<{ enabled: boolean; results: IndexResult[] }> {
  if (!config.google.indexingEnabled) {
    return {
      enabled: false,
      results: urls.map((url) => ({ url, ok: false, error: "indexing disabled (set GOOGLE_INDEXING_SA)" })),
    };
  }

  const token = await getAccessToken();
  const results = await Promise.all(
    urls.map(async (url): Promise<IndexResult> => {
      try {
        const res = await fetch(
          "https://indexing.googleapis.com/v3/urlNotifications:publish",
          {
            method: "POST",
            headers: {
              authorization: `Bearer ${token}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({ url, type }),
            signal: AbortSignal.timeout(20_000),
          },
        );
        if (!res.ok) return { url, ok: false, error: `${res.status} ${await res.text()}` };
        return { url, ok: true };
      } catch (e) {
        return { url, ok: false, error: (e as Error).message };
      }
    }),
  );
  return { enabled: true, results };
}

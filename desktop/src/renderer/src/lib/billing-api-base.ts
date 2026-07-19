import { LANDED_API_ORIGIN } from "./landed-urls";

/** Packaged / production billing host — never depends on local `npm run dev`. */
export const DEFAULT_API_BASE = LANDED_API_ORIGIN;

let cachedApiBase: string | null = null;
let bootstrapPromise: Promise<string> | null = null;

function normalizeBase(raw: string | undefined | null): string | undefined {
  const trimmed = raw?.trim().replace(/\/$/, "");
  return trimmed || undefined;
}

function isLocalhost(url: string): boolean {
  return url.includes("localhost") || url.includes("127.0.0.1");
}

/**
 * Only accept an explicit remote API base from Vite env.
 * Localhost is intentionally ignored — billing always hits the deployed API
 * so checkout works without a local Next.js process.
 */
function readBuiltInApiBase(): string | undefined {
  const raw = normalizeBase(import.meta.env.VITE_API_BASE_URL);
  if (!raw || isLocalhost(raw)) return undefined;
  return raw;
}

async function probeApiBase(base: string): Promise<boolean> {
  try {
    const res = await fetch(`${base}/api/pricing`, {
      method: "GET",
      signal: AbortSignal.timeout(4_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function getApiBaseSync(): string {
  return cachedApiBase ?? readBuiltInApiBase() ?? DEFAULT_API_BASE;
}

/** Force the next resolveApiBase() call to re-probe (e.g. after a fetch failure). */
export function clearApiBaseCache(): void {
  cachedApiBase = null;
  bootstrapPromise = null;
}

/**
 * Prefer a reachable billing API. Never stick on dead localhost —
 * fall back to the production origin (landed-ai.com).
 */
export async function resolveApiBase(): Promise<string> {
  if (cachedApiBase) return cachedApiBase;

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const candidates: string[] = [];
      const builtIn = readBuiltInApiBase();
      if (builtIn) candidates.push(builtIn);

      try {
        const fromMain = normalizeBase(await window.landed?.getApiBaseUrl?.());
        if (fromMain && !isLocalhost(fromMain) && !candidates.includes(fromMain)) {
          candidates.push(fromMain);
        }
      } catch {
        // ignore IPC failures
      }

      if (!candidates.includes(DEFAULT_API_BASE)) {
        candidates.push(DEFAULT_API_BASE);
      }

      for (const candidate of candidates) {
        if (await probeApiBase(candidate)) {
          cachedApiBase = candidate;
          return cachedApiBase;
        }
      }

      // Last resort: use production even if the probe failed (offline / transient).
      cachedApiBase = DEFAULT_API_BASE;
      return cachedApiBase;
    })().finally(() => {
      bootstrapPromise = null;
    });
  }

  return bootstrapPromise;
}

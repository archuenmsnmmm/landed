/** Dev-only OpenAI key bootstrap. Production uses authenticated /api/* routes. */

let cachedKey: string | undefined;
let bootstrapPromise: Promise<string | undefined> | null = null;

function readBuiltInKey(): string | undefined {
  const key = import.meta.env.VITE_OPENAI_API_KEY?.trim();
  return key || undefined;
}

export function getOpenAIKeySync(): string | undefined {
  return cachedKey || readBuiltInKey();
}

export async function bootstrapOpenAIKey(): Promise<string | undefined> {
  if (cachedKey) return cachedKey;

  const builtIn = readBuiltInKey();
  if (builtIn) {
    cachedKey = builtIn;
    return cachedKey;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = window.landed
      ?.getOpenAIKey?.()
      .then((key) => {
        const trimmed = key?.trim();
        cachedKey = trimmed || undefined;
        return cachedKey;
      })
      .catch(() => undefined)
      .finally(() => {
        bootstrapPromise = null;
      });
  }

  return bootstrapPromise;
}

export async function getOpenAIKey(): Promise<string | undefined> {
  const existing = getOpenAIKeySync();
  if (existing) return existing;
  return bootstrapOpenAIKey();
}

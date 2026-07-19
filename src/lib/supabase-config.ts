function projectRefFromJwt(token: string | undefined): string | null {
  if (!token?.trim()) return null;
  const parts = token.trim().split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as { ref?: string };
    return payload.ref ?? null;
  } catch {
    return null;
  }
}

function projectRefFromUrl(url: string | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const host = new URL(url).hostname;
    const ref = host.split(".")[0];
    return ref || null;
  } catch {
    return null;
  }
}

export type SupabaseConfigStatus = {
  url: boolean;
  serviceRoleKey: boolean;
  anonKey: boolean;
  projectRef: string | null;
  serviceRoleProjectRef: string | null;
  anonProjectRef: string | null;
  projectMatch: boolean;
};

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const url = (
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  )?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY
  )?.trim();

  const projectRef = projectRefFromUrl(url);
  const serviceRoleProjectRef = projectRefFromJwt(serviceRoleKey);
  const anonProjectRef = projectRefFromJwt(anonKey);

  const projectMatch = Boolean(
    projectRef &&
      serviceRoleProjectRef &&
      anonProjectRef &&
      projectRef === serviceRoleProjectRef &&
      projectRef === anonProjectRef,
  );

  return {
    url: Boolean(url),
    serviceRoleKey: Boolean(serviceRoleKey),
    anonKey: Boolean(anonKey),
    projectRef,
    serviceRoleProjectRef,
    anonProjectRef,
    projectMatch,
  };
}

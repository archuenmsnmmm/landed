import { getSupabase, isSupabaseConfigured } from "./supabase";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function isAvatarImage(avatar: string | undefined | null): boolean {
  if (!avatar) return false;
  return (
    avatar.startsWith("http://") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("data:image/")
  );
}

export function avatarInitial(name?: string, email?: string): string {
  return (name ?? email ?? "G")[0]?.toUpperCase() ?? "G";
}

export function resizeImageFile(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not process image"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image file"));
    };
    img.src = url;
  });
}

export async function uploadProfileAvatar(
  userId: string,
  file: File,
): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("Use a JPG, PNG, or WebP image");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be under 2 MB");
  }

  const dataUrl = await resizeImageFile(file);
  const supabase = getSupabase();

  if (isSupabaseConfigured() && supabase) {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const ext =
        file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : "jpg";
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: blob.type });

      if (!uploadError) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
        const { error: metaError } = await supabase.auth.updateUser({
          data: { avatar_url: publicUrl },
        });
        if (!metaError) return publicUrl;
      }
    } catch {
      // Fall back to metadata data URL below.
    }

    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: dataUrl },
    });
    if (error) throw new Error("Could not save profile photo");
    return dataUrl;
  }

  return dataUrl;
}

export async function removeProfileAvatar(
  name: string,
  email: string,
): Promise<string> {
  const initial = avatarInitial(name, email);
  const supabase = getSupabase();

  if (isSupabaseConfigured() && supabase) {
    await supabase.auth.updateUser({ data: { avatar_url: "" } });
  }

  return initial;
}

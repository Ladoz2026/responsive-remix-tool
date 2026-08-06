import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "property-images";

const cache = new Map<string, string>();

/**
 * Les fichiers du bucket sont privés : on résout les chemins de stockage
 * en URLs signées. Les URLs http externes sont renvoyées telles quelles.
 */
export async function resolveImageUrls(sources: string[]): Promise<string[]> {
  const toSign = sources.filter((s) => s && !/^https?:\/\//.test(s) && !cache.has(s));

  if (toSign.length > 0) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(toSign, 60 * 60);
    data?.forEach((item, i) => {
      const path = toSign[i]!;
      if (item.signedUrl) cache.set(path, item.signedUrl);
    });
  }

  return sources.map((s) => (/^https?:\/\//.test(s) ? s : (cache.get(s) ?? "")));
}

export async function uploadPropertyImages(userId: string, files: File[]): Promise<string[]> {
  const paths: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

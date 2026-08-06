import { useEffect, useState } from "react";
import { resolveImageUrls } from "@/lib/media";

export function useSignedImages(sources: string[] | undefined) {
  const key = (sources ?? []).join("|");
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const list = key ? key.split("|") : [];
    if (list.length === 0) {
      setUrls([]);
      return;
    }
    resolveImageUrls(list).then((resolved) => {
      if (active) setUrls(resolved.filter(Boolean));
    });
    return () => {
      active = false;
    };
  }, [key]);

  return urls;
}

import { useEffect, useRef, useState } from "react";

const BROWSER_KEY = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as
  | string
  | undefined;
const TRACKING_ID = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] as
  | string
  | undefined;

declare global {
  interface Window {
    google?: typeof globalThis & { maps: any };
    __initSeLogerMap?: () => void;
  }
}

let loaderPromise: Promise<void> | null = null;

function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise<void>((resolve, reject) => {
    window.__initSeLogerMap = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${BROWSER_KEY}&loading=async&callback=__initSeLogerMap${
      TRACKING_ID ? `&channel=${TRACKING_ID}` : ""
    }`;
    script.async = true;
    script.onerror = () => reject(new Error("maps"));
    document.head.appendChild(script);
  });
  return loaderPromise;
}

export function PropertyMap({
  latitude,
  longitude,
  title,
}: {
  latitude: number | null;
  longitude: number | null;
  title: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!BROWSER_KEY || latitude == null || longitude == null) return;
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !ref.current || !window.google?.maps) return;
        const center = { lat: latitude, lng: longitude };
        const map = new window.google.maps.Map(ref.current, {
          center,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
        });
        new window.google.maps.Marker({ position: center, map, title });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, title]);

  if (!BROWSER_KEY || latitude == null || longitude == null || failed) return null;

  return (
    <div className="mt-8 rounded-3xl bg-card p-6 shadow-soft sm:p-8">
      <h2 className="text-lg font-bold text-foreground">Localisation</h2>
      <div ref={ref} className="mt-4 h-72 w-full overflow-hidden rounded-2xl bg-secondary" />
    </div>
  );
}

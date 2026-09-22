import { createFileRoute } from "@tanstack/react-router";

const WP_URL =
  "https://api-seloger-ci.poroinfo.net/wp-json/wp/v2/annonces?_embed&per_page=50";

export const Route = createFileRoute("/api/annonces")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const res = await fetch(WP_URL);
          if (!res.ok) {
            return Response.json(
              { error: `WordPress API ${res.status}` },
              { status: 502 },
            );
          }
          const data = await res.json();
          return Response.json(data, {
            headers: { "Cache-Control": "public, max-age=60" },
          });
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "Erreur inconnue" },
            { status: 502 },
          );
        }
      },
    },
  },
});

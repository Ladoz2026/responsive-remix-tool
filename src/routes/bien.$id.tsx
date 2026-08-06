import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Bath, BedDouble, Mail, MapPin, Maximize, Phone } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { CtaFooter } from "@/components/site/CtaFooter";
import { useSignedImages } from "@/hooks/useSignedImages";
import { propertyQuery } from "@/lib/property-queries";
import { formatPrice, typeLabel } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/bien/$id")({
  head: () => ({
    meta: [
      { title: "Détail du bien — SeLoger CI" },
      {
        name: "description",
        content: "Photos, caractéristiques, localisation et contact de l'agence pour ce bien.",
      },
      { property: "og:title", content: "Détail du bien — SeLoger CI" },
      {
        property: "og:description",
        content: "Photos, caractéristiques, localisation et contact de l'agence pour ce bien.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PropertyDetail,
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery(propertyQuery(id));
  const [active, setActive] = useState(0);

  const property = data?.property;
  const sources = [
    ...(data?.gallery ?? []).map((g) => g.url),
    ...((property?.images as string[] | null) ?? []),
  ];
  const urls = useSignedImages(sources);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header solid />
        <p className="pt-40 text-center text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Header solid />
        <div className="mx-auto max-w-2xl px-4 pt-40 pb-24 text-center">
          <h1 className="text-2xl font-extrabold text-foreground">Bien introuvable</h1>
          <Link to="/recherche" className="mt-4 inline-block text-sm font-semibold text-gold">
            Retour à la recherche
          </Link>
        </div>
      </div>
    );
  }

  const amenities = [
    property.has_pool && "Piscine",
    property.has_garage && "Garage",
    property.has_garden && "Jardin",
    property.has_ac && "Climatisation",
    property.has_kitchen && "Cuisine équipée",
    property.is_furnished && "Meublé",
    ...((property.amenities as string[] | null) ?? []),
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header solid />
      <main className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-secondary">
          {urls[active] ? (
            <img
              src={urls[active]}
              alt={property.title}
              className="h-[420px] w-full object-cover"
            />
          ) : (
            <div className="grid h-[320px] place-items-center text-muted-foreground">
              Aucune photo disponible
            </div>
          )}
        </div>
        {urls.length > 1 && (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {urls.map((u, i) => (
              <button
                key={u}
                type="button"
                onClick={() => setActive(i)}
                className={`h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                  i === active ? "border-gold" : "border-transparent"
                }`}
              >
                <img src={u} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full gold-gradient px-3 py-1 text-xs font-bold text-accent-foreground">
                {property.transaction === "location" ? "Location" : "Vente"}
              </span>
              {property.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                  <BadgeCheck className="h-3.5 w-3.5 text-gold" /> Vérifié
                </span>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">
              {property.title}
            </h1>
            <p className="mt-2 inline-flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {[property.address, property.district, property.city].filter(Boolean).join(", ")}
            </p>
            <p className="mt-4 text-3xl font-extrabold text-foreground">
              {formatPrice(property.price, property.currency ?? "FCFA")}
            </p>

            <div className="mt-6 flex flex-wrap gap-6 rounded-2xl bg-secondary/60 p-5 text-sm text-foreground">
              <span>{typeLabel(property.property_type)}</span>
              <span className="inline-flex items-center gap-1.5">
                <BedDouble className="h-4 w-4" /> {property.bedrooms} chambres
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bath className="h-4 w-4" /> {property.bathrooms} sdb
              </span>
              {property.surface_m2 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Maximize className="h-4 w-4" /> {property.surface_m2} m²
                </span>
              ) : null}
            </div>

            {property.description && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-foreground">Description</h2>
                <p className="mt-3 whitespace-pre-line text-muted-foreground">
                  {property.description}
                </p>
              </div>
            )}

            {amenities.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-foreground">Équipements</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {amenities.map((a) => (
                    <span
                      key={a}
                      className="rounded-full border border-border px-4 py-1.5 text-sm text-foreground"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-soft lg:sticky lg:top-28">
            <h2 className="text-lg font-bold text-foreground">Contacter l'agence</h2>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-sm font-bold text-foreground">
                {(data?.agency?.full_name ?? "SeLoger CI").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {data?.agency?.full_name ?? "SeLoger CI"}
                </p>
                {data?.agency?.phone && (
                  <a
                    href={`tel:${data.agency.phone}`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
                  >
                    <Phone className="h-3.5 w-3.5" /> {data.agency.phone}
                  </a>
                )}
              </div>
            </div>
            <ContactForm propertyId={property.id} />
          </aside>
        </div>
      </main>
      <CtaFooter />
    </div>
  );
}

function ContactForm({ propertyId }: { propertyId: string }) {
  const [sending, setSending] = useState(false);

  return (
    <form
      className="mt-6 grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setSending(true);
        const { error } = await supabase.from("contact_requests").insert({
          property_id: propertyId,
          full_name: String(form.get("full_name") ?? "").trim().slice(0, 100),
          email: String(form.get("email") ?? "").trim().slice(0, 255),
          phone: String(form.get("phone") ?? "").trim().slice(0, 30),
          message: String(form.get("message") ?? "").trim().slice(0, 1000),
        });
        setSending(false);
        if (error) toast.error("Envoi impossible, réessayez.");
        else {
          toast.success("Demande envoyée à l'agence.");
          (e.target as HTMLFormElement).reset();
        }
      }}
    >
      <input
        name="full_name"
        required
        maxLength={100}
        placeholder="Votre nom"
        className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
      />
      <input
        name="email"
        type="email"
        required
        maxLength={255}
        placeholder="Votre email"
        className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
      />
      <input
        name="phone"
        maxLength={30}
        placeholder="Téléphone"
        className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
      />
      <textarea
        name="message"
        required
        maxLength={1000}
        rows={4}
        defaultValue="Bonjour, ce bien m'intéresse. Merci de me recontacter."
        className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
      />
      <button
        type="submit"
        disabled={sending}
        className="inline-flex items-center justify-center gap-2 rounded-full gold-gradient px-5 py-3 text-sm font-bold text-accent-foreground shadow-gold disabled:opacity-60"
      >
        <Mail className="h-4 w-4" />
        {sending ? "Envoi…" : "Envoyer la demande"}
      </button>
    </form>
  );
}

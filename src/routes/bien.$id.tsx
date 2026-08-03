import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Bath,
  BedDouble,
  Loader2,
  MapPin,
  Maximize,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Header } from "@/components/site/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, formatSurface } from "@/lib/format";
import fallbackImage from "@/assets/prop-house.jpg";

export const Route = createFileRoute("/bien/$id")({
  head: () => ({
    meta: [
      { title: "Détail du bien | SeLoger CI" },
      {
        name: "description",
        content:
          "Photos, équipements, localisation et contact direct pour ce bien immobilier vérifié en Côte d'Ivoire.",
      },
      { property: "og:title", content: "Détail du bien | SeLoger CI" },
      {
        property: "og:description",
        content: "Consultez les caractéristiques complètes de ce bien vérifié sur SeLoger CI.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PropertyDetail,
});

const contactSchema = z.object({
  full_name: z.string().trim().min(2, { message: "Nom requis" }).max(100),
  email: z.string().trim().email({ message: "E-mail invalide" }).max(255),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().min(10, { message: "Message trop court" }).max(1000),
});

const amenityLabels: Record<string, string> = {
  has_pool: "Piscine",
  has_garage: "Garage",
  has_garden: "Jardin",
  has_ac: "Climatisation",
  has_kitchen: "Cuisine équipée",
  is_furnished: "Meublé",
};

function PropertyDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [startingChat, setStartingChat] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", message: "" });

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .eq("status", "publie")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!property) return;
    void supabase.from("property_views").insert({
      property_id: property.id,
      viewer_id: user?.id ?? null,
    });
  }, [property, user?.id]);

  async function startConversation(ownerId: string) {
    if (!user) {
      toast.error("Connectez-vous pour discuter avec le vendeur.");
      return;
    }
    if (user.id === ownerId) {
      toast.error("Vous êtes le propriétaire de ce bien.");
      return;
    }
    setStartingChat(true);
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("property_id", id)
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .maybeSingle();
    if (!existing) {
      const { error } = await supabase.from("conversations").insert({
        property_id: id,
        participant_a: user.id,
        participant_b: ownerId,
      });
      if (error) {
        setStartingChat(false);
        toast.error("Impossible de démarrer la discussion.");
        return;
      }
    }
    setStartingChat(false);
    navigate({ to: "/messages" });
  }

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contact_requests").insert({
      property_id: id,
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      message: parsed.data.message,
    });
    setSending(false);
    if (error) {
      toast.error("Envoi impossible pour le moment.");
      return;
    }
    toast.success("Votre demande a bien été envoyée.");
    setForm({ full_name: "", email: "", phone: "", message: "" });
  }

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary/40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-secondary/40">
        <Header />
        <main className="mx-auto max-w-3xl px-4 pb-24 pt-40 text-center">
          <h1 className="text-2xl font-extrabold text-foreground">Bien introuvable</h1>
          <p className="mt-2 text-muted-foreground">
            Cette annonce n'existe plus ou n'est pas publiée.
          </p>
          <Link
            to="/recherche"
            className="mt-6 inline-flex rounded-full gold-gradient px-5 py-2.5 text-sm font-bold text-accent-foreground"
          >
            Voir les autres biens
          </Link>
        </main>
      </div>
    );
  }

  const images = property.images.length > 0 ? property.images : [fallbackImage];
  const amenities = Object.keys(amenityLabels).filter(
    (key) => (property as unknown as Record<string, boolean>)[key],
  );

  return (
    <div className="min-h-screen bg-secondary/40">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="overflow-hidden rounded-3xl bg-card shadow-soft">
              <img
                src={images[activeImage] ?? images[0]!}
                alt={property.title}
                className="h-[420px] w-full object-cover"
              />
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto p-4">
                  {images.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                        i === activeImage ? "border-gold" : "border-transparent"
                      }`}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 rounded-3xl bg-card p-6 shadow-soft sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full gold-gradient px-3 py-1 text-xs font-bold text-accent-foreground">
                  {property.transaction === "location" ? "Location" : "Vente"}
                </span>
                {property.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                    <BadgeCheck className="h-3.5 w-3.5 text-gold" /> Vérifié
                  </span>
                )}
                <span className="text-xs capitalize text-muted-foreground">
                  {property.property_type}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">
                {property.title}
              </h1>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {[property.district, property.city].filter(Boolean).join(", ")}
              </p>
              <p className="mt-4 text-2xl font-extrabold text-foreground">
                {formatPrice(property.price, property.currency, property.transaction === "location")}
              </p>

              <div className="mt-6 flex flex-wrap gap-6 border-y border-border py-5 text-sm text-muted-foreground">
                {property.bedrooms > 0 && (
                  <span className="inline-flex items-center gap-2">
                    <BedDouble className="h-4 w-4" /> {property.bedrooms} chambres
                  </span>
                )}
                {property.bathrooms > 0 && (
                  <span className="inline-flex items-center gap-2">
                    <Bath className="h-4 w-4" /> {property.bathrooms} salles de bain
                  </span>
                )}
                <span className="inline-flex items-center gap-2">
                  <Maximize className="h-4 w-4" /> {formatSurface(property.surface_m2)}
                </span>
              </div>

              {property.description && (
                <div className="mt-6">
                  <h2 className="text-lg font-bold text-foreground">Description</h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {property.description}
                  </p>
                </div>
              )}

              {(amenities.length > 0 || property.amenities.length > 0) && (
                <div className="mt-6">
                  <h2 className="text-lg font-bold text-foreground">Équipements</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {amenities.map((key) => (
                      <span
                        key={key}
                        className="rounded-full bg-secondary px-4 py-2 text-xs font-semibold text-foreground"
                      >
                        {amenityLabels[key]}
                      </span>
                    ))}
                    {property.amenities.map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-secondary px-4 py-2 text-xs font-semibold text-foreground"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(property.video_url || property.virtual_tour_url) && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {property.video_url && (
                    <a
                      href={property.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
                    >
                      <Play className="h-3.5 w-3.5" /> Vidéo du bien
                    </a>
                  )}
                  {property.virtual_tour_url && (
                    <a
                      href={property.virtual_tour_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
                    >
                      Visite virtuelle 360°
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <form
              onSubmit={handleContact}
              className="grid gap-4 rounded-3xl bg-card p-6 shadow-elevated"
            >
              <div>
                <h2 className="text-lg font-extrabold text-foreground">Contacter le vendeur</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Réponse sous 24h par nos conseillers vérifiés.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="full_name">Nom complet</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  maxLength={100}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  maxLength={255}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  maxLength={30}
                  placeholder="+225 ..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  maxLength={1000}
                  rows={4}
                  required
                />
              </div>
              <Button type="submit" disabled={sending} className="rounded-full">
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer ma demande
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={startingChat}
                className="rounded-full"
                onClick={() => startConversation(property.owner_id)}
              >
                {startingChat && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Discuter en direct
              </Button>
            </form>
          </aside>
        </div>
      </main>
    </div>
  );
}

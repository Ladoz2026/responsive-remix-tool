import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Bath, BedDouble, Heart, MapPin, Maximize } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, formatSurface } from "@/lib/format";
import fallbackImage from "@/assets/prop-house.jpg";

export type PropertyCardData = {
  id: string;
  title: string;
  price: number;
  currency: string;
  city: string;
  district: string | null;
  bedrooms: number;
  bathrooms: number;
  surface_m2: number | null;
  images: string[];
  is_verified: boolean;
  is_featured: boolean;
  transaction: string;
};

export function PropertyCard({ property }: { property: PropertyCardData }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorite } = useQuery({
    queryKey: ["favorite", property.id, user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("property_id", property.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (favorite) {
        const { error } = await supabase.from("favorites").delete().eq("id", favorite.id);
        if (error) throw error;
        return "removed" as const;
      }
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, property_id: property.id });
      if (error) throw error;
      return "added" as const;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["favorite", property.id] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(result === "added" ? "Ajouté à vos favoris" : "Retiré de vos favoris");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error && error.message === "auth"
          ? "Connectez-vous pour enregistrer ce bien."
          : "Action impossible pour le moment.",
      );
    },
  });

  const image = property.images[0] ?? fallbackImage;
  const location = [property.district, property.city].filter(Boolean).join(", ");

  return (
    <article className="group overflow-hidden rounded-3xl bg-card shadow-soft transition-shadow hover:shadow-elevated">
      <div className="relative">
        <img
          src={image}
          alt={property.title}
          width={1024}
          height={768}
          loading="lazy"
          className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
          <span className="rounded-full gold-gradient px-3 py-1 text-xs font-bold text-accent-foreground">
            {property.is_featured ? "À la une" : property.transaction === "location" ? "Location" : "Vente"}
          </span>
          <div className="flex items-center gap-2">
            {property.is_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-foreground">
                <BadgeCheck className="h-3.5 w-3.5 text-gold" />
                Vérifié
              </span>
            )}
            <button
              type="button"
              aria-label="Ajouter aux favoris"
              onClick={() => toggleFavorite.mutate()}
              className="grid h-8 w-8 place-items-center rounded-full bg-card/90 text-foreground transition-colors hover:text-gold"
            >
              <Heart className={`h-4 w-4 ${favorite ? "fill-gold text-gold" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="text-lg font-extrabold tracking-tight text-foreground">
          {formatPrice(property.price, property.currency, property.transaction === "location")}
        </p>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {location || property.city}
        </p>
        <h3 className="mt-3 text-base font-bold text-foreground">{property.title}</h3>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          {property.bedrooms > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <BedDouble className="h-4 w-4" /> {property.bedrooms}
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Bath className="h-4 w-4" /> {property.bathrooms}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Maximize className="h-4 w-4" /> {formatSurface(property.surface_m2)}
          </span>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <Link
            to="/bien/$id"
            params={{ id: property.id }}
            className="inline-flex rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Voir le bien
          </Link>
        </div>
      </div>
    </article>
  );
}

import { Link } from "@tanstack/react-router";
import { BadgeCheck, Bath, BedDouble, MapPin, Maximize } from "lucide-react";
import { useSignedImages } from "@/hooks/useSignedImages";
import { formatPrice, typeLabel } from "@/lib/format";

export type PropertyCardData = {
  id: string;
  title: string;
  price: number;
  currency: string | null;
  city: string;
  district: string | null;
  property_type: string;
  transaction: string;
  bedrooms: number;
  bathrooms: number;
  surface_m2: number | null;
  images: string[] | null;
  is_verified: boolean;
  is_featured: boolean;
};

export function PropertyCard({ property }: { property: PropertyCardData }) {
  const urls = useSignedImages(property.images ?? []);
  const cover = urls[0];

  return (
    <article className="group overflow-hidden rounded-3xl bg-card shadow-soft transition-shadow hover:shadow-elevated">
      <Link to="/bien/$id" params={{ id: property.id }} className="block">
        <div className="relative">
          {cover ? (
            <img
              src={cover}
              alt={property.title}
              loading="lazy"
              className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-52 w-full place-items-center bg-secondary text-sm text-muted-foreground">
              Photo à venir
            </div>
          )}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
            <span className="rounded-full gold-gradient px-3 py-1 text-xs font-bold text-accent-foreground">
              {property.transaction === "location" ? "Location" : "Vente"}
            </span>
            {property.is_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-foreground">
                <BadgeCheck className="h-3.5 w-3.5 text-gold" /> Vérifié
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          <p className="text-lg font-extrabold tracking-tight text-foreground">
            {formatPrice(property.price, property.currency ?? "FCFA")}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {[property.district, property.city].filter(Boolean).join(", ")}
          </p>
          <h3 className="mt-3 line-clamp-2 text-base font-bold text-foreground">
            {property.title}
          </h3>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{typeLabel(property.property_type)}</span>
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
            {property.surface_m2 ? (
              <span className="inline-flex items-center gap-1.5">
                <Maximize className="h-4 w-4" /> {property.surface_m2} m²
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}

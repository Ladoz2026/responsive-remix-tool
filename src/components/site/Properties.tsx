import { BadgeCheck, Bath, BedDouble, MapPin, Maximize } from "lucide-react";
import hero from "@/assets/hero-villa.jpg";
import apartment from "@/assets/prop-apartment.jpg";
import villa from "@/assets/prop-villa.jpg";
import house from "@/assets/prop-house.jpg";
import office from "@/assets/prop-office.jpg";
import land from "@/assets/prop-land.jpg";

type Property = {
  title: string;
  price: string;
  location: string;
  tag: string;
  beds: number;
  baths: number;
  area: string;
  agent: string;
  img: string;
};

const properties: Property[] = [
  {
    title: "Villa contemporaine avec piscine",
    price: "450 000 000 FCFA",
    location: "Cocody, Riviera Golf",
    tag: "Featured",
    beds: 5,
    baths: 4,
    area: "520 m²",
    agent: "Aïcha Koné",
    img: hero,
  },
  {
    title: "Appartement haut standing vue lagune",
    price: "180 000 000 FCFA",
    location: "Plateau, Abidjan",
    tag: "Nouveau",
    beds: 3,
    baths: 2,
    area: "145 m²",
    agent: "Yao Konan",
    img: apartment,
  },
  {
    title: "Villa minimaliste avec jardin tropical",
    price: "320 000 000 FCFA",
    location: "Bingerville",
    tag: "Hot Deal",
    beds: 4,
    baths: 3,
    area: "380 m²",
    agent: "Fatou Traoré",
    img: villa,
  },
  {
    title: "Plateau de bureaux premium",
    price: "1 200 000 FCFA / mois",
    location: "Plateau Business District",
    tag: "Featured",
    beds: 0,
    baths: 4,
    area: "640 m²",
    agent: "SeLoger Pro",
    img: office,
  },
  {
    title: "Maison familiale moderne",
    price: "210 000 000 FCFA",
    location: "Marcory Résidentiel",
    tag: "Vérifié",
    beds: 4,
    baths: 3,
    area: "290 m²",
    agent: "Kouamé Brou",
    img: house,
  },
  {
    title: "Terrain bord de mer",
    price: "85 000 000 FCFA",
    location: "Assinie",
    tag: "Nouveau",
    beds: 0,
    baths: 0,
    area: "1 200 m²",
    agent: "Atlantic Realty",
    img: land,
  },
];

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function Properties() {
  return (
    <section id="properties" className="bg-secondary/60 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Biens à la une</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Propriétés vérifiées et coups de cœur
          </h2>
          <p className="mt-3 text-muted-foreground">
            Une sélection rigoureusement validée par nos équipes.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <article
              key={p.title}
              className="group overflow-hidden rounded-3xl bg-card shadow-soft transition-shadow hover:shadow-elevated"
            >
              <div className="relative">
                <img
                  src={p.img}
                  alt={p.title}
                  width={1024}
                  height={768}
                  loading="lazy"
                  className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
                  <span className="rounded-full gold-gradient px-3 py-1 text-xs font-bold text-accent-foreground">
                    {p.tag}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-foreground">
                    <BadgeCheck className="h-3.5 w-3.5 text-gold" />
                    Vérifié
                  </span>
                </div>
              </div>

              <div className="p-5">
                <p className="text-lg font-extrabold tracking-tight text-foreground">{p.price}</p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {p.location}
                </p>
                <h3 className="mt-3 text-base font-bold text-foreground">{p.title}</h3>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {p.beds > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <BedDouble className="h-4 w-4" /> {p.beds}
                    </span>
                  )}
                  {p.baths > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <Bath className="h-4 w-4" /> {p.baths}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Maximize className="h-4 w-4" /> {p.area}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border pt-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-foreground">
                      {initials(p.agent)}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">{p.agent}</span>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                  >
                    Détails
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

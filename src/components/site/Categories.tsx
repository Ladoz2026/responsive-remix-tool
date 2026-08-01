import { ArrowRight } from "lucide-react";
import apartment from "@/assets/prop-apartment.jpg";
import villa from "@/assets/prop-villa.jpg";
import house from "@/assets/prop-house.jpg";
import office from "@/assets/prop-office.jpg";
import commercial from "@/assets/prop-commercial.jpg";
import land from "@/assets/prop-land.jpg";

const categories = [
  { name: "Appartements", count: "1240 biens", img: apartment },
  { name: "Villas", count: "386 biens", img: villa },
  { name: "Maisons", count: "912 biens", img: house },
  { name: "Bureaux", count: "174 biens", img: office },
  { name: "Commerces", count: "221 biens", img: commercial },
  { name: "Terrains", count: "530 biens", img: land },
];

export function Categories() {
  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="max-w-2xl">
          <p className="eyebrow">Catégories</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Explorez par type de bien
          </h2>
          <p className="mt-3 text-muted-foreground">
            Des appartements modernes aux villas d'exception, trouvez exactement ce que vous
            cherchez.
          </p>
        </div>
        <a
          href="#properties"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          Voir tout <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <a
            key={c.name}
            href="#properties"
            className="group relative block overflow-hidden rounded-3xl shadow-soft"
          >
            <img
              src={c.img}
              alt={c.name}
              width={1024}
              height={768}
              loading="lazy"
              className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 hero-overlay" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h3 className="text-lg font-bold text-primary-foreground">{c.name}</h3>
              <p className="text-sm text-primary-foreground/70">{c.count}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

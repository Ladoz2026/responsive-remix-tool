import { ArrowRight } from "lucide-react";
import villa from "@/assets/prop-villa.jpg";
import apartment from "@/assets/prop-apartment.jpg";
import office from "@/assets/prop-office.jpg";

const posts = [
  {
    tag: "Tendances",
    title: "L'essor de l'immobilier de luxe à Abidjan",
    text: "Comment Cocody et Riviera redéfinissent le standing en Côte d'Ivoire.",
    img: villa,
  },
  {
    tag: "Guide",
    title: "Acheter un bien en 2026 : checklist complète",
    text: "Les 12 vérifications indispensables avant de signer.",
    img: apartment,
  },
  {
    tag: "Investir",
    title: "Rendements locatifs : top 5 des quartiers",
    text: "Notre analyse des meilleurs ROI immobiliers.",
    img: office,
  },
];

export function Magazine() {
  return (
    <section id="magazine" className="bg-secondary/60 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Magazine</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            L'actualité de l'immobilier ivoirien
          </h2>
          <p className="mt-3 text-muted-foreground">
            Conseils, tendances et opportunités d'investissement.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {posts.map((p) => (
            <a
              key={p.title}
              href="#magazine"
              className="group overflow-hidden rounded-3xl bg-card shadow-soft transition-shadow hover:shadow-elevated"
            >
              <img
                src={p.img}
                alt={p.title}
                width={1024}
                height={768}
                loading="lazy"
                className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="p-6">
                <span className="eyebrow">{p.tag}</span>
                <h3 className="mt-2 text-base font-bold text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.text}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground group-hover:text-gold">
                  Lire l'article <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

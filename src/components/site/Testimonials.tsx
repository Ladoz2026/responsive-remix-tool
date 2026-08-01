import { Quote } from "lucide-react";

const items = [
  {
    text: "J'ai trouvé ma villa de rêve en deux semaines. L'expérience est aussi raffinée que les biens proposés.",
    name: "Mariam D.",
    role: "Acheteuse — Cocody",
    initials: "MD",
  },
  {
    text: "Validation rapide, photos magnifiquement mises en valeur, et des contacts sérieux dès la première semaine.",
    name: "Serge K.",
    role: "Vendeur — Marcory",
    initials: "SK",
  },
  {
    text: "Une interface superbe et des biens vérifiés. Aucune mauvaise surprise, que des coups de cœur.",
    name: "Sophie B.",
    role: "Locataire — Plateau",
    initials: "SB",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="max-w-2xl">
        <p className="eyebrow">Témoignages</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Ils ont trouvé leur bien d'exception
        </h2>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {items.map((t) => (
          <figure key={t.name} className="rounded-3xl bg-card p-7 shadow-soft">
            <Quote className="h-6 w-6 text-gold" />
            <blockquote className="mt-4 text-sm leading-relaxed text-foreground">{t.text}</blockquote>
            <figcaption className="mt-6 flex min-w-0 items-center gap-3 border-t border-border pt-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-foreground">
                {t.initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-foreground">{t.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{t.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

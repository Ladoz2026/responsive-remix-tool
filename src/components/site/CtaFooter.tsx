import { ArrowRight, Crown, Mail, MapPin, Phone } from "lucide-react";

const columns = [
  { title: "Acheter", links: ["Villas", "Appartements", "Terrains", "Bureaux"] },
  { title: "Louer", links: ["Longue durée", "Meublé", "Colocation", "Commerces"] },
  { title: "Société", links: ["À propos", "Agences partenaires", "Magazine", "Contact"] },
];

export function CtaFooter() {
  return (
    <>
      <section id="cta" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="overflow-hidden rounded-[2rem] bg-navy p-8 shadow-elevated sm:p-14">
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">
                Vendeurs & agences
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">
                Publiez votre bien aujourd'hui.
              </h2>
              <p className="mt-3 max-w-xl text-primary-foreground/70">
                Atteignez des milliers d'acheteurs qualifiés. Validation sous 24h, mise en valeur
                premium incluse.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <a
                href="#top"
                className="inline-flex items-center gap-2 rounded-full gold-gradient px-6 py-3 text-sm font-bold text-accent-foreground shadow-gold transition-transform hover:-translate-y-0.5"
              >
                Publier une annonce <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#properties"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                Parler à un conseiller
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full gold-gradient">
                <Crown className="h-4 w-4 text-accent-foreground" />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-foreground">
                SeLoger<span className="text-gold">CI</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              La plateforme immobilière premium de Côte d'Ivoire : des biens vérifiés, des
              transactions sereines.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-gold" /> Plateau, Abidjan
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-gold" /> +225 27 00 00 00
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-gold" /> contact@selogerci.ci
              </li>
            </ul>
          </div>

          {columns.map((c) => (
            <div key={c.title}>
              <p className="text-sm font-bold text-foreground">{c.title}</p>
              <ul className="mt-4 grid gap-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#top"
                      className="text-sm text-muted-foreground transition-colors hover:text-gold"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>© 2026 SeLogerCI. Tous droits réservés.</p>
            <p>Mentions légales · Confidentialité · CGU</p>
          </div>
        </div>
      </footer>
    </>
  );
}

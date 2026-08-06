import { Sparkles } from "lucide-react";
import heroVilla from "@/assets/hero-villa.jpg";
import { SearchForm } from "@/components/site/SearchForm";

const stats = [
  { value: "25 000+", label: "Annonces actives" },
  { value: "12 000+", label: "Vendeurs certifiés" },
  { value: "75 000+", label: "Visites mensuelles" },
  { value: "98%", label: "Clients satisfaits" },
];

export function Hero() {


  return (
    <section id="top" className="relative">
      <div className="relative min-h-[92vh] overflow-hidden">
        <img
          src={heroVilla}
          alt="Villa de luxe avec piscine en Côte d'Ivoire au coucher du soleil"
          width={1920}
          height={1200}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.55_0.20_260/0.35),transparent_60%)]" />

        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-4 pt-32 pb-40 sm:px-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full glass-panel px-4 py-2 text-xs font-semibold text-primary-foreground sm:text-sm">
            <Sparkles className="h-4 w-4 text-gold" />
            Plateforme N°1 de l'immobilier premium en Côte d'Ivoire
          </span>

          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-primary-foreground sm:text-6xl lg:text-7xl">
            Trouvez le bien <span className="text-gold">d'exception</span> qui vous ressemble
          </h1>

          <p className="mt-5 max-w-xl text-base text-primary-foreground/80 sm:text-lg">
            Achetez, louez ou vendez en toute confiance des biens vérifiés à Abidjan et partout en
            Côte d'Ivoire.
          </p>

          <div className="mt-10 w-full max-w-4xl">
            <SearchForm />
          </div>

        </div>
      </div>

      <div className="relative mx-auto -mt-24 max-w-5xl px-4 sm:px-6">
        <dl className="grid grid-cols-2 divide-border rounded-3xl bg-card shadow-elevated sm:grid-cols-4 sm:divide-x">
          {stats.map((s) => (
            <div key={s.label} className="px-4 py-7 text-center">
              <dt className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                {s.value}
              </dt>
              <dd className="mt-1 text-sm text-muted-foreground">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

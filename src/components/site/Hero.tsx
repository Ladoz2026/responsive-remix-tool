import { useState } from "react";
import { Building2, BedDouble, MapPin, Search, Sparkles } from "lucide-react";
import heroVilla from "@/assets/hero-villa.jpg";

const tabs = ["Acheter", "Louer", "Vendre"] as const;
const quartiers = ["Cocody", "Plateau", "Marcory", "Bingerville", "Assinie"];

const stats = [
  { value: "25 000+", label: "Annonces actives" },
  { value: "12 000+", label: "Vendeurs certifiés" },
  { value: "75 000+", label: "Visites mensuelles" },
  { value: "98%", label: "Clients satisfaits" },
];

export function Hero() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Acheter");
  const [ville, setVille] = useState("");

  return (
    <section id="top" className="relative">
      <div className="relative min-h-[92vh] overflow-hidden">
        <img
          src={heroVilla}
          alt="Villa de luxe avec piscine en Côte d'Ivoire au coucher du soleil"
          fetchPriority="high"
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

          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-10 w-full max-w-4xl rounded-3xl glass-panel p-4 sm:p-5"
          >
            <div className="flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                    tab === t
                      ? "bg-card text-foreground shadow-soft"
                      : "text-primary-foreground/80 hover:text-primary-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
              <label className="flex min-w-0 items-center gap-2 rounded-full bg-card px-4 py-3">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  placeholder="Ville, quartier..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </label>
              <label className="flex min-w-0 items-center gap-2 rounded-full bg-card px-4 py-3">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <select className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none">
                  <option>Type de bien</option>
                  <option>Villa</option>
                  <option>Appartement</option>
                  <option>Terrain</option>
                  <option>Bureau</option>
                </select>
              </label>
              <label className="flex min-w-0 items-center gap-2 rounded-full bg-card px-4 py-3">
                <BedDouble className="h-4 w-4 shrink-0 text-muted-foreground" />
                <select className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none">
                  <option>Chambres</option>
                  <option>1+</option>
                  <option>2+</option>
                  <option>3+</option>
                  <option>4+</option>
                </select>
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full gold-gradient px-6 py-3 text-sm font-bold text-accent-foreground shadow-gold transition-transform hover:-translate-y-0.5"
              >
                <Search className="h-4 w-4" />
                Rechercher
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              {quartiers.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setVille(q)}
                  className="text-xs font-medium text-primary-foreground/70 transition-colors hover:text-gold"
                >
                  {q}
                </button>
              ))}
            </div>
          </form>
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

import { Plus } from "lucide-react";

const steps = [
  { title: "Soumettez", text: "Publiez votre annonce avec photos, plans et description." },
  { title: "Validation", text: "Notre équipe vérifie chaque annonce sous 24h." },
  { title: "Mise en ligne", text: "Visibilité maximale auprès d'acheteurs qualifiés." },
  { title: "Contacts", text: "Recevez les demandes directement sur votre tableau de bord." },
];

const rows = [
  { status: "Publiée", title: "Villa Cocody Riviera", views: "1 284", leads: "42", tone: "gold" },
  { status: "En validation", title: "Appartement Plateau", views: "—", leads: "0", tone: "muted" },
  { status: "Approuvée", title: "Terrain Assinie", views: "412", leads: "13", tone: "gold" },
];

export function Validation() {
  return (
    <section id="validation" className="bg-navy-deep py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">
            Validation & qualité
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">
            Chaque annonce, vérifiée par nos experts
          </h2>
          <p className="mt-3 text-primary-foreground/70">
            Un processus strict pour garantir des biens authentiques et des transactions sereines.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-start">
          <ol className="grid gap-4 sm:grid-cols-2">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-3xl glass-panel p-6">
                <span className="text-3xl font-extrabold text-gold">{i + 1}</span>
                <p className="mt-3 text-base font-bold text-primary-foreground">{s.title}</p>
                <p className="mt-2 text-sm text-primary-foreground/70">{s.text}</p>
              </li>
            ))}
          </ol>

          <div className="rounded-3xl bg-card p-6 shadow-elevated">
            <p className="eyebrow">Aperçu du tableau de bord vendeur</p>
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <h3 className="truncate text-lg font-extrabold text-foreground">Mes annonces</h3>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full gold-gradient px-4 py-2 text-xs font-bold text-accent-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> Nouvelle annonce
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {rows.map((r) => (
                <div
                  key={r.title}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-secondary/70 p-4"
                >
                  <div className="min-w-0">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        r.tone === "gold"
                          ? "gold-gradient text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.status}
                    </span>
                    <p className="mt-2 truncate text-sm font-semibold text-foreground">{r.title}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <p>
                      <span className="font-bold text-foreground">{r.views}</span> vues
                    </p>
                    <p>
                      <span className="font-bold text-foreground">{r.leads}</span> contacts
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

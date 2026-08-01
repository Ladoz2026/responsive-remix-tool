import { useState } from "react";

const flows = {
  Acheter: ["Recherchez", "Contactez le vendeur", "Planifiez une visite", "Achetez en toute sécurité"],
  Louer: ["Parcourez les biens", "Échangez avec le propriétaire", "Réservez une visite", "Emménagez"],
  Vendre: ["Créez votre annonce", "Ajoutez photos & plans", "Validation admin", "Recevez des contacts"],
} as const;

type Flow = keyof typeof flows;

export function HowItWorks() {
  const [flow, setFlow] = useState<Flow>("Acheter");

  return (
    <section id="how" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="max-w-2xl">
        <p className="eyebrow">Comment ça marche</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Un parcours simple, élégant, sécurisé
        </h2>
      </div>

      <div className="mt-8 inline-flex flex-wrap gap-2 rounded-full bg-secondary p-1.5">
        {(Object.keys(flows) as Flow[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFlow(f)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              flow === f ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {flows[flow].map((step, i) => (
          <li key={step} className="rounded-3xl bg-card p-6 shadow-soft">
            <span className="grid h-10 w-10 place-items-center rounded-full gold-gradient text-sm font-extrabold text-accent-foreground">
              {i + 1}
            </span>
            <p className="mt-4 text-base font-bold text-foreground">{step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

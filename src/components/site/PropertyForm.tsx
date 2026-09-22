import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { X } from "lucide-react";
import { PROPERTY_TYPES, TRANSACTIONS } from "@/lib/format";
import { uploadPropertyImages } from "@/lib/media";
import { useSignedImages } from "@/hooks/useSignedImages";

const API_URL = "https://api-seloger-ci.poroinfo.net/wp-json/seloger/v1/annonces";

const field =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold";

export type PropertyFormValues = Record<string, unknown> & { id?: string };

export function PropertyForm({
  userId,
  initial,
}: {
  userId: string;
  initial?: PropertyFormValues;
}) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [images, setImages] = useState<string[]>(((initial?.['images'] as string[]) ?? []));
  const previews = useSignedImages(images);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    try {
      const paths = await uploadPropertyImages(userId, Array.from(files));
      setImages((prev) => [...prev, ...paths]);
      toast.success(`${paths.length} photo(s) ajoutée(s)`);
    } catch {
      toast.error("Échec de l'envoi des photos");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);

    const payload = {
      title: String(f.get("title")).trim().slice(0, 160),
      description: String(f.get("description") ?? "").slice(0, 5000),
      type_bien: String(f.get("property_type")),
      type_transaction: String(f.get("transaction")),
      prix: String(f.get("price")),
      ville: String(f.get("ville") ?? "Abidjan"),
      quartier: String(f.get("quartier") ?? ""),
      surface_m2: String(f.get("surface_m2") ?? ""),
      chambres: String(f.get("bedrooms") ?? "0"),
      salles_de_bain: String(f.get("bathrooms") ?? "0"),
      photos_urls: images.join(","),
      contact_nom: String(f.get("contact_nom") ?? ""),
      contact_telephone: String(f.get("contact_telephone") ?? ""),
      contact_email: String(f.get("contact_email") ?? ""),
    };

    setSaving(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Erreur");
      setDone(true);
      toast.success("Annonce envoyée pour validation !");
    } catch {
      toast.error("Une erreur est survenue, réessayez.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-border bg-card p-10 text-center">
        <h2 className="text-xl font-bold text-foreground">Merci !</h2>
        <p className="mt-3 text-muted-foreground">
          Votre annonce a été envoyée. Elle sera publiée après validation par notre équipe (sous 24h).
        </p>
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="mt-6 rounded-full gold-gradient px-6 py-3 text-sm font-bold text-accent-foreground shadow-gold"
        >
          Retour à mon espace
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div className="grid gap-4 rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">Informations principales</h2>
        <input
          name="title"
          required
          maxLength={160}
          defaultValue={(initial?.['title'] as string) ?? ""}
          placeholder="Titre de l'annonce"
          className={field}
        />
        <textarea
          name="description"
          rows={5}
          defaultValue={(initial?.['description'] as string) ?? ""}
          placeholder="Description détaillée"
          className={field}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <select
            name="transaction"
            defaultValue={(initial?.['transaction'] as string) ?? "Vente"}
            className={field}
          >
            {TRANSACTIONS.map((t) => (
              <option key={t.value} value={t.label ?? t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            name="property_type"
            defaultValue={(initial?.['property_type'] as string) ?? "Appartement"}
            className={field}
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.label ?? t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <input
            name="price"
            type="number"
            required
            min={0}
            defaultValue={(initial?.['price'] as number) ?? ""}
            placeholder="Prix (FCFA)"
            className={field}
          />
          <input
            name="surface_m2"
            type="number"
            min={0}
            defaultValue={(initial?.['surface_m2'] as number) ?? ""}
            placeholder="Surface m²"
            className={field}
          />
          <input
            name="bedrooms"
            type="number"
            min={0}
            defaultValue={(initial?.['bedrooms'] as number) ?? 0}
            placeholder="Chambres"
            className={field}
          />
          <input
            name="bathrooms"
            type="number"
            min={0}
            defaultValue={(initial?.['bathrooms'] as number) ?? 0}
            placeholder="Salles de bain"
            className={field}
          />
        </div>
      </div>

      <div className="grid gap-4 rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">Localisation</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <input name="ville" defaultValue="Abidjan" placeholder="Ville" className={field} />
          <input name="quartier" placeholder="Quartier (ex: Cocody)" className={field} />
        </div>
      </div>

      <div className="grid gap-4 rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">Photos</h2>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onFiles(e.target.files)}
          className="text-sm text-muted-foreground"
        />
        {previews.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {previews.map((u, i) => (
              <div key={u} className="relative h-24 w-32 overflow-hidden rounded-xl">
                <img src={u} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Retirer la photo"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-card/90 text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">Vos coordonnées</h2>
        <input name="contact_nom" required placeholder="Votre nom" className={field} />
        <div className="grid gap-4 sm:grid-cols-2">
          <input name="contact_telephone" required placeholder="Téléphone" className={field} />
          <input name="contact_email" type="email" placeholder="Email" className={field} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full gold-gradient px-6 py-3 text-sm font-bold text-accent-foreground shadow-gold disabled:opacity-60"
        >
          {saving ? "Envoi en cours…" : "Envoyer pour validation"}
        </button>
      </div>
    </form>
  );
}
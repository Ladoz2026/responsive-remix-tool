import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { referenceQuery } from "@/lib/property-queries";
import { PROPERTY_TYPES, TRANSACTIONS } from "@/lib/format";
import { uploadPropertyImages } from "@/lib/media";
import { useSignedImages } from "@/hooks/useSignedImages";

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
  const queryClient = useQueryClient();
  const { data: ref } = useQuery(referenceQuery);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>(((initial?.['images'] as string[]) ?? []));
  const [cityId, setCityId] = useState<string>((initial?.['city_id'] as string) ?? "");
  const [communeId, setCommuneId] = useState<string>((initial?.['commune_id'] as string) ?? "");
  const previews = useSignedImages(images);

  const communes = (ref?.communes ?? []).filter((c) => !cityId || c.city_id === cityId);
  const districts = (ref?.districts ?? []).filter((d) => !communeId || d.commune_id === communeId);

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
    const city = ref?.cities.find((c) => c.id === f.get("city_id"));
    const district = ref?.districts.find((d) => d.id === f.get("district_id"));

    const payload = {
      owner_id: userId,
      title: String(f.get("title")).trim().slice(0, 160),
      description: String(f.get("description") ?? "").slice(0, 5000),
      property_type: String(f.get("property_type")),
      transaction: String(f.get("transaction")),
      price: Number(f.get("price")),
      currency: "FCFA",
      city: city?.name ?? String(f.get("city_text") ?? "Abidjan"),
      district: district?.name ?? null,
      address: String(f.get("address") ?? "") || null,
      city_id: (f.get("city_id") as string) || null,
      commune_id: (f.get("commune_id") as string) || null,
      district_id: (f.get("district_id") as string) || null,
      category_id: (f.get("category_id") as string) || null,
      surface_m2: f.get("surface_m2") ? Number(f.get("surface_m2")) : null,
      bedrooms: Number(f.get("bedrooms") ?? 0),
      bathrooms: Number(f.get("bathrooms") ?? 0),
      has_pool: f.get("has_pool") === "on",
      has_garage: f.get("has_garage") === "on",
      has_garden: f.get("has_garden") === "on",
      has_ac: f.get("has_ac") === "on",
      is_furnished: f.get("is_furnished") === "on",
      images,
      status: String(f.get("status")),
    };

    setSaving(true);
    const res = initial?.id
      ? await supabase.from("properties").update(payload as never).eq("id", initial.id)
      : await supabase.from("properties").insert(payload as never);
    setSaving(false);

    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["my-properties"] });
    toast.success(initial?.id ? "Annonce mise à jour" : "Annonce créée");
    navigate({ to: "/dashboard" });
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
        <div className="grid gap-4 sm:grid-cols-3">
          <select
            name="transaction"
            defaultValue={(initial?.['transaction'] as string) ?? "vente"}
            className={field}
          >
            {TRANSACTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            name="property_type"
            defaultValue={(initial?.['property_type'] as string) ?? "appartement"}
            className={field}
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            name="category_id"
            defaultValue={(initial?.['category_id'] as string) ?? ""}
            className={field}
          >
            <option value="">Catégorie</option>
            {(ref?.categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
        <div className="grid gap-4 sm:grid-cols-3">
          <select
            name="city_id"
            value={cityId}
            onChange={(e) => {
              setCityId(e.target.value);
              setCommuneId("");
            }}
            className={field}
          >
            <option value="">Ville</option>
            {(ref?.cities ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            name="commune_id"
            value={communeId}
            onChange={(e) => setCommuneId(e.target.value)}
            className={field}
          >
            <option value="">Commune</option>
            {communes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            name="district_id"
            defaultValue={(initial?.['district_id'] as string) ?? ""}
            className={field}
          >
            <option value="">Quartier</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <input
          name="address"
          defaultValue={(initial?.['address'] as string) ?? ""}
          placeholder="Adresse"
          className={field}
        />
      </div>

      <div className="grid gap-4 rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">Équipements</h2>
        <div className="flex flex-wrap gap-5 text-sm text-foreground">
          {[
            ["has_pool", "Piscine"],
            ["has_garage", "Garage"],
            ["has_garden", "Jardin"],
            ["has_ac", "Climatisation"],
            ["is_furnished", "Meublé"],
          ].map(([name, label]) => (
            <label key={name} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name={name}
                defaultChecked={Boolean(initial?.[name!])}
                className="h-4 w-4 accent-[var(--gold)]"
              />
              {label}
            </label>
          ))}
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

      <div className="flex flex-wrap items-center gap-4">
        <select
          name="status"
          defaultValue={(initial?.['status'] as string) ?? "publie"}
          className={`${field} sm:w-56`}
        >
          <option value="brouillon">Brouillon</option>
          <option value="publie">Publiée</option>
          <option value="archive">Archivée</option>
        </select>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full gold-gradient px-6 py-3 text-sm font-bold text-accent-foreground shadow-gold disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer l'annonce"}
        </button>
      </div>
    </form>
  );
}

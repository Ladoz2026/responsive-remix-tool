export function formatPrice(price: number | null | undefined, currency = "FCFA") {
  if (price == null) return "Prix sur demande";
  return `${new Intl.NumberFormat("fr-FR").format(price)} ${currency}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(value));
}

export const PROPERTY_TYPES = [
  { value: "appartement", label: "Appartement" },
  { value: "villa", label: "Villa" },
  { value: "maison", label: "Maison" },
  { value: "bureau", label: "Bureau" },
  { value: "terrain", label: "Terrain" },
  { value: "commerce", label: "Commerce" },
] as const;

export const TRANSACTIONS = [
  { value: "vente", label: "Vente" },
  { value: "location", label: "Location" },
] as const;

export const AMENITIES = [
  "Piscine",
  "Garage",
  "Jardin",
  "Climatisation",
  "Meublé",
  "Sécurité 24/7",
  "Ascenseur",
  "Groupe électrogène",
];

export function typeLabel(value: string | null | undefined) {
  return PROPERTY_TYPES.find((t) => t.value === value)?.label ?? value ?? "";
}

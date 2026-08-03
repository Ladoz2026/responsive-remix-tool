export function formatPrice(price: number, currency = "FCFA", perMonth = false) {
  const value = new Intl.NumberFormat("fr-FR").format(Math.round(price));
  return `${value} ${currency}${perMonth ? " / mois" : ""}`;
}

export function formatSurface(m2: number | null) {
  return m2 ? `${new Intl.NumberFormat("fr-FR").format(m2)} m²` : "—";
}

export function initials(name: string | null | undefined) {
  if (!name) return "SL";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

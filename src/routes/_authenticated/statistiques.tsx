import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Eye, Heart, Loader2, MessageSquare, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/statistiques")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Statistiques – Performance des annonces | SeLoger CI" },
      {
        name: "description",
        content:
          "Tableau de bord analytique SeLoger CI : vues, favoris, leads et taux de conversion de vos annonces immobilières.",
      },
      { property: "og:title", content: "Statistiques – Performance des annonces | SeLoger CI" },
      {
        property: "og:description",
        content: "Vues, favoris, leads et conversion de vos annonces immobilières en Côte d'Ivoire.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Statistiques,
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center p-8 text-center text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
});

const RANGES = [
  { key: 7, label: "7 jours" },
  { key: 30, label: "30 jours" },
  { key: 90, label: "90 jours" },
] as const;

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--primary) / 0.6)",
  "hsl(var(--accent) / 0.6)",
  "hsl(var(--primary) / 0.35)",
];

function dayKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function labelFor(key: string) {
  return new Date(key).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function Statistiques() {
  const { user } = useAuth();
  const { isAdmin } = useRoles();
  const [days, setDays] = useState<number>(30);

  const since = useMemo(
    () => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
    [days],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", user?.id, isAdmin, days],
    enabled: Boolean(user),
    queryFn: async () => {
      let propsQuery = supabase
        .from("properties")
        .select(
          "id, title, price, status, property_type, transaction, city, views_count, created_at",
        );
      if (!isAdmin) propsQuery = propsQuery.eq("owner_id", user!.id);
      const { data: properties, error } = await propsQuery;
      if (error) throw error;

      const ids = (properties ?? []).map((p) => p.id);
      if (ids.length === 0) {
        return { properties: properties ?? [], views: [], leads: [], favorites: [] };
      }

      const [views, leads, favorites] = await Promise.all([
        supabase
          .from("property_views")
          .select("property_id, created_at")
          .in("property_id", ids)
          .gte("created_at", since),
        supabase
          .from("contact_requests")
          .select("id, property_id, status, created_at")
          .in("property_id", ids)
          .gte("created_at", since),
        supabase.from("favorites").select("property_id, created_at").in("property_id", ids),
      ]);

      return {
        properties: properties ?? [],
        views: views.data ?? [],
        leads: leads.data ?? [],
        favorites: favorites.data ?? [],
      };
    },
  });

  const properties = data?.properties ?? [];
  const views = data?.views ?? [];
  const leads = data?.leads ?? [];
  const favorites = data?.favorites ?? [];

  const timeline = useMemo(() => {
    const buckets = new Map<string, { date: string; vues: number; leads: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const key = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      buckets.set(key, { date: labelFor(key), vues: 0, leads: 0 });
    }
    views.forEach((v) => {
      const b = buckets.get(dayKey(v.created_at));
      if (b) b.vues += 1;
    });
    leads.forEach((l) => {
      const b = buckets.get(dayKey(l.created_at));
      if (b) b.leads += 1;
    });
    return [...buckets.values()];
  }, [views, leads, days]);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    properties.forEach((p) => map.set(p.property_type, (map.get(p.property_type) ?? 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [properties]);

  const topProperties = useMemo(() => {
    const viewsById = new Map<string, number>();
    views.forEach((v) => viewsById.set(v.property_id, (viewsById.get(v.property_id) ?? 0) + 1));
    const leadsById = new Map<string, number>();
    leads.forEach((l) => {
      if (l.property_id) leadsById.set(l.property_id, (leadsById.get(l.property_id) ?? 0) + 1);
    });
    const favById = new Map<string, number>();
    favorites.forEach((f) => favById.set(f.property_id, (favById.get(f.property_id) ?? 0) + 1));

    return properties
      .map((p) => ({
        id: p.id,
        title: p.title,
        price: Number(p.price),
        status: p.status,
        city: p.city,
        vues: viewsById.get(p.id) ?? 0,
        leads: leadsById.get(p.id) ?? 0,
        favoris: favById.get(p.id) ?? 0,
      }))
      .sort((a, b) => b.vues - a.vues || b.leads - a.leads)
      .slice(0, 8);
  }, [properties, views, leads, favorites]);

  const totalViews = views.length;
  const totalLeads = leads.length;
  const conversion = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;
  const portfolio = properties
    .filter((p) => p.status === "publie")
    .reduce((sum, p) => sum + Number(p.price), 0);

  const kpis = [
    {
      label: "Vues",
      value: totalViews.toLocaleString("fr-FR"),
      hint: `sur ${days} jours`,
      icon: Eye,
    },
    {
      label: "Leads",
      value: totalLeads.toLocaleString("fr-FR"),
      hint: "demandes de contact",
      icon: MessageSquare,
    },
    {
      label: "Taux de conversion",
      value: `${conversion.toFixed(1)} %`,
      hint: "leads / vues",
      icon: TrendingUp,
    },
    {
      label: "Favoris",
      value: favorites.length.toLocaleString("fr-FR"),
      hint: "toutes périodes",
      icon: Heart,
    },
  ];

  return (
    <main className="min-h-screen bg-background px-4 pb-20 pt-28 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Statistiques</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin
                ? "Vue globale de la plateforme SeLoger CI."
                : "Performance de vos annonces publiées."}{" "}
              Portefeuille publié : {formatPrice(portfolio)}
            </p>
          </div>
          <div className="flex gap-2">
            {RANGES.map((r) => (
              <Button
                key={r.key}
                size="sm"
                variant={days === r.key ? "default" : "outline"}
                onClick={() => setDays(r.key)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </header>

        {isLoading ? (
          <div className="grid place-items-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpis.map((k) => (
                <div key={k.label} className="rounded-2xl border bg-card p-5 shadow-soft">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{k.label}</span>
                    <k.icon className="h-4 w-4 text-accent" />
                  </div>
                  <p className="mt-3 text-3xl font-extrabold tracking-tight">{k.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
                </div>
              ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border bg-card p-5 shadow-soft lg:col-span-2">
                <h2 className="text-lg font-bold">Trafic et leads</h2>
                <div className="mt-4 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeline}>
                      <defs>
                        <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area
                        type="monotone"
                        dataKey="vues"
                        name="Vues"
                        stroke="hsl(var(--primary))"
                        fill="url(#gv)"
                      />
                      <Area
                        type="monotone"
                        dataKey="leads"
                        name="Leads"
                        stroke="hsl(var(--accent))"
                        fill="url(#gl)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-5 shadow-soft">
                <h2 className="text-lg font-bold">Répartition par type</h2>
                <div className="mt-4 h-72 w-full">
                  {byType.length === 0 ? (
                    <p className="pt-16 text-center text-sm text-muted-foreground">
                      Aucune annonce pour le moment.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={byType}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {byType.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border bg-card p-5 shadow-soft">
                <h2 className="text-lg font-bold">Annonces les plus vues</h2>
                <div className="mt-4 h-72 w-full">
                  {topProperties.length === 0 ? (
                    <p className="pt-16 text-center text-sm text-muted-foreground">
                      Pas encore de données de trafic.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProperties.slice(0, 6)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="title"
                          width={120}
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 18)}…` : v)}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="vues" name="Vues" fill="hsl(var(--primary))" radius={6} />
                        <Bar dataKey="leads" name="Leads" fill="hsl(var(--accent))" radius={6} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-5 shadow-soft">
                <h2 className="text-lg font-bold">Détail par annonce</h2>
                <div className="mt-4 divide-y">
                  {topProperties.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Publiez une annonce pour suivre ses performances.
                    </p>
                  ) : (
                    topProperties.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <Link
                            to="/bien/$id"
                            params={{ id: p.id }}
                            className="truncate text-sm font-semibold hover:text-accent"
                          >
                            {p.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {p.city} · {formatPrice(p.price)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-xs">
                          <Badge variant="secondary" className="gap-1">
                            <Eye className="h-3 w-3" /> {p.vues}
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <MessageSquare className="h-3 w-3" /> {p.leads}
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <Heart className="h-3 w-3" /> {p.favoris}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

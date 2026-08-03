import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Building2, Loader2, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/site/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";
import { formatPrice } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration | SeLoger CI" },
      {
        name: "description",
        content:
          "Modérez les annonces, validez les biens vérifiés et gérez les rôles des utilisateurs de SeLoger CI.",
      },
      { property: "og:title", content: "Administration | SeLoger CI" },
      {
        property: "og:description",
        content: "Console de modération et de gestion de la plateforme SeLoger CI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useRoles();
  const queryClient = useQueryClient();

  const propertiesQuery = useQuery({
    queryKey: ["admin-properties"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, city, price, currency, status, is_verified, transaction, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, city, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const byUser = new Map<string, AppRole[]>();
      for (const r of roles ?? []) {
        byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role]);
      }
      return (profiles ?? []).map((p) => ({ ...p, roles: byUser.get(p.id) ?? [] }));
    },
  });

  const moderate = useMutation({
    mutationFn: async (input: {
      id: string;
      status: Database["public"]["Enums"]["listing_status"];
      verified?: boolean;
    }) => {
      const patch: Record<string, unknown> = { status: input.status };
      if (input.verified !== undefined) patch["is_verified"] = input.verified;
      const { error } = await supabase.from("properties").update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      toast.success("Annonce mise à jour.");
    },
    onError: () => toast.error("Action impossible."),
  });

  const setRole = useMutation({
    mutationFn: async (input: { userId: string; role: AppRole; enabled: boolean }) => {
      if (input.enabled) {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: input.userId, role: input.role });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", input.userId)
          .eq("role", input.role);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Rôle mis à jour.");
    },
    onError: () => toast.error("Modification du rôle impossible."),
  });

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary/40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-secondary/40">
        <Header />
        <main className="mx-auto max-w-3xl px-4 pb-24 pt-40 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-gold" />
          <h1 className="mt-4 text-2xl font-extrabold text-foreground">Accès réservé</h1>
          <p className="mt-2 text-muted-foreground">
            Cette console est réservée aux administrateurs de la plateforme.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex rounded-full gold-gradient px-5 py-2.5 text-sm font-bold text-accent-foreground"
          >
            Retour à mon espace
          </Link>
        </main>
      </div>
    );
  }

  const properties = propertiesQuery.data ?? [];
  const pending = properties.filter((p) => p.status === "en_revue" || p.status === "brouillon");

  return (
    <div className="min-h-screen bg-secondary/40">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6">
        <p className="eyebrow">Administration</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Console de modération
        </h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard icon={Building2} label="Annonces" value={properties.length} />
          <StatCard icon={BadgeCheck} label="En attente" value={pending.length} />
          <StatCard icon={Users} label="Utilisateurs" value={(usersQuery.data ?? []).length} />
        </div>

        <Tabs defaultValue="annonces" className="mt-10">
          <TabsList>
            <TabsTrigger value="annonces">Annonces</TabsTrigger>
            <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
          </TabsList>

          <TabsContent value="annonces" className="mt-6">
            <div className="grid gap-3">
              {properties.map((p) => (
                <div
                  key={p.id}
                  className="grid gap-3 rounded-3xl bg-card p-5 shadow-soft sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-bold text-foreground">{p.title}</h2>
                      <Badge variant="secondary">{p.status}</Badge>
                      {p.is_verified && (
                        <Badge className="gold-gradient text-accent-foreground">Vérifié</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.city} · {formatPrice(p.price, p.currency, p.transaction === "location")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() =>
                        moderate.mutate({ id: p.id, status: "publie", verified: true })
                      }
                    >
                      Valider
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => moderate.mutate({ id: p.id, status: "refuse" })}
                    >
                      Refuser
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      onClick={() => moderate.mutate({ id: p.id, status: "archive" })}
                    >
                      Archiver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="utilisateurs" className="mt-6">
            <div className="grid gap-3">
              {(usersQuery.data ?? []).map((u) => (
                <div
                  key={u.id}
                  className="grid gap-3 rounded-3xl bg-card p-5 shadow-soft sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-foreground">
                      {u.full_name ?? "Utilisateur SeLoger"}
                    </h2>
                    <p className="mt-1 flex flex-wrap gap-1 text-xs text-muted-foreground">
                      {u.roles.length === 0 ? "aucun rôle" : u.roles.join(" · ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["agent", "proprietaire", "admin"] as AppRole[]).map((role) => {
                      const enabled = u.roles.includes(role);
                      return (
                        <Button
                          key={role}
                          size="sm"
                          variant={enabled ? "default" : "outline"}
                          className="rounded-full capitalize"
                          onClick={() =>
                            setRole.mutate({ userId: u.id, role, enabled: !enabled })
                          }
                        >
                          {role}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl bg-card p-6 shadow-soft">
      <Icon className="h-5 w-5 text-gold" />
      <p className="mt-3 text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe | SeLoger CI" },
      {
        name: "description",
        content: "Choisissez un nouveau mot de passe pour sécuriser votre compte SeLoger CI.",
      },
      { property: "og:title", content: "Nouveau mot de passe | SeLoger CI" },
      {
        property: "og:description",
        content: "Définissez un nouveau mot de passe pour votre espace SeLoger CI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z.string().min(8, { message: "8 caractères minimum" }).max(72),
    confirm: z.string().max(72),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Mot de passe mis à jour.");
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-secondary px-4 py-16">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-elevated">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full gold-gradient">
            <Crown className="h-4 w-4 text-accent-foreground" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-foreground">
            SeLoger<span className="text-gold">CI</span>
          </span>
        </Link>

        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-foreground">
          Nouveau mot de passe
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready
            ? "Choisissez un mot de passe robuste (8 caractères minimum)."
            : "Ouvrez cette page depuis le lien reçu par e-mail."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              maxLength={72}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm">Confirmation</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              maxLength={72}
            />
          </div>
          <Button type="submit" disabled={loading || !ready} className="rounded-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mettre à jour
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/auth" className="font-semibold text-gold hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}

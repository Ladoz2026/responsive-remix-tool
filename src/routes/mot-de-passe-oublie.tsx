import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/mot-de-passe-oublie")({
  head: () => ({
    meta: [
      { title: "Mot de passe oublié | SeLoger CI" },
      {
        name: "description",
        content:
          "Recevez un lien sécurisé pour réinitialiser le mot de passe de votre compte SeLoger CI.",
      },
      { property: "og:title", content: "Mot de passe oublié | SeLoger CI" },
      {
        property: "og:description",
        content: "Réinitialisez en toute sécurité l'accès à votre espace SeLoger CI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.object({
  email: z.string().trim().email({ message: "Adresse e-mail invalide" }).max(255),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "E-mail invalide");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Envoi impossible pour le moment.");
      return;
    }
    setSent(true);
    toast.success("Lien de réinitialisation envoyé.");
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
          Mot de passe oublié
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saisissez votre e-mail, nous vous envoyons un lien de réinitialisation.
        </p>

        {sent ? (
          <div className="mt-6 rounded-2xl bg-secondary p-5 text-sm text-muted-foreground">
            Si un compte existe pour <strong className="text-foreground">{email}</strong>, un lien
            vient d'être envoyé. Pensez à vérifier vos spams.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.ci"
                required
                maxLength={255}
              />
            </div>
            <Button type="submit" disabled={loading} className="rounded-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Envoyer le lien
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/auth" className="font-semibold text-gold hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}

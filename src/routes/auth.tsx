import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const title = "Connexion — SeLoger CI";
const description = "Connectez-vous à votre espace agence SeLoger CI pour gérer vos annonces.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: String(form.get("full_name") ?? ""),
            phone: String(form.get("phone") ?? ""),
          },
        },
      });
      setLoading(false);
      if (error) toast.error(error.message);
      else toast.success("Compte créé. Vérifiez votre email pour confirmer.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else navigate({ to: "/dashboard" });
  }

  const field =
    "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold";

  return (
    <div className="grid min-h-screen place-items-center bg-secondary/60 px-4 py-16 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-elevated">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full gold-gradient">
            <Crown className="h-4 w-4 text-accent-foreground" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-foreground">
            SeLoger<span className="text-gold">CI</span>
          </span>
        </div>

        <h1 className="mt-6 text-2xl font-extrabold text-foreground">
          {mode === "login" ? "Connexion agence" : "Créer un compte"}
        </h1>

        <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
          {mode === "signup" && (
            <>
              <input name="full_name" required placeholder="Nom de l'agence" className={field} />
              <input name="phone" placeholder="Téléphone" className={field} />
            </>
          )}
          <input name="email" type="email" required placeholder="Email" className={field} />
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Mot de passe"
            className={field}
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full gold-gradient px-5 py-3 text-sm font-bold text-accent-foreground shadow-gold disabled:opacity-60"
          >
            {loading ? "Patientez…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-5 w-full text-sm text-muted-foreground hover:text-gold"
        >
          {mode === "login" ? "Pas encore de compte ? Inscrivez-vous" : "J'ai déjà un compte"}
        </button>
      </div>
    </div>
  );
}

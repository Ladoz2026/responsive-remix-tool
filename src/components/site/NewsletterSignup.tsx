import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  email: z.string().trim().email({ message: "E-mail invalide" }).max(255),
  full_name: z.string().trim().max(100).optional(),
});

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse({ email, full_name: fullName || undefined });
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email: parsed.email.toLowerCase(),
        full_name: parsed.full_name ?? null,
        source: "footer",
      });
      if (error) {
        if (error.code === "23505") throw new Error("Cette adresse est déjà inscrite.");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Inscription confirmée ! Vous recevrez nos nouveautés immobilières.");
      setEmail("");
      setFullName("");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof z.ZodError
          ? (error.issues[0]?.message ?? "Données invalides")
          : error instanceof Error
            ? error.message
            : "Inscription impossible";
      toast.error(message);
    },
  });

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <div className="rounded-[2rem] border border-border bg-card p-8 shadow-soft sm:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Newsletter</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
              Les meilleures opportunités, chaque semaine.
            </h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Nouvelles annonces vérifiées, tendances des prix à Abidjan et conseils d'experts —
              directement dans votre boîte mail. Désinscription en un clic.
            </p>
          </div>

          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Votre nom (facultatif)"
              maxLength={100}
              aria-label="Votre nom"
              className="h-12 rounded-full border border-border bg-background px-5 text-sm outline-none transition-colors focus:border-gold"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                maxLength={255}
                aria-label="Votre adresse e-mail"
                className="h-12 flex-1 rounded-full border border-border bg-background px-5 text-sm outline-none transition-colors focus:border-gold"
              />
              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full gold-gradient px-6 text-sm font-bold text-accent-foreground shadow-gold transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                S'inscrire
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/format";

function Stars({
  value,
  onChange,
}: {
  value: number;
  onChange?: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          className={onChange ? "transition-transform hover:scale-110" : "cursor-default"}
        >
          <Star
            className={`h-4 w-4 ${n <= value ? "fill-gold text-gold" : "text-muted-foreground"}`}
          />
        </button>
      ))}
    </div>
  );
}

export function PropertyReviews({ propertyId }: { propertyId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const authorIds = [...new Set(reviews.map((r) => r.author_id))];
  const { data: authors = [] } = useQuery({
    queryKey: ["review-authors", authorIds.join(",")],
    enabled: authorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", authorIds);
      if (error) throw error;
      return data;
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      const trimmed = comment.trim();
      if (trimmed.length > 1000) throw new Error("Commentaire trop long");
      const { error } = await supabase.from("reviews").insert({
        author_id: user.id,
        property_id: propertyId,
        rating,
        comment: trimmed || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      setRating(5);
      toast.success("Merci pour votre avis !");
      void queryClient.invalidateQueries({ queryKey: ["reviews", propertyId] });
    },
    onError: (e: Error) => {
      toast.error(
        e.message === "auth"
          ? "Connectez-vous pour laisser un avis."
          : "Vous avez déjà laissé un avis sur ce bien.",
      );
    },
  });

  const average =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  return (
    <section className="mt-8 rounded-3xl bg-card p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">Avis</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <Stars value={Math.round(average)} />
            <span className="text-sm font-semibold text-foreground">{average}/5</span>
            <span className="text-xs text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <Loader2 className="mt-6 h-5 w-5 animate-spin text-muted-foreground" />
      ) : reviews.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Aucun avis pour l'instant. Soyez le premier à partager votre expérience.
        </p>
      ) : (
        <ul className="mt-5 grid gap-4">
          {reviews.map((r) => {
            const author = authors.find((a) => a.id === r.author_id);
            return (
              <li key={r.id} className="flex gap-3 border-b border-border/60 pb-4 last:border-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-foreground">
                  {initials(author?.full_name ?? "?")}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {author?.full_name ?? "Utilisateur"}
                    </p>
                    <Stars value={r.rating} />
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {r.comment}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {user ? (
        <form
          className="mt-6 grid gap-3 rounded-2xl bg-secondary/50 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">Votre note</span>
            <Stars value={rating} onChange={setRating} />
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Partagez votre expérience sur ce bien (facultatif)"
          />
          <Button type="submit" disabled={submit.isPending} className="justify-self-start rounded-full">
            {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publier mon avis
          </Button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          Connectez-vous pour laisser un avis sur ce bien.
        </p>
      )}
    </section>
  );
}

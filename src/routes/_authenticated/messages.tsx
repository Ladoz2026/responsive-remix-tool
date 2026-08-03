import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/site/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messagerie | SeLoger CI" },
      {
        name: "description",
        content:
          "Échangez directement avec les propriétaires, agents et acheteurs autour de vos biens sur SeLoger CI.",
      },
      { property: "og:title", content: "Messagerie | SeLoger CI" },
      {
        property: "og:description",
        content: "Conversations privées entre acheteurs, agents et propriétaires.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MessagesPage,
});

type ConversationRow = {
  id: string;
  property_id: string | null;
  participant_a: string;
  participant_b: string;
  last_message_at: string;
};

function MessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const conversationsQuery = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<ConversationRow[]> => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, property_id, participant_a, participant_b, last_message_at")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const conversations = useMemo(() => conversationsQuery.data ?? [], [conversationsQuery.data]);

  useEffect(() => {
    if (!activeId && conversations.length > 0) setActiveId(conversations[0]!.id);
  }, [conversations, activeId]);

  const { data: profiles } = useQuery({
    queryKey: ["conversation-profiles", conversations.map((c) => c.id).join(",")],
    enabled: conversations.length > 0 && Boolean(user),
    queryFn: async () => {
      const ids = Array.from(
        new Set(
          conversations
            .flatMap((c) => [c.participant_a, c.participant_b])
            .filter((id) => id !== user!.id),
        ),
      );
      if (ids.length === 0) return {} as Record<string, string>;
      const { data } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      return Object.fromEntries(
        (data ?? []).map((p) => [p.id, p.full_name ?? "Utilisateur SeLoger"]),
      ) as Record<string, string>;
    },
  });

  const { data: properties } = useQuery({
    queryKey: ["conversation-properties", conversations.map((c) => c.property_id).join(",")],
    enabled: conversations.some((c) => c.property_id),
    queryFn: async () => {
      const ids = conversations.map((c) => c.property_id).filter(Boolean) as string[];
      const { data } = await supabase.from("properties").select("id, title").in("id", ids);
      return Object.fromEntries((data ?? []).map((p) => [p.id, p.title])) as Record<string, string>;
    },
  });

  const messagesQuery = useQuery({
    queryKey: ["messages", activeId],
    enabled: Boolean(activeId),
    refetchInterval: 8000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, body, created_at")
        .eq("conversation_id", activeId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      const body = draft.trim();
      if (!body || !activeId || !user) throw new Error("empty");
      const { error } = await supabase
        .from("messages")
        .insert({ conversation_id: activeId, sender_id: user.id, body: body.slice(0, 2000) });
      if (error) throw error;
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", activeId);
    },
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => toast.error("Message non envoyé."),
  });

  const otherOf = (c: ConversationRow) =>
    c.participant_a === user?.id ? c.participant_b : c.participant_a;

  return (
    <div className="min-h-screen bg-secondary/40">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6">
        <p className="eyebrow">Messagerie</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Vos conversations
        </h1>

        {conversationsQuery.isLoading ? (
          <div className="grid place-items-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-soft">
            <h2 className="text-lg font-bold text-foreground">Aucune conversation</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Contactez un vendeur depuis la page d'un bien pour démarrer un échange.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-3xl bg-card p-3 shadow-soft">
              <div className="grid gap-1">
                {conversations.map((c) => {
                  const other = otherOf(c);
                  const name = profiles?.[other] ?? "Utilisateur SeLoger";
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveId(c.id)}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
                        activeId === c.id ? "bg-secondary" : "hover:bg-secondary/60"
                      }`}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full gold-gradient text-xs font-bold text-accent-foreground">
                        {initials(name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {c.property_id ? (properties?.[c.property_id] ?? "Bien immobilier") : "Discussion"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="flex h-[560px] flex-col rounded-3xl bg-card shadow-soft">
              <div className="flex-1 space-y-3 overflow-y-auto p-6">
                {(messagesQuery.data ?? []).map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <p
                        className={`max-w-[75%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                          mine
                            ? "gold-gradient text-accent-foreground"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        {m.body}
                      </p>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage.mutate();
                }}
                className="flex items-center gap-3 border-t border-border p-4"
              >
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Écrivez votre message…"
                  maxLength={2000}
                  className="rounded-full"
                />
                <Button
                  type="submit"
                  disabled={sendMessage.isPending || !draft.trim()}
                  className="rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

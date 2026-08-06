import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { PropertyForm } from "@/components/site/PropertyForm";

export const Route = createFileRoute("/_authenticated/annonces/nouvelle")({
  head: () => ({
    meta: [
      { title: "Nouvelle annonce — SeLoger CI" },
      { name: "description", content: "Publiez une nouvelle annonce immobilière." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewProperty,
});

function NewProperty() {
  const { user } = Route.useRouteContext();
  return (
    <div className="min-h-screen bg-secondary/40 font-sans">
      <Header solid />
      <main className="mx-auto max-w-4xl px-4 pt-28 pb-20 sm:px-6">
        <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-foreground">
          Nouvelle annonce
        </h1>
        <PropertyForm userId={user.id} />
      </main>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { PropertyForm } from "@/components/site/PropertyForm";
import { propertyQuery } from "@/lib/property-queries";

export const Route = createFileRoute("/_authenticated/annonces/$id")({
  head: () => ({
    meta: [
      { title: "Modifier l'annonce — SeLoger CI" },
      { name: "description", content: "Modifiez les informations de votre annonce." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditProperty,
});

function EditProperty() {
  const { user } = Route.useRouteContext();
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery(propertyQuery(id));

  return (
    <div className="min-h-screen bg-secondary/40 font-sans">
      <Header solid />
      <main className="mx-auto max-w-4xl px-4 pt-28 pb-20 sm:px-6">
        <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-foreground">
          Modifier l'annonce
        </h1>
        {isLoading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : data?.property ? (
          <PropertyForm userId={user.id} initial={data.property as never} />
        ) : (
          <p className="text-muted-foreground">Annonce introuvable.</p>
        )}
      </main>
    </div>
  );
}

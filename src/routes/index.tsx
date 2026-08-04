import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Categories } from "@/components/site/Categories";
import { Properties } from "@/components/site/Properties";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Validation } from "@/components/site/Validation";
import { Testimonials } from "@/components/site/Testimonials";
import { Magazine } from "@/components/site/Magazine";
import { CtaFooter } from "@/components/site/CtaFooter";

const title = "SeLogerCI — Immobilier premium en Côte d'Ivoire";
const description =
  "Achetez, louez ou vendez des biens vérifiés à Abidjan et partout en Côte d'Ivoire : villas, appartements, terrains et bureaux.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <main>
        <Hero />
        <Categories />
        <Properties />
        <HowItWorks />
        <Validation />
        <Testimonials />
        <Magazine />
        <CtaFooter />
      </main>
    </div>
  );
}

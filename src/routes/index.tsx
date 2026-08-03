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
import { NewsletterSignup } from "@/components/site/NewsletterSignup";

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
      { property: "og:url", content: "https://seloger-ci.poroinfo.net/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://seloger-ci.poroinfo.net/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "SeLoger CI",
          url: "https://seloger-ci.poroinfo.net",
          potentialAction: {
            "@type": "SearchAction",
            target:
              "https://seloger-ci.poroinfo.net/recherche?ville={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
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
        <NewsletterSignup />
      <CtaFooter />
      </main>
    </div>
  );
}

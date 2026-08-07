import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProperties from "./tools/search-properties";
import getProperty from "./tools/get-property";
import listMyProperties from "./tools/list-my-properties";
import createProperty from "./tools/create-property";
import updateProperty from "./tools/update-property";
import listContactRequests from "./tools/list-contact-requests";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "site-duplicator",
  title: "Site Duplicator",
  version: "0.1.0",
  instructions:
    "Outils de la plateforme immobilière SeLoger CI (Côte d'Ivoire). `search_properties` et `get_property` explorent les annonces publiées. Une fois connecté, `list_my_properties`, `create_property`, `update_property` et `list_contact_requests` gèrent les annonces et les leads de votre agence.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchProperties,
    getProperty,
    listMyProperties,
    createProperty,
    updateProperty,
    listContactRequests,
  ],
});

# Plan de migration — base « immobilier »

Objectif : rendre SeLoger CI pleinement compatible avec la base existante, en **ajout seulement**.
Aucune table supprimée/renommée, aucune donnée modifiée, aucune relation existante touchée.
Ce SQL sera à exécuter **par toi** dans l'éditeur SQL de ton projet (la base est externe à Lovable).

Tout est écrit en `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` → ré-exécutable sans doublon.

---

## 1. Référentiel géographique : `cities`, `communes`, `districts`

Hiérarchie : ville → commune → quartier.

### cities
| colonne | type | notes |
|---|---|---|
| id | uuid | **PK**, `default gen_random_uuid()` |
| code | text | unique, clé métier (cohérent avec le style `*_code` de ta base) |
| name | text | not null |
| slug | text | unique, not null |
| region | text | nullable |
| latitude / longitude | numeric | nullable |
| sort_order | integer | not null default 0 |
| is_active | boolean | not null default true |
| created_at / updated_at | timestamptz | default now() |

### communes
Idem + `city_id uuid not null → cities(id) ON DELETE RESTRICT`, unique `(city_id, slug)`.

### districts
Idem + `commune_id uuid not null → communes(id) ON DELETE RESTRICT`, unique `(commune_id, slug)`.

**Index** : `cities(slug)`, `cities(is_active)`, `communes(city_id)`, `communes(slug)`, `districts(commune_id)`, `districts(slug)`.

**RLS** : activée. Lecture publique (`anon` + `authenticated`) car ce sont des référentiels ; écriture réservée à `service_role` et aux admins (`profiles.role_code = 'admin'`).
GRANT : `SELECT` à `anon` et `authenticated`, `ALL` à `service_role`.

---

## 2. Localisation sur `properties` (ajout de colonnes, non destructif)

`properties` n'a aujourd'hui **aucune colonne de localisation**. Approche recommandée : **double stockage** — références normalisées + texte libre de repli, toutes **nullable** pour ne casser aucune ligne existante.

```
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS city_id     uuid REFERENCES public.cities(id)    ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commune_id  uuid REFERENCES public.communes(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS city        text,
  ADD COLUMN IF NOT EXISTS commune     text,
  ADD COLUMN IF NOT EXISTS district    text,
  ADD COLUMN IF NOT EXISTS address     text,
  ADD COLUMN IF NOT EXISTS latitude    double precision,
  ADD COLUMN IF NOT EXISTS longitude   double precision;
```

Pourquoi les deux : les `*_id` servent aux filtres de recherche fiables ; les champs texte servent à l'affichage et aux imports/annonces sans correspondance dans le référentiel. Aucun `NOT NULL`, aucun `DEFAULT` → les lignes existantes restent valides.

**Index** : `properties(city_id)`, `properties(commune_id)`, `properties(district_id)`, index composite `(city_id, listing_type_code, price)` pour la recherche, et `(latitude, longitude)` pour la carte.

Aucune policy RLS existante de `properties` n'est modifiée.

---

## 3. `property_images` (galerie + image principale)

| colonne | type | notes |
|---|---|---|
| id | uuid | **PK** |
| property_id | uuid | not null → `properties(id) ON DELETE CASCADE` |
| url | text | not null (chemin Storage ou URL absolue) |
| storage_path | text | nullable, chemin bucket |
| alt | text | nullable |
| is_primary | boolean | not null default false |
| sort_order | integer | not null default 0 |
| width / height / size_bytes | integer | nullable |
| created_at | timestamptz | default now() |

**Image principale** : index unique partiel garantissant **au plus une** image principale par bien :
`CREATE UNIQUE INDEX ... ON property_images(property_id) WHERE is_primary;`
Un trigger `BEFORE INSERT/UPDATE` bascule l'ancienne principale à `false` quand une nouvelle est marquée, pour éviter les erreurs d'unicité côté app.

**Index** : `(property_id, sort_order)`, `(property_id) WHERE is_primary`.

**RLS** : lecture publique des images des biens publiés (`is_published`/`is_active`) ; insertion/mise à jour/suppression réservées au propriétaire (`properties.owner_id = auth.uid()`), aux membres de l'agence du bien, et aux admins. Vérifications via fonction `SECURITY DEFINER` `can_manage_property(_property_id, _user_id)` pour éviter toute récursion RLS.
GRANT : `SELECT` à `anon`+`authenticated`, `INSERT/UPDATE/DELETE` à `authenticated`, `ALL` à `service_role`.

---

## 4. `contact_requests` (leads)

| colonne | type | notes |
|---|---|---|
| id | uuid | **PK** |
| property_id | uuid | nullable → `properties(id) ON DELETE SET NULL` |
| agency_id | uuid | nullable → `agencies(id) ON DELETE SET NULL` |
| owner_id | uuid | nullable → `profiles(id) ON DELETE SET NULL` (destinataire) |
| requester_id | uuid | nullable → `profiles(id) ON DELETE SET NULL` (si connecté) |
| full_name / email | text | not null |
| phone | text | nullable |
| message | text | not null |
| channel | text | not null default `'site'` (site, whatsapp, telephone) |
| status_code | text | not null default `'nouveau'` (nouveau, en_cours, traite, clos) |
| priority | text | not null default `'normale'` |
| assigned_to | uuid | nullable → `profiles(id)` |
| follow_up_at / last_contacted_at | timestamptz | nullable |
| created_at / updated_at | timestamptz | default now() |

`agency_id` et `owner_id` sont renseignés à l'insertion par un trigger `BEFORE INSERT` qui les recopie depuis le bien, quand `property_id` est fourni : le lead reste rattachable même si le bien est supprimé plus tard.

**Index** : `(property_id)`, `(agency_id)`, `(owner_id)`, `(status_code, created_at DESC)`, `(assigned_to)`.

**RLS** : création autorisée à tous (`anon` + `authenticated`) — c'est un formulaire public. Lecture/mise à jour réservées au propriétaire du bien, à l'agence rattachée, à l'assigné et aux admins, via fonction `SECURITY DEFINER`. Aucune suppression sauf `service_role`.
GRANT : `INSERT` à `anon`+`authenticated`, `SELECT/UPDATE` à `authenticated`, `ALL` à `service_role`.

---

## 5. Éléments transverses

- Fonction `public.set_updated_at()` + triggers `BEFORE UPDATE` sur les 5 nouvelles tables (créée seulement si absente).
- Fonctions `SECURITY DEFINER` avec `SET search_path = public` : `is_admin(uuid)`, `can_manage_property(uuid, uuid)`, `can_manage_lead(uuid, uuid)`.
- Rôles : on s'appuie sur `profiles.role_code` + `roles` déjà présents — **aucune** nouvelle table de rôles.
- Le SQL sera livré en un seul script idempotent, ordonné : fonctions → cities → communes → districts → colonnes properties → property_images → contact_requests → triggers → GRANT → RLS → policies.

---

## Détails techniques

- Aucun `DROP`, `ALTER TABLE ... RENAME`, `UPDATE` ou `DELETE` dans le script.
- Toutes les nouvelles colonnes de `properties` sont nullable et sans default → pas de réécriture de table, pas de verrou long.
- Les `ON DELETE` sont choisis pour ne jamais supprimer en cascade des données métier existantes (`SET NULL`/`RESTRICT`), sauf `property_images` qui suit logiquement son bien.
- Après validation et exécution, étape suivante (hors de ce plan) : réécrire les requêtes de l'app sur `*_code`, `name_fr`, `property_images` et `contact_requests`.

## Questions à trancher avant exécution

1. Veux-tu que je **pré-remplisse** `cities/communes/districts` avec les villes et communes de Côte d'Ivoire (Abidjan et ses 13 communes, etc.) ? Cela implique des `INSERT` dans les **nouvelles** tables uniquement.
2. Les images sont-elles déjà stockées quelque part dans ta base (colonne JSON, bucket existant) ? Si oui, je m'y adapte plutôt que d'imposer `url`.

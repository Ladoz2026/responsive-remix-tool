-- =====================================================================
-- SeLoger CI — Migration de compatibilité pour la base « immobilier »
-- Projet Supabase externe : jilihrowleimacfrujgb
--
-- À exécuter dans l'éditeur SQL de TON projet Supabase.
-- Script 100 % additif et idempotent : aucun DROP TABLE, aucun RENAME,
-- aucun UPDATE/DELETE de données existantes. Ré-exécutable sans doublon.
--
-- Ordre : fonctions -> cities -> communes -> districts -> colonnes
--         properties -> property_images -> contact_requests -> triggers
--         -> GRANT -> RLS -> policies
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Fonctions transverses
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id AND p.role_code = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 1. Référentiel géographique
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE,
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  region      text,
  latitude    numeric,
  longitude   numeric,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cities TO anon, authenticated;
GRANT ALL ON public.cities TO service_role;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.communes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id     uuid NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT,
  code        text UNIQUE,
  name        text NOT NULL,
  slug        text NOT NULL,
  latitude    numeric,
  longitude   numeric,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city_id, slug)
);

GRANT SELECT ON public.communes TO anon, authenticated;
GRANT ALL ON public.communes TO service_role;
ALTER TABLE public.communes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.districts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commune_id  uuid NOT NULL REFERENCES public.communes(id) ON DELETE RESTRICT,
  code        text UNIQUE,
  name        text NOT NULL,
  slug        text NOT NULL,
  latitude    numeric,
  longitude   numeric,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (commune_id, slug)
);

GRANT SELECT ON public.districts TO anon, authenticated;
GRANT ALL ON public.districts TO service_role;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS cities_slug_idx        ON public.cities (slug);
CREATE INDEX IF NOT EXISTS cities_active_idx      ON public.cities (is_active);
CREATE INDEX IF NOT EXISTS communes_city_idx      ON public.communes (city_id);
CREATE INDEX IF NOT EXISTS communes_slug_idx      ON public.communes (slug);
CREATE INDEX IF NOT EXISTS districts_commune_idx  ON public.districts (commune_id);
CREATE INDEX IF NOT EXISTS districts_slug_idx     ON public.districts (slug);

-- ---------------------------------------------------------------------
-- 2. Localisation sur properties (colonnes nullable, non destructif)
-- ---------------------------------------------------------------------

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

CREATE INDEX IF NOT EXISTS properties_city_idx      ON public.properties (city_id);
CREATE INDEX IF NOT EXISTS properties_commune_idx   ON public.properties (commune_id);
CREATE INDEX IF NOT EXISTS properties_district_idx  ON public.properties (district_id);
CREATE INDEX IF NOT EXISTS properties_search_idx    ON public.properties (city_id, listing_type_code, price);
CREATE INDEX IF NOT EXISTS properties_geo_idx       ON public.properties (latitude, longitude);

-- ---------------------------------------------------------------------
-- 3. Droits de gestion d'un bien (SECURITY DEFINER, pas de récursion RLS)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_manage_property(_property_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.properties pr
    LEFT JOIN public.profiles me ON me.id = _user_id
    WHERE pr.id = _property_id
      AND (
        pr.owner_id = _user_id
        OR (pr.agency_id IS NOT NULL AND me.agency_id = pr.agency_id)
        OR me.role_code = 'admin'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.property_is_public(_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties pr
    WHERE pr.id = _property_id
      AND COALESCE(pr.is_published, false)
      AND COALESCE(pr.is_active, true)
  );
$$;

-- ---------------------------------------------------------------------
-- 4. property_images (galerie + image principale)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.property_images (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url           text NOT NULL,
  storage_path  text,
  alt           text,
  is_primary    boolean NOT NULL DEFAULT false,
  sort_order    integer NOT NULL DEFAULT 0,
  width         integer,
  height        integer,
  size_bytes    integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.property_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_images TO authenticated;
GRANT ALL ON public.property_images TO service_role;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS property_images_property_idx
  ON public.property_images (property_id, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS property_images_one_primary_idx
  ON public.property_images (property_id) WHERE is_primary;

-- Une seule image principale : la précédente bascule automatiquement à false.
CREATE OR REPLACE FUNCTION public.enforce_single_primary_image()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_primary THEN
    UPDATE public.property_images
       SET is_primary = false
     WHERE property_id = NEW.property_id
       AND id <> NEW.id
       AND is_primary;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS property_images_single_primary ON public.property_images;
CREATE TRIGGER property_images_single_primary
  BEFORE INSERT OR UPDATE OF is_primary ON public.property_images
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_primary_image();

-- ---------------------------------------------------------------------
-- 5. contact_requests (leads)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.contact_requests (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id        uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  agency_id          uuid REFERENCES public.agencies(id)   ON DELETE SET NULL,
  owner_id           uuid REFERENCES public.profiles(id)   ON DELETE SET NULL,
  requester_id       uuid REFERENCES public.profiles(id)   ON DELETE SET NULL,
  full_name          text NOT NULL,
  email              text NOT NULL,
  phone              text,
  message            text NOT NULL,
  channel            text NOT NULL DEFAULT 'site',
  status_code        text NOT NULL DEFAULT 'nouveau',
  priority           text NOT NULL DEFAULT 'normale',
  assigned_to        uuid REFERENCES public.profiles(id)   ON DELETE SET NULL,
  follow_up_at       timestamptz,
  last_contacted_at  timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_requests TO anon;
GRANT SELECT, INSERT, UPDATE ON public.contact_requests TO authenticated;
GRANT ALL ON public.contact_requests TO service_role;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS contact_requests_property_idx ON public.contact_requests (property_id);
CREATE INDEX IF NOT EXISTS contact_requests_agency_idx   ON public.contact_requests (agency_id);
CREATE INDEX IF NOT EXISTS contact_requests_owner_idx    ON public.contact_requests (owner_id);
CREATE INDEX IF NOT EXISTS contact_requests_status_idx   ON public.contact_requests (status_code, created_at DESC);
CREATE INDEX IF NOT EXISTS contact_requests_assigned_idx ON public.contact_requests (assigned_to);

-- Rattachement automatique agence / propriétaire depuis le bien.
CREATE OR REPLACE FUNCTION public.fill_contact_request_targets()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.property_id IS NOT NULL AND (NEW.agency_id IS NULL OR NEW.owner_id IS NULL) THEN
    SELECT COALESCE(NEW.agency_id, pr.agency_id), COALESCE(NEW.owner_id, pr.owner_id)
      INTO NEW.agency_id, NEW.owner_id
    FROM public.properties pr
    WHERE pr.id = NEW.property_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contact_requests_fill_targets ON public.contact_requests;
CREATE TRIGGER contact_requests_fill_targets
  BEFORE INSERT ON public.contact_requests
  FOR EACH ROW EXECUTE FUNCTION public.fill_contact_request_targets();

CREATE OR REPLACE FUNCTION public.can_manage_lead(_request_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.contact_requests cr
    LEFT JOIN public.profiles me ON me.id = _user_id
    WHERE cr.id = _request_id
      AND (
        cr.owner_id = _user_id
        OR cr.assigned_to = _user_id
        OR (cr.agency_id IS NOT NULL AND me.agency_id = cr.agency_id)
        OR me.role_code = 'admin'
      )
  );
$$;

-- ---------------------------------------------------------------------
-- 6. Triggers updated_at
-- ---------------------------------------------------------------------

DROP TRIGGER IF EXISTS cities_set_updated_at ON public.cities;
CREATE TRIGGER cities_set_updated_at BEFORE UPDATE ON public.cities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS communes_set_updated_at ON public.communes;
CREATE TRIGGER communes_set_updated_at BEFORE UPDATE ON public.communes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS districts_set_updated_at ON public.districts;
CREATE TRIGGER districts_set_updated_at BEFORE UPDATE ON public.districts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS contact_requests_set_updated_at ON public.contact_requests;
CREATE TRIGGER contact_requests_set_updated_at BEFORE UPDATE ON public.contact_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- 7. Policies RLS
-- ---------------------------------------------------------------------

-- Référentiels géographiques : lecture publique, écriture admin uniquement.
DROP POLICY IF EXISTS cities_public_read ON public.cities;
CREATE POLICY cities_public_read ON public.cities
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS cities_admin_write ON public.cities;
CREATE POLICY cities_admin_write ON public.cities
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS communes_public_read ON public.communes;
CREATE POLICY communes_public_read ON public.communes
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS communes_admin_write ON public.communes;
CREATE POLICY communes_admin_write ON public.communes
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS districts_public_read ON public.districts;
CREATE POLICY districts_public_read ON public.districts
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS districts_admin_write ON public.districts;
CREATE POLICY districts_admin_write ON public.districts
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Images : lecture publique pour les biens publiés, gestion par le propriétaire/agence/admin.
DROP POLICY IF EXISTS property_images_public_read ON public.property_images;
CREATE POLICY property_images_public_read ON public.property_images
  FOR SELECT TO anon, authenticated
  USING (public.property_is_public(property_id));

DROP POLICY IF EXISTS property_images_manager_read ON public.property_images;
CREATE POLICY property_images_manager_read ON public.property_images
  FOR SELECT TO authenticated
  USING (public.can_manage_property(property_id, auth.uid()));

DROP POLICY IF EXISTS property_images_manager_insert ON public.property_images;
CREATE POLICY property_images_manager_insert ON public.property_images
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_property(property_id, auth.uid()));

DROP POLICY IF EXISTS property_images_manager_update ON public.property_images;
CREATE POLICY property_images_manager_update ON public.property_images
  FOR UPDATE TO authenticated
  USING (public.can_manage_property(property_id, auth.uid()))
  WITH CHECK (public.can_manage_property(property_id, auth.uid()));

DROP POLICY IF EXISTS property_images_manager_delete ON public.property_images;
CREATE POLICY property_images_manager_delete ON public.property_images
  FOR DELETE TO authenticated
  USING (public.can_manage_property(property_id, auth.uid()));

-- Leads : création publique (formulaire), lecture/màj réservées aux destinataires.
DROP POLICY IF EXISTS contact_requests_public_insert ON public.contact_requests;
CREATE POLICY contact_requests_public_insert ON public.contact_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS contact_requests_manager_read ON public.contact_requests;
CREATE POLICY contact_requests_manager_read ON public.contact_requests
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR public.can_manage_lead(id, auth.uid()));

DROP POLICY IF EXISTS contact_requests_manager_update ON public.contact_requests;
CREATE POLICY contact_requests_manager_update ON public.contact_requests
  FOR UPDATE TO authenticated
  USING (public.can_manage_lead(id, auth.uid()))
  WITH CHECK (public.can_manage_lead(id, auth.uid()));

-- Aucune policy DELETE : suppression réservée à service_role.

-- =====================================================================
-- Fin du script.
-- =====================================================================

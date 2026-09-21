-- 004 — Lecture publique (anonyme) des référentiels métier
-- 100 % additif : aucune table ni donnée n'est modifiée ou supprimée.
-- À exécuter dans le SQL Editor du projet Supabase « immobilier ».
--
-- Contexte : listing_types, property_categories, property_types, amenities et
-- amenity_categories renvoient 0 ligne en anonyme alors que les données existent
-- => les policies SELECT pour le rôle anon manquent.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'listing_types',
    'property_categories',
    'property_types',
    'amenities',
    'amenity_categories'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = t) THEN

      EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated;', t);
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = t
          AND policyname = 'public_read_' || t
      ) THEN
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true);',
          'public_read_' || t, t
        );
      END IF;
    END IF;
  END LOOP;
END $$;

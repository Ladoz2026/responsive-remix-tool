-- ============ REFERENTIELS ============
CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cities TO anon, authenticated;
GRANT ALL ON public.cities TO service_role;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Villes visibles" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Admin gere villes" ON public.cities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT INSERT, UPDATE, DELETE ON public.cities TO authenticated;

CREATE TABLE public.communes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city_id, slug)
);
GRANT SELECT ON public.communes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.communes TO authenticated;
GRANT ALL ON public.communes TO service_role;
ALTER TABLE public.communes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Communes visibles" ON public.communes FOR SELECT USING (true);
CREATE POLICY "Admin gere communes" ON public.communes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commune_id uuid NOT NULL REFERENCES public.communes(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (commune_id, slug)
);
GRANT SELECT ON public.districts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.districts TO authenticated;
GRANT ALL ON public.districts TO service_role;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quartiers visibles" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Admin gere quartiers" ON public.districts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories visibles" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin gere categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ PROPERTIES ============
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commune_id uuid REFERENCES public.communes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agent_id uuid,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS has_kitchen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_pool boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_garage boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_garden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_ac boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_furnished boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS virtual_tour_url text,
  ADD COLUMN IF NOT EXISTS documents text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS slug text;

CREATE INDEX IF NOT EXISTS properties_status_idx ON public.properties(status);
CREATE INDEX IF NOT EXISTS properties_city_idx ON public.properties(city_id);
CREATE INDEX IF NOT EXISTS properties_price_idx ON public.properties(price);

-- expiration auto 180 jours
CREATE OR REPLACE FUNCTION public.set_property_publication()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'publie' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'publie') THEN
    NEW.published_at = COALESCE(NEW.published_at, now());
    NEW.expires_at = COALESCE(NEW.expires_at, now() + interval '180 days');
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.set_property_publication() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS properties_publication ON public.properties;
CREATE TRIGGER properties_publication BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_property_publication();

-- ============ PROPERTY IMAGES ============
CREATE TABLE public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.property_images TO authenticated;
GRANT ALL ON public.property_images TO service_role;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photos annonces visibles" ON public.property_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.status = 'publie'));
CREATE POLICY "Proprietaire gere photos" ON public.property_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.owner_id = auth.uid() OR p.agent_id = auth.uid())) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.owner_id = auth.uid() OR p.agent_id = auth.uid())) OR public.has_role(auth.uid(),'admin'));

-- ============ FAVORIS ============
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mes favoris" ON public.favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ COMPARAISONS ============
CREATE TABLE public.comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comparisons TO authenticated;
GRANT ALL ON public.comparisons TO service_role;
ALTER TABLE public.comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mes comparaisons" ON public.comparisons FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER comparisons_updated_at BEFORE UPDATE ON public.comparisons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PAIEMENTS / ABONNEMENTS ============
CREATE TYPE public.payment_status AS ENUM ('en_attente','paye','echoue','rembourse');
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'stripe',
  provider_reference text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  status public.payment_status NOT NULL DEFAULT 'en_attente',
  invoice_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Voir mes paiements" ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Creer mon paiement" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'standard',
  status text NOT NULL DEFAULT 'inactive',
  provider text NOT NULL DEFAULT 'stripe',
  provider_reference text,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Voir mon abonnement" ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Voir mes notifications" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Modifier mes notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Supprimer mes notifications" ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, is_read);

-- ============ MESSAGERIE ============
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  participant_a uuid NOT NULL,
  participant_b uuid NOT NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mes conversations" ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() IN (participant_a, participant_b));
CREATE POLICY "Creer conversation" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (participant_a, participant_b));
CREATE POLICY "Maj conversation" ON public.conversations FOR UPDATE TO authenticated
  USING (auth.uid() IN (participant_a, participant_b)) WITH CHECK (auth.uid() IN (participant_a, participant_b));

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Voir messages de mes conversations" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND auth.uid() IN (c.participant_a, c.participant_b)));
CREATE POLICY "Envoyer un message" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND auth.uid() IN (c.participant_a, c.participant_b)));
CREATE POLICY "Marquer message lu" ON public.messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND auth.uid() IN (c.participant_a, c.participant_b)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND auth.uid() IN (c.participant_a, c.participant_b)));

-- ============ AVIS ============
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  target_user_id uuid,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  rating integer NOT NULL DEFAULT 5,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Avis visibles" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Ecrire un avis" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Modifier mon avis" ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Supprimer mon avis" ON public.reviews FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.has_role(auth.uid(),'admin'));

-- ============ VUES ============
CREATE TABLE public.property_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  viewer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_views TO authenticated;
GRANT ALL ON public.property_views TO service_role;
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Voir stats de mes annonces" ON public.property_views FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.owner_id = auth.uid() OR p.agent_id = auth.uid())) OR public.has_role(auth.uid(),'admin'));
CREATE INDEX property_views_prop_idx ON public.property_views(property_id, created_at);

-- ============ PARAMETRES ============
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parametres visibles" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admin gere parametres" ON public.settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ AJUSTEMENT RLS PROPERTIES (agent) ============
DROP POLICY IF EXISTS "Proprietaire voit ses annonces" ON public.properties;
CREATE POLICY "Proprietaire voit ses annonces" ON public.properties FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = agent_id OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Proprietaire modifie ses annonces" ON public.properties;
CREATE POLICY "Proprietaire modifie ses annonces" ON public.properties FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = agent_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = agent_id OR public.has_role(auth.uid(),'admin'));

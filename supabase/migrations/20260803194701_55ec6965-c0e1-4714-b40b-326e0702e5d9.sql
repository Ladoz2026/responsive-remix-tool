CREATE TABLE public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  transaction public.transaction_type,
  property_type public.property_type,
  city text,
  district text,
  min_price numeric,
  max_price numeric,
  min_surface integer,
  min_bedrooms integer,
  requires_pool boolean NOT NULL DEFAULT false,
  requires_garage boolean NOT NULL DEFAULT false,
  requires_furnished boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  last_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_searches TO authenticated;
GRANT ALL ON public.saved_searches TO service_role;

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own searches"
ON public.saved_searches FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE TRIGGER saved_searches_updated_at
BEFORE UPDATE ON public.saved_searches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX saved_searches_active_idx ON public.saved_searches(is_active);

CREATE OR REPLACE FUNCTION public.notify_matching_searches()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'publie' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'publie') THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    SELECT s.user_id,
           'alerte',
           'Nouveau bien correspondant à « ' || s.name || ' »',
           NEW.title || ' — ' || NEW.city,
           '/bien/' || NEW.id
    FROM public.saved_searches s
    WHERE s.is_active
      AND s.user_id <> NEW.owner_id
      AND (s.transaction IS NULL OR s.transaction = NEW.transaction)
      AND (s.property_type IS NULL OR s.property_type = NEW.property_type)
      AND (s.city IS NULL OR lower(s.city) = lower(NEW.city))
      AND (s.district IS NULL OR lower(s.district) = lower(COALESCE(NEW.district, '')))
      AND (s.min_price IS NULL OR NEW.price >= s.min_price)
      AND (s.max_price IS NULL OR NEW.price <= s.max_price)
      AND (s.min_surface IS NULL OR COALESCE(NEW.surface_m2, 0) >= s.min_surface)
      AND (s.min_bedrooms IS NULL OR NEW.bedrooms >= s.min_bedrooms)
      AND (NOT s.requires_pool OR NEW.has_pool)
      AND (NOT s.requires_garage OR NEW.has_garage)
      AND (NOT s.requires_furnished OR NEW.is_furnished);

    UPDATE public.saved_searches s
    SET last_notified_at = now()
    WHERE s.is_active
      AND s.user_id <> NEW.owner_id
      AND (s.transaction IS NULL OR s.transaction = NEW.transaction)
      AND (s.property_type IS NULL OR s.property_type = NEW.property_type)
      AND (s.city IS NULL OR lower(s.city) = lower(NEW.city))
      AND (s.max_price IS NULL OR NEW.price <= s.max_price);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_matching_searches() FROM anon, authenticated, public;

CREATE TRIGGER properties_notify_matches
AFTER INSERT OR UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.notify_matching_searches();
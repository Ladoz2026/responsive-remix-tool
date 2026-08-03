-- ROLES
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'proprietaire';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'visiteur';

-- LISTING STATUS
ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'attente_paiement';
ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'refuse';
ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'expire';

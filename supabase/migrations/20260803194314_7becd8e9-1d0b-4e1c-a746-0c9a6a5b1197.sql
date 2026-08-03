CREATE TYPE public.lead_priority AS ENUM ('basse', 'normale', 'haute');

ALTER TABLE public.contact_requests
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS priority public.lead_priority NOT NULL DEFAULT 'normale',
  ADD COLUMN IF NOT EXISTS follow_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;

CREATE TABLE public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.contact_requests(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_notes TO authenticated;
GRANT ALL ON public.lead_notes TO service_role;

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_manage_lead(_request_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contact_requests cr
    LEFT JOIN public.properties p ON p.id = cr.property_id
    WHERE cr.id = _request_id
      AND (p.owner_id = _user_id OR p.agent_id = _user_id OR cr.assigned_to = _user_id
           OR public.has_role(_user_id, 'admin'))
  );
$$;

CREATE POLICY "Lead managers can view notes"
ON public.lead_notes FOR SELECT TO authenticated
USING (public.can_manage_lead(request_id, auth.uid()));

CREATE POLICY "Lead managers can add notes"
ON public.lead_notes FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid() AND public.can_manage_lead(request_id, auth.uid()));

CREATE POLICY "Authors can update their notes"
ON public.lead_notes FOR UPDATE TO authenticated
USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors and admins can delete notes"
ON public.lead_notes FOR DELETE TO authenticated
USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER lead_notes_updated_at
BEFORE UPDATE ON public.lead_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS lead_notes_request_idx ON public.lead_notes(request_id, created_at DESC);
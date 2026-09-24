DROP POLICY IF EXISTS "Profils visibles publiquement" ON public.profiles;
CREATE POLICY "Voir son profil ou admin" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Tout le monde peut envoyer une demande" ON public.contact_requests;
CREATE POLICY "Tout le monde peut envoyer une demande" ON public.contact_requests FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'nouveau' AND assigned_to IS NULL
    AND length(btrim(full_name)) BETWEEN 1 AND 120
    AND length(email) BETWEEN 3 AND 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (phone IS NULL OR length(phone) <= 40)
    AND length(btrim(message)) BETWEEN 1 AND 3000
  );

DROP POLICY IF EXISTS "Avis visibles" ON public.reviews;
CREATE POLICY "Avis visibles" ON public.reviews FOR SELECT
  USING (
    auth.uid() = author_id
    OR auth.uid() = target_user_id
    OR public.has_role(auth.uid(), 'admin')
    OR (property_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id = reviews.property_id AND p.status = 'publie'))
  );

DROP POLICY IF EXISTS "Parametres visibles" ON public.settings;
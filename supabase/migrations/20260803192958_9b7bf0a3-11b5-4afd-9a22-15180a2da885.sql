-- 1. Notification on new message
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient uuid;
BEGIN
  SELECT CASE WHEN c.participant_a = NEW.sender_id THEN c.participant_b ELSE c.participant_a END
    INTO recipient
  FROM public.conversations c WHERE c.id = NEW.conversation_id;

  IF recipient IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (recipient, 'message', 'Nouveau message', left(NEW.body, 140), '/messages');
  END IF;

  UPDATE public.conversations SET last_message_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_notify ON public.messages;
CREATE TRIGGER messages_notify
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- 2. Notification on property status change
CREATE OR REPLACE FUNCTION public.notify_property_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('publie', 'refuse', 'expire', 'archive') THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.owner_id,
      'annonce',
      CASE NEW.status
        WHEN 'publie' THEN 'Annonce publiée'
        WHEN 'refuse' THEN 'Annonce refusée'
        WHEN 'expire' THEN 'Annonce expirée'
        ELSE 'Annonce archivée'
      END,
      NEW.title || COALESCE(' — ' || NEW.rejection_reason, ''),
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_notify_status ON public.properties;
CREATE TRIGGER properties_notify_status
AFTER UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.notify_property_status();

-- 3. Notification on new review + one review per author/property
CREATE UNIQUE INDEX IF NOT EXISTS reviews_author_property_unique
  ON public.reviews (author_id, property_id) WHERE property_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.notify_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid;
BEGIN
  IF NEW.property_id IS NOT NULL THEN
    SELECT owner_id INTO target FROM public.properties WHERE id = NEW.property_id;
  ELSE
    target := NEW.target_user_id;
  END IF;

  IF target IS NOT NULL AND target <> NEW.author_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (target, 'avis', 'Nouvel avis reçu', COALESCE(left(NEW.comment, 140), NEW.rating || '/5'),
            CASE WHEN NEW.property_id IS NOT NULL THEN '/bien/' || NEW.property_id ELSE '/dashboard' END);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_notify ON public.reviews;
CREATE TRIGGER reviews_notify
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.notify_new_review();

-- 4. Realtime for messages and notifications
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
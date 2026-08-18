CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  source text NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'ios')),
  locale text,
  app_version text,
  user_agent text,
  netlify_forwarded boolean NOT NULL DEFAULT false,
  handled_at timestamptz,
  handled_note text
);

CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
  ON public.contact_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS contact_messages_user_id_idx
  ON public.contact_messages (user_id);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY contact_messages_select_admin ON public.contact_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin IS TRUE
    )
  );

REVOKE ALL ON public.contact_messages FROM anon, authenticated;
GRANT SELECT ON public.contact_messages TO authenticated;

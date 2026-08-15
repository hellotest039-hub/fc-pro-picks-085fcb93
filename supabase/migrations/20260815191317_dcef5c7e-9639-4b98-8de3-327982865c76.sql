ALTER TABLE public.analyses DROP CONSTRAINT IF EXISTS analyses_user_id_fkey;
ALTER TABLE public.analyses ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS actual_ht_home_goals integer,
  ADD COLUMN IF NOT EXISTS actual_ht_away_goals integer,
  ADD COLUMN IF NOT EXISTS actual_home_goals integer,
  ADD COLUMN IF NOT EXISTS actual_away_goals integer,
  ADD COLUMN IF NOT EXISTS result_notes text,
  ADD COLUMN IF NOT EXISTS result_recorded_at timestamp with time zone;
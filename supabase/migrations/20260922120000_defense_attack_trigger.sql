-- Defense mode: per-stage attack trigger (note = slash on each correct pitch, measure = slash on chord complete).
ALTER TABLE defense_stages
  ADD COLUMN attack_trigger text NOT NULL DEFAULT 'note'
    CHECK (attack_trigger IN ('note', 'measure'));

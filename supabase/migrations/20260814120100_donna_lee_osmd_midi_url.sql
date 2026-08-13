-- Donna Lee OSMD: 精密モードと同じ MIDI URL を付与し正本時刻を共有
BEGIN;

UPDATE public.ear_training_phrases
SET midi_url = 'https://jazzify-cdn.com/sozai/Comping/Donna_Lee_Comping.mid'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-osmd-ph0');

COMMIT;

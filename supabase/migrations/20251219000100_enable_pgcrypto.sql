-- Enable pgcrypto (idempotent)
-- Required for gen_random_uuid() used across migrations.

create extension if not exists pgcrypto;

-- Repairs semantic automation search.
--
-- The existing search_automations() selects automations.price_per_run, a column
-- that no longer exists — it became token_cost. Every call therefore fails with
-- 42703, and lib/ai/handlers/search.js swallows the error and returns nothing,
-- so the assistant silently falls back to keyword scoring. Asking for "an
-- automation that replies to my emails" matched "Brand Deal Email Generator" on
-- the word "email" while the actual Gmail auto-responder was never considered.
--
-- Run once in the Supabase SQL editor.

create or replace function public.search_automations(
  query_embedding vector(1536),
  match_limit int default 5
)
returns table (
  id uuid,
  name text,
  description text,
  author_email text,
  required_connectors text,
  required_inputs jsonb,
  requires_background boolean,
  token_cost int,
  total_runs int,
  activepieces_trigger_type text,
  similarity float
)
language sql
stable
as $$
  select
    a.id,
    a.name,
    a.description,
    a.author_email,
    a.required_connectors,
    a.required_inputs,
    a.requires_background,
    a.token_cost,
    a.total_runs,
    a.activepieces_trigger_type,
    -- pgvector's <=> is cosine distance, so 1 - distance is similarity. The
    -- caller compares against a 0.45 threshold and expects higher to be better.
    1 - (a.embedding <=> query_embedding) as similarity
  from public.automations a
  where a.embedding is not null
    and a.is_active = true          -- never surface something awaiting review
  order by a.embedding <=> query_embedding
  limit match_limit;
$$;

-- Repairs semantic automation search.
--
-- The live function selects automations.price_per_run, a column that became
-- token_cost. Every call fails with 42703 and lib/ai/handlers/search.js
-- swallows the error, so the assistant silently falls back to keyword scoring
-- and the semantic path has never returned a row.
--
-- price_per_run is in the function's declared return type, not only its body,
-- so `create or replace` alone raises "cannot change return type of existing
-- function". It has to be dropped first — hence the drop below, which is safe:
-- a function holds no data.
--
-- The old signature also omitted token_cost and author_email, both of which
-- the result renderer reads. Semantic hits would have shown a blank price and
-- no author even once the crash was fixed. Returning them here means keyword
-- and semantic results carry the same fields, so the UI cannot tell which path
-- produced a row.
--
-- Run once in the Supabase SQL editor.

drop function if exists public.search_automations(vector, int);

create function public.search_automations(
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
  token_cost int,
  total_runs int,
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
    a.token_cost,
    a.total_runs,
    -- pgvector's <=> is cosine distance, so 1 - distance is similarity. The
    -- caller compares against a 0.45 threshold and treats higher as better.
    1 - (a.embedding <=> query_embedding) as similarity
  from public.automations a
  where a.embedding is not null
    and a.is_active = true          -- never surface something awaiting review
  order by a.embedding <=> query_embedding
  limit match_limit;
$$;

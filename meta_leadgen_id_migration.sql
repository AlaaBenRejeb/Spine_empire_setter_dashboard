alter table public.leads
add column if not exists meta_leadgen_id text;

create unique index if not exists leads_meta_leadgen_id_idx
on public.leads (meta_leadgen_id)
where meta_leadgen_id is not null;

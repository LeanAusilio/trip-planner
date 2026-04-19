-- Run once in Supabase Dashboard → SQL Editor → New query

create table collab_trips (
  id          uuid        default gen_random_uuid() primary key,
  code        text        not null unique,
  data        jsonb       not null default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table collab_trips enable row level security;

create policy "public read"   on collab_trips for select using (true);
create policy "public insert" on collab_trips for insert with check (true);
create policy "public update" on collab_trips for update using (true);

-- Enable Realtime
alter publication supabase_realtime add table collab_trips;

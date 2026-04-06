-- ============================================================
-- MIGRATION 2: Shared Shopping Lists Refactor
-- Replace shared_shopping_list_* tables with shopping_lists +
-- shopping_list_members, and migrate shopping_list_items from
-- user_id to list_id.
-- ============================================================

-- 1. Drop old shared shopping list tables (data not migrated)
drop table if exists shared_shopping_list_items cascade;
drop table if exists shared_shopping_list_members cascade;
drop table if exists shared_shopping_lists cascade;

-- 2. Create new shopping_lists table
create table if not exists shopping_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id text not null,
  invite_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz default now()
);

-- 3. Create shopping_list_members table
create table if not exists shopping_list_members (
  list_id uuid not null references shopping_lists(id) on delete cascade,
  user_id text not null,
  joined_at timestamptz default now(),
  primary key (list_id, user_id)
);

-- 4. Modify shopping_list_items: replace user_id with list_id + added_by
alter table shopping_list_items
  add column if not exists list_id uuid references shopping_lists(id) on delete cascade,
  add column if not exists added_by text;

-- 5. Drop old items (user_id-based items have no list to belong to)
delete from shopping_list_items;

-- 6. Make list_id and added_by non-nullable now that the table is empty
alter table shopping_list_items
  alter column list_id set not null,
  alter column added_by set not null;

-- 7. Drop old user_id column and its policy
drop policy if exists "Users can manage own shopping list" on shopping_list_items;
alter table shopping_list_items drop column if exists user_id;

-- 8. Enable RLS on new tables
alter table shopping_lists enable row level security;
alter table shopping_list_members enable row level security;

-- 9. RLS policies for new tables
create policy "Members can read shopping list"
  on shopping_lists for select
  using (owner_id = requesting_user_id() or exists (
    select 1 from shopping_list_members m where m.list_id = id and m.user_id = requesting_user_id()
  ));

create policy "Members can read shopping list items"
  on shopping_list_items for select
  using (exists (
    select 1 from shopping_list_members m where m.list_id = list_id and m.user_id = requesting_user_id()
  ));

create policy "Members can write shopping list items"
  on shopping_list_items for all
  using (exists (
    select 1 from shopping_list_members m where m.list_id = list_id and m.user_id = requesting_user_id()
  ));

-- 10. Allow anon role to SELECT items so Supabase Realtime can deliver events
--     to browser clients (which use the anon key). Data security is enforced at
--     the API layer via the service role key. list_id is a UUID so it is not
--     guessable by arbitrary subscribers.
create policy "Anon can select shopping list items for realtime"
  on shopping_list_items for select
  to anon
  using (true);

-- 11. REPLICA IDENTITY FULL so DELETE events include the full row (needed to
--     get the id and remove the correct item from client state)
alter table shopping_list_items replica identity full;

begin;
-- remove the supabase_realtime publication
drop
  publication if exists supabase_realtime;
-- re-create the supabase_realtime publication with no tables
create publication supabase_realtime;
commit;

-- 12. Add table to the Supabase Realtime publication
alter publication supabase_realtime add table shopping_list_items;

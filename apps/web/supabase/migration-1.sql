-- ============================================================
-- MIGRATION: Privacy, Collections, Shared Shopping Lists
-- ============================================================

-- 1. Recipe privacy flag (default false = public)
alter table recipes add column if not exists is_private boolean not null default false;

-- Update recipe select policy to allow public recipes
drop policy if exists "Users can read own recipes" on recipes;
create policy "Users can read own recipes" on recipes for select
  using (user_id = requesting_user_id() or is_private = false);

-- 2. Collections
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists collection_recipes (
  collection_id uuid not null references collections(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  added_at timestamptz default now(),
  primary key (collection_id, recipe_id)
);

alter table collections enable row level security;
alter table collection_recipes enable row level security;

create policy "Users manage own collections" on collections for all
  using (user_id = requesting_user_id());
create policy "Users manage own collection recipes" on collection_recipes for all
  using (exists (select 1 from collections where id = collection_recipes.collection_id and user_id = requesting_user_id()));

-- 3. Shared shopping lists
create table if not exists shared_shopping_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id text not null,
  invite_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz default now()
);

create table if not exists shared_shopping_list_members (
  list_id uuid not null references shared_shopping_lists(id) on delete cascade,
  user_id text not null,
  joined_at timestamptz default now(),
  primary key (list_id, user_id)
);

create table if not exists shared_shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references shared_shopping_lists(id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text,
  checked boolean not null default false,
  added_by text not null,
  created_at timestamptz default now()
);

alter table shared_shopping_lists enable row level security;
alter table shared_shopping_list_members enable row level security;
alter table shared_shopping_list_items enable row level security;

create policy "Members can read shared list" on shared_shopping_lists for select
  using (owner_id = requesting_user_id() or exists (
    select 1 from shared_shopping_list_members m where m.list_id = id and m.user_id = requesting_user_id()
  ));
create policy "Members can read shared list items" on shared_shopping_list_items for select
  using (exists (
    select 1 from shared_shopping_list_members m where m.list_id = list_id and m.user_id = requesting_user_id()
  ));
create policy "Members can write shared list items" on shared_shopping_list_items for all
  using (exists (
    select 1 from shared_shopping_list_members m where m.list_id = list_id and m.user_id = requesting_user_id()
  ));
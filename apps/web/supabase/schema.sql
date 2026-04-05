-- Recipe App Schema
-- Run this in the Supabase SQL editor

-- Helper function: get Clerk user ID from JWT
-- NOTE: The app uses service role key for all DB access (bypasses RLS).
-- This function exists for direct Supabase access / future Clerk JWT template setup.
create or replace function requesting_user_id() returns text as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ language sql stable;

-- Recipes
create table recipes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  description text,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  time_minutes int,
  created_at timestamptz default now()
);

-- Recipe Ingredients
create table recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text,
  sort_order int not null default 0
);

-- Recipe Instructions
create table recipe_instructions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  step_number int not null,
  content text not null
);

-- Tags
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- Seed common tags
insert into tags (name) values
  ('vegan'),
  ('vegetarian'),
  ('lactose-free'),
  ('gluten-free'),
  ('dairy-free'),
  ('nut-free'),
  ('quick'),
  ('meal-prep');

-- Recipe Tags (join table)
create table recipe_tags (
  recipe_id uuid not null references recipes(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (recipe_id, tag_id)
);

-- Shopping List Items
create table shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  quantity numeric,
  unit text,
  checked boolean not null default false,
  created_at timestamptz default now()
);

-- Row Level Security
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;
alter table recipe_instructions enable row level security;
alter table recipe_tags enable row level security;
alter table shopping_list_items enable row level security;
alter table tags enable row level security;

-- Tags are readable by everyone (authenticated)
create policy "Tags are readable by authenticated users"
  on tags for select
  to authenticated
  using (true);

-- Recipes: users own their own recipes
create policy "Users can read own recipes"
  on recipes for select using (user_id = requesting_user_id());

create policy "Users can insert own recipes"
  on recipes for insert with check (user_id = requesting_user_id());

create policy "Users can update own recipes"
  on recipes for update using (user_id = requesting_user_id());

create policy "Users can delete own recipes"
  on recipes for delete using (user_id = requesting_user_id());

-- Recipe ingredients: accessible via recipe ownership
create policy "Users can manage own recipe ingredients"
  on recipe_ingredients for all
  using (exists (
    select 1 from recipes where recipes.id = recipe_ingredients.recipe_id
    and recipes.user_id = requesting_user_id()
  ));

-- Recipe instructions: accessible via recipe ownership
create policy "Users can manage own recipe instructions"
  on recipe_instructions for all
  using (exists (
    select 1 from recipes where recipes.id = recipe_instructions.recipe_id
    and recipes.user_id = requesting_user_id()
  ));

-- Recipe tags: accessible via recipe ownership
create policy "Users can manage own recipe tags"
  on recipe_tags for all
  using (exists (
    select 1 from recipes where recipes.id = recipe_tags.recipe_id
    and recipes.user_id = requesting_user_id()
  ));

-- Shopping list: users own their own items
create policy "Users can manage own shopping list"
  on shopping_list_items for all
  using (user_id = requesting_user_id());

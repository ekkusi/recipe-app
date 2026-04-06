-- MIGRATION 3: Fractional quantities + ingredient section headers

-- 1. Change quantity columns from numeric to text to allow fractions like "1/2"
ALTER TABLE recipe_ingredients
  ALTER COLUMN quantity TYPE text USING quantity::text;

ALTER TABLE shopping_list_items
  ALTER COLUMN quantity TYPE text USING quantity::text;

-- 2. Add is_section_header flag to support ingredient group subtitles
ALTER TABLE recipe_ingredients
  ADD COLUMN is_section_header boolean NOT NULL DEFAULT false;

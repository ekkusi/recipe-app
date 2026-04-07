-- Add sort_order column to shopping_list_items for drag-to-reorder support
ALTER TABLE shopping_list_items
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Initialize existing items with sequential order per list (oldest first = lowest index)
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY list_id ORDER BY created_at ASC) - 1 AS rn
  FROM shopping_list_items
)
UPDATE shopping_list_items
SET sort_order = ranked.rn
FROM ranked
WHERE shopping_list_items.id = ranked.id;

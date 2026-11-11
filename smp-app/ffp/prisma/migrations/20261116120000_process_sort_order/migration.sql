-- The library's "My order": a saved place for a process among its siblings. Additive: one nullable column; empty for every process until one is moved.
ALTER TABLE "processes" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER;

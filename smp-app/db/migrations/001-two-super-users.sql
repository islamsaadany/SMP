-- §313.26 (Islam: "a project might have 2 super users"): the one-super-per-
-- tenant index is gone, as it went on the frozen product. Giving somebody the
-- seat gives it to them and takes nothing from anybody. schema.sql no longer
-- creates it; this removes it from a database that already has it.
DROP INDEX IF EXISTS tenant_users_one_super;

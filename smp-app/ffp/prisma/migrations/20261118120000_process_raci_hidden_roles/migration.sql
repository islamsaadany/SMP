-- Additive: the titles removed from a process's RACI table.
ALTER TABLE "processes" ADD COLUMN "raciHiddenRoleIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add the team role without altering or recreating any existing data.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'psychologist';

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "assigned_psychologist_id" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "assigned_by_admin_id" TEXT;

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_assigned_psychologist_id_fkey"
  FOREIGN KEY ("assigned_psychologist_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_assigned_by_admin_id_fkey"
  FOREIGN KEY ("assigned_by_admin_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "appointments_assigned_psychologist_id_idx"
  ON "appointments"("assigned_psychologist_id");

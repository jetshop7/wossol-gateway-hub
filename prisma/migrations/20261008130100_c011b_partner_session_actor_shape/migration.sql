-- The PARTNER enum value is committed by the preceding migration before this
-- constraint references it.
ALTER TABLE "export_auth_sessions"
  DROP CONSTRAINT "export_auth_sessions_actor_shape_check";

ALTER TABLE "export_auth_sessions"
  ADD CONSTRAINT "export_auth_sessions_actor_shape_check" CHECK (
    ("actor_type" = 'INTERNAL' AND "internal_user_id" IS NOT NULL AND "client_user_id" IS NULL AND "client_account_id" IS NULL AND "partner_user_id" IS NULL AND "partner_account_id" IS NULL)
    OR
    ("actor_type" = 'CLIENT' AND "internal_user_id" IS NULL AND "client_user_id" IS NOT NULL AND "client_account_id" IS NOT NULL AND "partner_user_id" IS NULL AND "partner_account_id" IS NULL)
    OR
    ("actor_type" = 'PARTNER' AND "internal_user_id" IS NULL AND "client_user_id" IS NULL AND "client_account_id" IS NULL AND "partner_user_id" IS NOT NULL AND "partner_account_id" IS NOT NULL)
  );

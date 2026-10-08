-- C-011B: distinct Partner identity, linked to the existing Wossol-managed
-- ClientAccount configuration for Price Profiles and Catalog Access.
CREATE TYPE "ClientAccountType" AS ENUM ('DIRECT_CLIENT', 'PARTNER');
ALTER TYPE "AuthActorType" ADD VALUE 'PARTNER';

ALTER TABLE "export_client_accounts"
  ADD COLUMN "account_type" "ClientAccountType" NOT NULL DEFAULT 'DIRECT_CLIENT';

CREATE TABLE "export_partner_accounts" (
  "id" UUID NOT NULL,
  "catalog_account_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "export_partner_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "export_partner_accounts_catalog_account_id_key"
  ON "export_partner_accounts"("catalog_account_id");

CREATE TABLE "export_partner_users" (
  "id" UUID NOT NULL,
  "partner_account_id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "status" "ClientUserStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "export_partner_users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "export_partner_users_email_key" ON "export_partner_users"("email");
CREATE INDEX "export_partner_users_partner_account_id_status_idx"
  ON "export_partner_users"("partner_account_id", "status");

ALTER TABLE "export_auth_sessions"
  ADD COLUMN "partner_user_id" UUID,
  ADD COLUMN "partner_account_id" UUID;
ALTER TABLE "export_auth_audit_events"
  ADD COLUMN "partner_user_id" UUID,
  ADD COLUMN "partner_account_id" UUID;

CREATE INDEX "export_auth_sessions_partner_account_id_revoked_at_expires__idx"
  ON "export_auth_sessions"("partner_account_id", "revoked_at", "expires_at");
CREATE INDEX "export_auth_sessions_partner_user_id_revoked_at_expires_at_idx"
  ON "export_auth_sessions"("partner_user_id", "revoked_at", "expires_at");
CREATE INDEX "export_auth_audit_events_partner_account_id_created_at_idx"
  ON "export_auth_audit_events"("partner_account_id", "created_at");
CREATE INDEX "export_auth_audit_events_partner_user_id_created_at_idx"
  ON "export_auth_audit_events"("partner_user_id", "created_at");

ALTER TABLE "export_partner_accounts"
  ADD CONSTRAINT "export_partner_accounts_catalog_account_id_fkey"
  FOREIGN KEY ("catalog_account_id") REFERENCES "export_client_accounts"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "export_partner_users"
  ADD CONSTRAINT "export_partner_users_partner_account_id_fkey"
  FOREIGN KEY ("partner_account_id") REFERENCES "export_partner_accounts"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "export_auth_sessions"
  ADD CONSTRAINT "export_auth_sessions_partner_user_id_fkey"
  FOREIGN KEY ("partner_user_id") REFERENCES "export_partner_users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "export_auth_sessions_partner_account_id_fkey"
  FOREIGN KEY ("partner_account_id") REFERENCES "export_partner_accounts"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "export_auth_audit_events"
  ADD CONSTRAINT "export_auth_audit_events_partner_user_id_fkey"
  FOREIGN KEY ("partner_user_id") REFERENCES "export_partner_users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "export_auth_audit_events_partner_account_id_fkey"
  FOREIGN KEY ("partner_account_id") REFERENCES "export_partner_accounts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Wossol Export-owned authentication, sessions, authorization, audit, and rate-limit foundation.
CREATE TYPE "InternalUserStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "InternalCatalogRole" AS ENUM ('CATALOG_ADMIN', 'CATALOG_EDITOR');
CREATE TYPE "ClientAccountStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "ClientUserStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "AuthActorType" AS ENUM ('INTERNAL', 'CLIENT');

CREATE TABLE "export_internal_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "InternalCatalogRole" NOT NULL DEFAULT 'CATALOG_EDITOR',
    "status" "InternalUserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "export_internal_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "export_client_accounts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ClientAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "export_client_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "export_client_users" (
    "id" UUID NOT NULL,
    "client_account_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" "ClientUserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "export_client_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "export_auth_sessions" (
    "id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "actor_type" "AuthActorType" NOT NULL,
    "internal_user_id" UUID,
    "client_user_id" UUID,
    "client_account_id" UUID,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "export_auth_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "export_auth_audit_events" (
    "id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "actor_type" "AuthActorType",
    "internal_user_id" UUID,
    "client_user_id" UUID,
    "client_account_id" UUID,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "ip_address" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "export_auth_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "export_auth_rate_limits" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMP(3) NOT NULL,
    "blocked_until" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "export_auth_rate_limits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "export_internal_users_email_key" ON "export_internal_users"("email");
CREATE UNIQUE INDEX "export_client_users_email_key" ON "export_client_users"("email");
CREATE UNIQUE INDEX "export_auth_sessions_token_hash_key" ON "export_auth_sessions"("token_hash");
CREATE INDEX "export_auth_sessions_internal_user_id_revoked_at_expires_at_idx" ON "export_auth_sessions"("internal_user_id", "revoked_at", "expires_at");
CREATE INDEX "export_auth_sessions_client_user_id_revoked_at_expires_at_idx" ON "export_auth_sessions"("client_user_id", "revoked_at", "expires_at");
CREATE INDEX "export_auth_sessions_expires_at_idx" ON "export_auth_sessions"("expires_at");
CREATE INDEX "export_auth_audit_events_action_created_at_idx" ON "export_auth_audit_events"("action", "created_at");
CREATE INDEX "export_auth_audit_events_internal_user_id_created_at_idx" ON "export_auth_audit_events"("internal_user_id", "created_at");
CREATE INDEX "export_auth_audit_events_client_user_id_created_at_idx" ON "export_auth_audit_events"("client_user_id", "created_at");
CREATE UNIQUE INDEX "export_auth_rate_limits_key_key" ON "export_auth_rate_limits"("key");
CREATE INDEX "export_auth_rate_limits_blocked_until_idx" ON "export_auth_rate_limits"("blocked_until");

ALTER TABLE "export_client_users" ADD CONSTRAINT "export_client_users_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "export_client_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "export_auth_sessions" ADD CONSTRAINT "export_auth_sessions_internal_user_id_fkey" FOREIGN KEY ("internal_user_id") REFERENCES "export_internal_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "export_auth_sessions" ADD CONSTRAINT "export_auth_sessions_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "export_client_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "export_auth_sessions" ADD CONSTRAINT "export_auth_sessions_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "export_client_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "export_auth_audit_events" ADD CONSTRAINT "export_auth_audit_events_internal_user_id_fkey" FOREIGN KEY ("internal_user_id") REFERENCES "export_internal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "export_auth_audit_events" ADD CONSTRAINT "export_auth_audit_events_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "export_client_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "export_auth_audit_events" ADD CONSTRAINT "export_auth_audit_events_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "export_client_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "export_auth_sessions" ADD CONSTRAINT "export_auth_sessions_actor_shape_check" CHECK (
    ("actor_type" = 'INTERNAL' AND "internal_user_id" IS NOT NULL AND "client_user_id" IS NULL AND "client_account_id" IS NULL)
    OR
    ("actor_type" = 'CLIENT' AND "internal_user_id" IS NULL AND "client_user_id" IS NOT NULL AND "client_account_id" IS NOT NULL)
);

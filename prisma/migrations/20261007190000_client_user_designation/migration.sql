-- C-007B1: distinguish the account's initial primary admin from later users.
-- Existing users are preserved and safely classified as regular Client Users.
CREATE TYPE "ClientUserDesignation" AS ENUM ('PRIMARY_ADMIN', 'CLIENT_USER');

ALTER TABLE "export_client_users"
  ADD COLUMN "designation" "ClientUserDesignation" NOT NULL DEFAULT 'CLIENT_USER';

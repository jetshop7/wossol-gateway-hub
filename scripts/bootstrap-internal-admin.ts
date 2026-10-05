import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/server/auth/password.server.ts";

const email = process.env.WOSSOL_EXPORT_BOOTSTRAP_EMAIL?.trim().toLowerCase();
const password = process.env.WOSSOL_EXPORT_BOOTSTRAP_PASSWORD;
const displayName =
  process.env.WOSSOL_EXPORT_BOOTSTRAP_DISPLAY_NAME?.trim() || "Catalog Administrator";

if (process.env.WOSSOL_EXPORT_BOOTSTRAP_CONFIRM !== "CREATE") {
  throw new Error(
    "Set WOSSOL_EXPORT_BOOTSTRAP_CONFIRM=CREATE to explicitly create the first internal administrator.",
  );
}
if (!email || !password)
  throw new Error(
    "WOSSOL_EXPORT_BOOTSTRAP_EMAIL and WOSSOL_EXPORT_BOOTSTRAP_PASSWORD are required.",
  );

const prisma = new PrismaClient();
try {
  const existing = await prisma.internalUser.findUnique({ where: { email }, select: { id: true } });
  if (existing)
    throw new Error(
      "An internal user with this email already exists; bootstrap refuses duplicates.",
    );
  await prisma.internalUser.create({
    data: { email, displayName, passwordHash: await hashPassword(password), role: "CATALOG_ADMIN" },
  });
  console.log(`Created the initial internal administrator: ${email}`);
} finally {
  await prisma.$disconnect();
}

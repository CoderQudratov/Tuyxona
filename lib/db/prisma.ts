import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

let prismaClient: PrismaClient | null = null;

try {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost:5432/doston_tuyxona")) {
    if (!globalThis.__prismaClient) {
      globalThis.__prismaClient = new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      });
    }
    prismaClient = globalThis.__prismaClient;
  }
} catch (e) {
  console.warn("Prisma client initialization skipped or failed, fallback to demo mode:", e);
  prismaClient = null;
}

export const prisma = prismaClient;


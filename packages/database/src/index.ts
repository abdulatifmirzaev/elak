import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prismaClient ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prismaClient = prisma;
}

/**
 * Safely serialize data containing BigInt (e.g. telegramId, telegramMsgId) into JSON-compatible values.
 */
export function serializeBigInt<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) => (typeof value === "bigint" ? value.toString() : value)),
  );
}

export * from "@prisma/client";

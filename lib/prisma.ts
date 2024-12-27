import { PrismaClient } from "@prisma/client";

// Define a global type to store the PrismaClient instance
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

// Create and export the PrismaClient instance
export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

// Only do this in production
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

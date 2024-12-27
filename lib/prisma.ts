import { PrismaClient } from "@prisma/client";

// Define a global type to store the PrismaClient instance
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

// Create and export the PrismaClient instance
export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    log: ["query", "error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      },
    },
  })

// Only save the PrismaClient instance in development
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

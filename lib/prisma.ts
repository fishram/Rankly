import { PrismaClient } from "@prisma/client";

// Define a global type to store the PrismaClient instance
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

// Create and export the PrismaClient instance
export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      },
    },
  })

// Only save the PrismaClient instance in development
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Handle connection management for serverless
prisma.$connect().catch((err) => {
  console.error('Failed to connect to database:', err);
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

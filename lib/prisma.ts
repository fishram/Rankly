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

// Handle connection cleanup
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
} else {
  // In production, properly handle connection lifecycle
  prisma.$connect(); // Ensure initial connection
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;

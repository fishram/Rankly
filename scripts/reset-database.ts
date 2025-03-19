import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log("Connecting to the database...");
    await prisma.$connect();

    console.log("Starting database reset...");

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete in order respecting foreign key constraints
      // Start with child tables first

      console.log("Deleting PlayerSeasonStats records...");
      await tx.playerSeasonStats.deleteMany({});

      console.log("Deleting Matches...");
      await tx.match.deleteMany({});

      console.log("Deleting Players...");
      await tx.player.deleteMany({});

      console.log("Deleting Seasons...");
      await tx.season.deleteMany({});

      console.log("Deleting Settings...");
      await tx.settings.deleteMany({});

      console.log("Deleting Users...");
      await tx.user.deleteMany({});

      // Create default settings if needed
      await tx.settings.create({
        data: {
          kFactor: 50,
        },
      });

      // Create an initial season
      await tx.season.create({
        data: {
          name: "Season 1",
          startDate: new Date(),
          isActive: true,
        },
      });

      console.log("Created default settings and initial season");
    });

    console.log("Database reset completed successfully!");
  } catch (error) {
    console.error("Error resetting database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

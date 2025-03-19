import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log("Connecting to the database...");
    await prisma.$connect();

    // Get the first season
    const firstSeason = await prisma.season.findFirst({
      orderBy: {
        id: "asc",
      },
    });

    if (!firstSeason) {
      console.error(
        "No seasons found. Please run create-initial-season.ts first."
      );
      return;
    }

    console.log(`Using season: ${firstSeason.name} (ID: ${firstSeason.id})`);

    // Find matches without a seasonId - note this condition might change depending on how your database handles null values
    // Here, we're checking if seasonId is undefined, null, or 0 (if it was defaulted to 0)
    const matchesWithoutSeason = await prisma.$queryRaw`
      SELECT id FROM "Match" WHERE "seasonId" IS NULL OR "seasonId" = 0
    `;

    if (
      Array.isArray(matchesWithoutSeason) &&
      matchesWithoutSeason.length > 0
    ) {
      console.log(
        `Found ${matchesWithoutSeason.length} matches without a season. Updating...`
      );

      // Update all matches without a seasonId
      await prisma.$executeRaw`
        UPDATE "Match" SET "seasonId" = ${firstSeason.id}
        WHERE "seasonId" IS NULL OR "seasonId" = 0
      `;

      console.log("Matches updated successfully.");
    } else {
      console.log(
        "No matches found without a season ID. Everything is already updated."
      );
    }

    // Also add ELO change records for matches that don't have them
    const matchesWithoutEloChanges = await prisma.$queryRaw`
      SELECT id FROM "Match" WHERE "player1EloChange" IS NULL OR "player2EloChange" IS NULL
    `;

    if (
      Array.isArray(matchesWithoutEloChanges) &&
      matchesWithoutEloChanges.length > 0
    ) {
      console.log(
        `Found ${matchesWithoutEloChanges.length} matches without ELO change records. These would require historical ELO data to accurately update.`
      );
      console.log("Consider setting default values of 0 for these matches.");

      // Set default ELO changes to 0 for older matches
      await prisma.$executeRaw`
        UPDATE "Match" 
        SET "player1EloChange" = 0, "player2EloChange" = 0
        WHERE "player1EloChange" IS NULL OR "player2EloChange" IS NULL
      `;

      console.log("Match ELO changes updated with default values.");
    } else {
      console.log("All matches have ELO change records.");
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error updating matches:", error);
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

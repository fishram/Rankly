import { PrismaClient } from "@prisma/client";

interface CountResult {
  count: string | number;
}

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log("Connecting to the database...");
    await prisma.$connect();

    // Check if any seasons exist already
    const existingSeasons = await prisma.season.findMany();
    if (existingSeasons.length > 0) {
      console.log(
        `Found ${existingSeasons.length} existing seasons. Checking if migration is still needed...`
      );

      // Check if we need to continue with the migration
      const matchesWithoutSeason = await prisma.$queryRaw<CountResult[]>`
        SELECT COUNT(*) as count FROM "Match" WHERE "seasonId" IS NULL
      `;

      const count = Number(matchesWithoutSeason[0]?.count || 0);

      if (count === 0) {
        console.log(
          "All matches already have a season assigned. Migration not needed."
        );
        return;
      }

      console.log(
        `Found ${count} matches without a season. Continuing with migration...`
      );
    }

    // Create Season 1 if it doesn't exist
    let season1;
    if (existingSeasons.length === 0) {
      console.log("Creating Season 1...");

      // Set the start date to the date of the earliest match, or today if no matches exist
      const earliestMatch = await prisma.match.findFirst({
        orderBy: {
          date: "asc",
        },
      });

      const startDate = earliestMatch?.date || new Date();

      season1 = await prisma.season.create({
        data: {
          name: "Season 1",
          startDate,
          isActive: true,
        },
      });

      console.log(`Season 1 created with ID: ${season1.id}`);
    } else {
      // Use the first season if it already exists
      season1 = existingSeasons[0];
      console.log(`Using existing Season 1 with ID: ${season1.id}`);
    }

    // Update existing matches to be part of Season 1
    const matches = await prisma.match.findMany({
      where: {
        seasonId: undefined, // This will be interpreted as NULL in the query
      },
    });

    console.log(
      `Found ${matches.length} matches without a season. Assigning to Season 1...`
    );

    if (matches.length > 0) {
      // Update in batches for better performance
      const batchSize = 100;

      for (let i = 0; i < matches.length; i += batchSize) {
        const batch = matches.slice(i, i + batchSize);
        await prisma.$transaction(
          batch.map((match) =>
            prisma.match.update({
              where: { id: match.id },
              data: { seasonId: season1.id },
            })
          )
        );
        console.log(
          `Updated matches ${i + 1} to ${Math.min(
            i + batchSize,
            matches.length
          )}`
        );
      }

      console.log("All matches assigned to Season 1 successfully.");
    }

    // Get all players
    const players = await prisma.player.findMany();
    console.log(
      `Found ${players.length} players. Creating season stats for each...`
    );

    // Create PlayerSeasonStats for each player if they don't already have stats for Season 1
    for (const player of players) {
      // Check if player already has stats for Season 1
      const existingStats = await prisma.playerSeasonStats.findFirst({
        where: {
          playerId: player.id,
          seasonId: season1.id,
        },
      });

      if (!existingStats) {
        await prisma.playerSeasonStats.create({
          data: {
            playerId: player.id,
            seasonId: season1.id,
            initialElo: 1000, // Standard starting ELO
            highestElo: player.highestElo,
            wins: player.wins,
            losses: player.losses,
          },
        });
      }
    }

    console.log("Player season stats created successfully.");

    // Check for matches missing ELO change records
    const matchesWithoutEloChanges = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*) as count FROM "Match" 
      WHERE "player1EloChange" IS NULL OR "player2EloChange" IS NULL
    `;

    const eloChangesCount = Number(matchesWithoutEloChanges[0]?.count || 0);

    if (eloChangesCount > 0) {
      console.log(
        `Found ${eloChangesCount} matches without ELO change records.`
      );
      console.log(
        "Setting default values of 0 for ELO changes in these matches..."
      );

      await prisma.$executeRaw`
        UPDATE "Match" 
        SET "player1EloChange" = 0, "player2EloChange" = 0
        WHERE "player1EloChange" IS NULL OR "player2EloChange" IS NULL
      `;

      console.log("Match ELO changes updated with default values.");
    }

    console.log("Migration to seasons completed successfully!");
  } catch (error) {
    console.error(
      "Error during migration:",
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });

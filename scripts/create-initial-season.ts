import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log("Connecting to the database...");
    await prisma.$connect();

    // Check if a season already exists
    const existingSeasons = await prisma.season.findMany();
    if (existingSeasons.length > 0) {
      console.log(
        `Found ${existingSeasons.length} existing seasons. No need to create an initial season.`
      );
      return;
    }

    console.log("Creating initial season...");

    // Create the initial season
    const initialSeason = await prisma.season.create({
      data: {
        name: "Season 1",
        startDate: new Date(),
        isActive: true,
      },
    });

    console.log(`Initial season created with ID: ${initialSeason.id}`);

    // Get all active players
    const players = await prisma.player.findMany({
      where: { isActive: true },
    });

    console.log(
      `Found ${players.length} active players. Creating season stats for each...`
    );

    // Create player season stats for each player
    for (const player of players) {
      await prisma.playerSeasonStats.create({
        data: {
          playerId: player.id,
          seasonId: initialSeason.id,
          initialElo: player.eloScore,
          highestElo: player.highestElo,
          wins: player.wins,
          losses: player.losses,
        },
      });
    }

    console.log("Player season stats created successfully.");

    // Update all existing matches to be part of this season
    const matches = await prisma.match.findMany();
    console.log(
      `Found ${matches.length} existing matches. Assigning to the initial season...`
    );

    if (matches.length > 0) {
      await prisma.match.updateMany({
        data: {
          seasonId: initialSeason.id,
        },
      });

      console.log("All matches assigned to the initial season successfully.");
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error creating initial season:", error);
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

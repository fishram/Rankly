import { PrismaClient } from "@prisma/client";

interface CountResult {
  count: string | number;
}

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log("Connecting to the production database...");
    await prisma.$connect();

    // Verify that Season 1 exists
    const seasons = await prisma.season.findMany();
    console.log(`Found ${seasons.length} seasons in the database`);

    if (seasons.length === 0) {
      console.error("Migration failed: No seasons found!");
      return;
    }

    const season1 = seasons.find((s) => s.name === "Season 1");
    if (!season1) {
      console.error("Migration failed: Season 1 not found!");
      return;
    }

    console.log(`Season 1 found with ID: ${season1.id}`);

    // Check if any matches don't have a season
    const matchesWithoutSeason = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*) as count FROM "Match" WHERE "seasonId" IS NULL
    `;

    const count = Number(matchesWithoutSeason[0]?.count || 0);

    if (count > 0) {
      console.error(
        `Migration issue: Found ${count} matches without a season!`
      );
    } else {
      console.log("All matches have a season assigned ✓");
    }

    // Check if all players have season stats
    const players = await prisma.player.findMany();
    console.log(`Found ${players.length} players`);

    const playerSeasonStats = await prisma.playerSeasonStats.findMany({
      where: {
        seasonId: season1.id,
      },
    });

    console.log(
      `Found ${playerSeasonStats.length} player season stats records for Season 1`
    );

    if (playerSeasonStats.length < players.length) {
      console.error(
        `Migration issue: Not all players have season stats! (${playerSeasonStats.length}/${players.length})`
      );

      // Find which players are missing stats
      const playerIdsWithStats = playerSeasonStats.map(
        (stats) => stats.playerId
      );
      const playersWithoutStats = players.filter(
        (player) => !playerIdsWithStats.includes(player.id)
      );

      console.error("Players missing season stats:");
      playersWithoutStats.forEach((player) => {
        console.error(`- ${player.name} (ID: ${player.id})`);
      });
    } else {
      console.log("All players have season stats ✓");
    }

    // Check for matches missing ELO change records
    const matchesWithoutEloChanges = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*) as count FROM "Match" 
      WHERE "player1EloChange" IS NULL OR "player2EloChange" IS NULL
    `;

    const eloChangesCount = Number(matchesWithoutEloChanges[0]?.count || 0);

    if (eloChangesCount > 0) {
      console.error(
        `Migration issue: Found ${eloChangesCount} matches without ELO change records!`
      );
    } else {
      console.log("All matches have ELO change records ✓");
    }

    console.log("\n--- Verification Summary ---");
    if (
      seasons.length > 0 &&
      season1 &&
      count === 0 &&
      playerSeasonStats.length === players.length &&
      eloChangesCount === 0
    ) {
      console.log("✅ Migration appears to be successful!");
    } else {
      console.error("❌ Migration has issues that should be addressed!");
    }
  } catch (error) {
    console.error(
      "Error during verification:",
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

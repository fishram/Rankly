import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

async function main() {
  // Choose the backup directory to restore from
  const backupDir = path.join(
    process.cwd(),
    "backups",
    "pre_seasons_migration_2025-03-19T02-34-52.478Z" // Use the most recent backup
  );

  if (!fs.existsSync(backupDir)) {
    console.error(`Backup directory not found: ${backupDir}`);
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    console.log("Connecting to the database...");
    await prisma.$connect();

    // Step 1: Restore settings
    console.log("Restoring settings...");
    const settingsData = JSON.parse(
      fs.readFileSync(path.join(backupDir, "settings.json"), "utf8")
    );

    for (const setting of settingsData) {
      await prisma.settings.upsert({
        where: { id: setting.id },
        update: setting,
        create: setting,
      });
    }

    // Step 2: Restore users
    console.log("Restoring users...");
    const usersData = JSON.parse(
      fs.readFileSync(path.join(backupDir, "users.json"), "utf8")
    );

    for (const user of usersData) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      });
    }

    // Step 3: Restore players
    console.log("Restoring players...");
    const playersData = JSON.parse(
      fs.readFileSync(path.join(backupDir, "players.json"), "utf8")
    );

    for (const player of playersData) {
      await prisma.player.upsert({
        where: { id: player.id },
        update: player,
        create: player,
      });
    }

    // Step 4: Create a Season 1 if it doesn't exist
    console.log("Creating Season 1...");
    const season1 = await prisma.season.upsert({
      where: { name: "Season 1" },
      update: {},
      create: {
        name: "Season 1",
        startDate: new Date(),
        isActive: true,
      },
    });

    // Step 5: Create PlayerSeasonStats for each player
    console.log("Creating player season stats...");
    for (const player of playersData) {
      await prisma.playerSeasonStats.upsert({
        where: {
          playerId_seasonId: {
            playerId: player.id,
            seasonId: season1.id,
          },
        },
        update: {
          initialElo: player.eloScore,
          highestElo: player.highestElo,
          wins: player.wins,
          losses: player.losses,
        },
        create: {
          playerId: player.id,
          seasonId: season1.id,
          initialElo: player.eloScore,
          highestElo: player.highestElo,
          wins: player.wins,
          losses: player.losses,
        },
      });
    }

    // Step 6: Restore matches with the season association
    console.log("Restoring matches...");
    const matchesData = JSON.parse(
      fs.readFileSync(path.join(backupDir, "matches.json"), "utf8")
    );

    for (const match of matchesData) {
      // Convert any big integers to regular numbers
      const matchData = {
        ...match,
        id: Number(match.id),
        player1Id: Number(match.player1Id),
        player2Id: Number(match.player2Id),
        winnerId: match.winnerId ? Number(match.winnerId) : null,
        seasonId: season1.id, // Associate with Season 1
        player1EloChange: null, // Will calculate later if needed
        player2EloChange: null, // Will calculate later if needed
      };

      // Remove any fields that aren't in the schema
      delete matchData.season;

      await prisma.match.upsert({
        where: { id: matchData.id },
        update: matchData,
        create: matchData,
      });
    }

    console.log("Data restoration completed successfully!");
  } catch (error) {
    console.error(
      "Error during restoration:",
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

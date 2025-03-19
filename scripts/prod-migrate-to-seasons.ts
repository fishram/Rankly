import { PrismaClient } from "@prisma/client";

interface CountResult {
  count: string | number;
}

interface RawMatch {
  id: number;
  player1Id: number;
  player2Id: number;
  winnerId: number | null;
  date: Date;
  notes: string | null;
  player1EloChange: number | null;
  player2EloChange: number | null;
}

interface ColumnInfo {
  column_name: string;
}

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log("Connecting to the production database...");
    await prisma.$connect();

    // Step 1: Create Season 1
    console.log("Creating Season 1...");

    // Set the start date to the date of the earliest match, or today if no matches exist
    const rawEarliestMatch = await prisma.$queryRaw<{ date: Date }[]>`
      SELECT "date" FROM "Match" ORDER BY "date" ASC LIMIT 1
    `;

    const startDate =
      rawEarliestMatch.length > 0 ? rawEarliestMatch[0].date : new Date();

    // Check if Seasons table exists
    try {
      // Try to create the Season 1
      const season1 = await prisma.season.create({
        data: {
          name: "Season 1",
          startDate,
          isActive: true,
        },
      });

      console.log(`Season 1 created with ID: ${season1.id}`);

      // Step 2: Update existing matches to be part of Season 1
      const rawMatches = await prisma.$queryRaw<RawMatch[]>`
        SELECT * FROM "Match"
      `;
      console.log(
        `Found ${rawMatches.length} matches. Assigning to Season 1...`
      );

      if (rawMatches.length > 0) {
        // First, add the seasonId column if it doesn't exist
        try {
          await prisma.$executeRaw`
            ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "seasonId" INTEGER
          `;
          console.log("Added seasonId column to Match table");
        } catch (_) {
          console.log("seasonId column might already exist, continuing...");
        }

        // Set all matches to Season 1
        await prisma.$executeRaw`
          UPDATE "Match" SET "seasonId" = ${season1.id}
        `;
        console.log("All matches assigned to Season 1 successfully.");
      }

      // Step 3: Create PlayerSeasonStats for each player
      const players = await prisma.player.findMany();
      console.log(
        `Found ${players.length} players. Creating season stats for each...`
      );

      // Check if PlayerSeasonStats table exists
      try {
        for (const player of players) {
          await prisma.playerSeasonStats.create({
            data: {
              playerId: player.id,
              seasonId: season1.id,
              initialElo: 1000, // Standard starting ELO
              highestElo: player.highestElo,
              wins: player.wins,
              losses: player.losses,
              finalElo: player.eloScore, // Current ELO becomes the final ELO for season 1
            },
          });
        }
        console.log("Player season stats created successfully.");
      } catch (statsError) {
        console.error("Error creating player season stats:", statsError);
        console.log(
          "Attempting to create PlayerSeasonStats table if it doesn't exist..."
        );

        // Create the table if it doesn't exist
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "PlayerSeasonStats" (
            "id" SERIAL PRIMARY KEY,
            "playerId" INTEGER NOT NULL,
            "seasonId" INTEGER NOT NULL,
            "initialElo" INTEGER NOT NULL DEFAULT 1000,
            "finalElo" INTEGER,
            "highestElo" INTEGER NOT NULL DEFAULT 1000,
            "wins" INTEGER NOT NULL DEFAULT 0,
            "losses" INTEGER NOT NULL DEFAULT 0,
            UNIQUE("playerId", "seasonId"),
            FOREIGN KEY ("playerId") REFERENCES "Player"("id"),
            FOREIGN KEY ("seasonId") REFERENCES "Season"("id")
          )
        `;

        // Try again to create player stats
        for (const player of players) {
          await prisma.$executeRaw`
            INSERT INTO "PlayerSeasonStats" ("playerId", "seasonId", "initialElo", "highestElo", "wins", "losses", "finalElo")
            VALUES (${player.id}, ${season1.id}, 1000, ${player.highestElo}, ${player.wins}, ${player.losses}, ${player.eloScore})
          `;
        }
        console.log(
          "Player season stats created successfully (using raw SQL)."
        );
      }

      // Step 4: Check for matches missing ELO change records
      try {
        const eloColumns = await prisma.$queryRaw<ColumnInfo[]>`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name='Match' 
          AND (column_name='player1EloChange' OR column_name='player2EloChange')
        `;

        if (eloColumns.length === 2) {
          const matchesWithoutEloChanges = await prisma.$queryRaw<
            CountResult[]
          >`
            SELECT COUNT(*) as count FROM "Match" 
            WHERE "player1EloChange" IS NULL OR "player2EloChange" IS NULL
          `;

          const eloChangesCount = Number(
            matchesWithoutEloChanges[0]?.count || 0
          );

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
        } else {
          console.log("Adding ELO change columns if they don't exist...");

          await prisma.$executeRaw`
            ALTER TABLE "Match" 
            ADD COLUMN IF NOT EXISTS "player1EloChange" INTEGER,
            ADD COLUMN IF NOT EXISTS "player2EloChange" INTEGER
          `;

          await prisma.$executeRaw`
            UPDATE "Match" SET "player1EloChange" = 0, "player2EloChange" = 0
            WHERE "player1EloChange" IS NULL OR "player2EloChange" IS NULL
          `;

          console.log("ELO change columns added and set to default values.");
        }
      } catch (eloError) {
        console.error("Error handling ELO change records:", eloError);
      }

      console.log("Migration to seasons completed successfully!");
    } catch (seasonError) {
      console.error(
        "Error during Season creation, the Season table might not exist yet:",
        seasonError
      );
      console.log("Creating Season table and trying again...");

      try {
        // Create the Season table if it doesn't exist
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "Season" (
            "id" SERIAL PRIMARY KEY,
            "name" TEXT NOT NULL UNIQUE,
            "startDate" TIMESTAMP NOT NULL,
            "endDate" TIMESTAMP,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `;

        // Try again
        await prisma.$executeRaw`
          INSERT INTO "Season" ("name", "startDate", "isActive") 
          VALUES ('Season 1', ${startDate}, true)
          RETURNING id
        `;

        console.log("Season 1 created (using raw SQL)");
        console.log("Please run the script again to complete the migration.");
      } catch (finalError) {
        console.error("Failed to create Season table:", finalError);
      }
    }
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

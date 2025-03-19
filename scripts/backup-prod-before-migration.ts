import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const prisma = new PrismaClient();
  const backupDir = path.join(
    process.cwd(),
    "backups",
    `pre_seasons_migration_${new Date().toISOString().replace(/:/g, "-")}`
  );

  try {
    console.log("Connecting to the production database...");
    await prisma.$connect();

    // Create backup directory
    if (!fs.existsSync(path.join(process.cwd(), "backups"))) {
      fs.mkdirSync(path.join(process.cwd(), "backups"));
    }
    fs.mkdirSync(backupDir);

    console.log(`Creating backup in ${backupDir}`);

    // Backup players
    const players = await prisma.player.findMany();
    fs.writeFileSync(
      path.join(backupDir, "players.json"),
      JSON.stringify(players, null, 2)
    );
    console.log(`Backed up ${players.length} players`);

    // Backup matches using raw query to avoid schema mismatch
    const rawMatches = await prisma.$queryRaw`
      SELECT * FROM "Match"
    `;
    fs.writeFileSync(
      path.join(backupDir, "matches.json"),
      JSON.stringify(rawMatches, null, 2)
    );
    console.log(
      `Backed up ${Array.isArray(rawMatches) ? rawMatches.length : 0} matches`
    );

    // Backup users
    const users = await prisma.user.findMany();
    fs.writeFileSync(
      path.join(backupDir, "users.json"),
      JSON.stringify(users, null, 2)
    );
    console.log(`Backed up ${users.length} users`);

    // Backup settings
    const settings = await prisma.settings.findMany();
    fs.writeFileSync(
      path.join(backupDir, "settings.json"),
      JSON.stringify(settings, null, 2)
    );
    console.log(`Backed up ${settings.length} settings`);

    console.log("Backup completed successfully!");
    console.log(`All data saved to ${backupDir}`);
  } catch (error) {
    console.error(
      "Error during backup:",
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

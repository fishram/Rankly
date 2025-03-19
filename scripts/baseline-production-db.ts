import * as fs from "fs";
import * as path from "path";

async function main() {
  try {
    console.log("Starting production database baselining process...");

    // Step 1: Create a migrations directory if it doesn't exist
    const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    // Step 2: Create a baseline migration name with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:.]/g, "")
      .slice(0, 14);
    const migrationName = `${timestamp}_baseline`;
    const migrationDir = path.join(migrationsDir, migrationName);

    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir);
    }

    // Step 3: Create an empty migration.sql file
    const migrationSqlPath = path.join(migrationDir, "migration.sql");
    fs.writeFileSync(
      migrationSqlPath,
      "-- This is a baseline migration for an existing database\n"
    );

    console.log(`Created baseline migration: ${migrationName}`);

    // Step 4: Mark the migration as applied in the _prisma_migrations table
    console.log(
      "Now you need to run the following command to create the _prisma_migrations table:"
    );
    console.log("\nprisma migrate resolve --applied " + migrationName + "\n");

    console.log(
      "After running that command, you should be able to run prisma migrate deploy successfully."
    );
  } catch (error) {
    console.error("Error during baselining:", error);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

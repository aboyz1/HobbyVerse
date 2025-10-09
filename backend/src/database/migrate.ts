// src/database/migrate.ts
import { connectDatabase, getClient } from "../config/database";
import * as fs from "fs";
import * as path from "path";

async function migrate(reset: boolean = false) {
  try {
    await connectDatabase();
    const client = await getClient();

    // Get the database directory path (project root/database)
    const databaseDir = path.join(__dirname, "..", "..", "..", "database");

    // If reset is requested, drop all tables first
    if (reset) {
      console.log("Resetting database (dropping all tables)...");
      await client.query(`
        DROP SCHEMA IF EXISTS public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO PUBLIC;
      `);
      console.log("Database reset completed");
    }

    // Check if tables already exist
    const checkTablesQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;

    const result = await client.query(checkTablesQuery);
    const tablesExist = result.rows[0].exists;

    if (tablesExist && !reset) {
      console.log("Database tables already exist. Skipping schema creation.");
      console.log("If you want to reset the database, run with --reset flag.");
      return;
    }

    // Read and execute init.sql
    const initSqlPath = path.join(databaseDir, "init.sql");
    console.log(`Reading schema from: ${initSqlPath}`);

    if (!fs.existsSync(initSqlPath)) {
      throw new Error(`init.sql not found at: ${initSqlPath}`);
    }

    const initSql = fs.readFileSync(initSqlPath, "utf8");
    console.log("Executing database schema...");
    await client.query(initSql);
    console.log("Database schema created successfully");

    // Read and execute seed.sql (optional)
    const seedSqlPath = path.join(databaseDir, "seed.sql");
    if (fs.existsSync(seedSqlPath)) {
      console.log(`Reading seed data from: ${seedSqlPath}`);
      const seedSql = fs.readFileSync(seedSqlPath, "utf8");
      console.log("Executing seed data...");
      await client.query(seedSql);
      console.log("Seed data inserted successfully");
    } else {
      console.log("No seed.sql file found, skipping seed data");
    }

    console.log("Database migration completed successfully");
  } catch (error) {
    console.error("Error migrating database:", error);
    process.exit(1);
  } finally {
    // Don't need to explicitly release client since we're using the pool
    // and we'll close the pool at the end
    await require("../config/database").closeDatabase();
  }
}

// Run the migration
if (require.main === module) {
  // Check for reset flag in command line arguments
  const reset = process.argv.includes("--reset");
  migrate(reset);
}

export { migrate }; // Export for testing purposes

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';

const DB_PATH = "./Database/database.sqlite";
const SQL_PATH = "./Database/database.sql";

async function setupDatabase() {
  try {
    const migrations = readFileSync(SQL_PATH, "utf8");
    
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    console.log('Database connection established.');

    await db.exec(migrations);
    console.log("Database SQL file applied successfully.");

    await db.close();
    console.log("Database setup finished.");
  } catch (err) {
    console.error('Error during database setup:', err.message);
  }
}

// Run the setup
setupDatabase();
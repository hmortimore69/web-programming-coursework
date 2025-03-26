import { readFileSync } from "fs";

// js console suggestion
import pkg from 'sqlite3';
const { Database } = pkg;

const DB_PATH = "./Database/database.sqlite";
const SQL_PATH = "./Database/database.sql";

const migrations = readFileSync(SQL_PATH, "utf8");

const dbConn = new Database(DB_PATH, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Database opened successfully.");
    }
});

dbConn.exec(migrations, (err) => {
    if (err) {
        console.error("Error executing SQL file:", err.message);
    } else {
        console.log("Database sql file applied successfully.");
    }
});

dbConn.close((err) => {
    if (err) {
        console.error("Error closing database:", err.message);
    } else {
        console.log("Database setup finished.");
    }
});
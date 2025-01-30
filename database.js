import sqlite3 from "sqlite3";
import { open } from "sqlite";

async function init() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database,
        verbose: true
    });
    await db.migrate({ migrationsPath: './migrations-sqlite' });
    return db;
}

const dbConn = await init();

export async function getAllRaces() {
    let races = {};

    try {
        const raceData = await dbConn.all("SELECT * FROM races");

        for (const race of raceData) {
            const participants = await dbConn.all("SELECT * FROM participants WHERE race_id = ?", [race.race_id]);
            const participantsObject = {};
            
            participants.forEach((participant) => {
                participantsObject[participant.participant_id] = {
                    "Name": `${participant.first_name} ${participant.last_name}`,
                    "Time Finished": participant.time_finished,
                };
            });

            races[race.race_id] = {
                Started: race.started,
                Finished: race.finished,
                Participants: participantsObject,
            };
        }

    } catch (error) {
        console.error("Error fetching races:", error.message);
    }

    return races;
}

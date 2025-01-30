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
    try {
        let races = {};

        const raceData = await dbConn.all("SELECT * FROM races");

        for (const race of raceData) {
            const participants = await dbConn.all(`SELECT * FROM participants WHERE race_id = ${race.race_id}`);
            const participantsArray = [];
            
            participants.forEach((participant) => {
                participantsArray.push({
                    "ID": participant.participant_id,
                    "Name": `${participant.first_name} ${participant.last_name}`,
                    "Time Finished": participant.time_finished,
                });
            });

            races[race.race_id] = {
                Started: race.started,
                Finished: race.finished,
                Participants: participantsArray,
            };
        }

        return races;
    } catch (error) {
        console.error("Error fetching races:", error.message);
    }
}

export async function getRace(raceID) {
    try {
        const raceData = await dbConn.get(`SELECT * FROM races WHERE race_id = ${raceID}`);
        if (!raceData) return;

        const participants = await dbConn.all(`SELECT * FROM participants WHERE race_id = ${raceID}`);
        let participantsArray = [];

        participants.forEach((participant) => {
            participantsArray.push({
                "ID": participant.participant_id,
                "Name": `${participant.first_name} ${participant.last_name}`,
                "Time Finished": participant.time_finished,
            });
        });

        const race = {
            Started: raceData.started,
            Finished: raceData.finished,
            Participants: participantsArray,
        };

        return race;
    } catch(error) {
        console.error("Error fetching race:", error.message);
    }
}

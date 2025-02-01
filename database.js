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

export async function getLastTenRaces() {
    try {
        let races = {};

        const raceData = await dbConn.all("SELECT * FROM races ORDER BY time_started DESC LIMIT 10");

        for (const race of raceData) {
            const participants = await dbConn.all(`
                SELECT p.participant_id, p.first_name, p.last_name, pr.bib_number, pr.time_finished
                FROM participants p
                JOIN participants_races pr ON p.participant_id = pr.participant_id
                WHERE pr.race_id = ${race.race_id}
            `);
            const participantsArray = [];
            
            participants.forEach((participant) => {
                participantsArray.push({
                    "ID": participant.participant_id,
                    "Name": `${participant.first_name} ${participant.last_name}`,
                    "Time Finished": participant.time_finished,
                });
            });

            races[race.race_id] = {
                time_started: race.time_started,
                Finished: race.time_finished,
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
        const raceData = await dbConn.all(`
            SELECT
                r.time_started,
                r.time_finished,
                p.participant_id, 
                p.first_name AS participant_first_name, 
                p.last_name AS participant_last_name, 
                pr.bib_number,
                pr.attended,
                pr.time_finished AS participant_time_finished, 
                m.marshall_id, 
                m.first_name AS marshall_first_name, 
                m.last_name AS marshall_last_name, 
                c.checkpoint_id, 
                c.checkpoint_name, 
                c.checkpoint_order, 
                ct.time_finished AS checkpoint_time_finished
            FROM races r
            LEFT JOIN participants_races pr ON r.race_id = pr.race_id
            LEFT JOIN participants p ON pr.participant_id = p.participant_id
            LEFT JOIN marshalls_races mr ON r.race_id = mr.race_id
            LEFT JOIN marshalls m ON mr.marshall_id = m.marshall_id
            LEFT JOIN checkpoints c ON r.race_id = c.race_id
            LEFT JOIN checkpoints_times ct ON c.checkpoint_id = ct.checkpoint_id AND ct.participant_id = p.participant_id
            WHERE r.race_id = ${raceID}
            ORDER BY p.participant_id, c.checkpoint_order;
        `);

        if (!raceData) return;

        const formattedRaceData = {
            race_id: raceID,
            time_started: "",
            time_finished: "",
            marshalls: [],
            participants: []
        };

        const marshallSet = new Set();
        const participantsMap = new Map();

        raceData.forEach(row => {
            formattedRaceData.time_started = row.time_started;
            formattedRaceData.time_finished = row.time_finished;

            // Add marshalls to the set to avoid duplicates
            if (row.marshall_id && !marshallSet.has(row.marshall_id)) {
                formattedRaceData.marshalls.push({
                    marshall_id: row.marshall_id,
                    name: `${row.marshall_first_name} ${row.marshall_last_name}`
                });
                marshallSet.add(row.marshall_id);
            }

            // Check if participant exists, if not, create them
            if (!participantsMap.has(row.participant_id)) {
                participantsMap.set(row.participant_id, {
                    id: row.participant_id,
                    name: `${row.participant_first_name} ${row.participant_last_name}`,
                    bib: row.bib_number,
                    attended: row.attended,
                    time_finished: row.participant_time_finished,
                    checkpoints: []
                });
            }

            // Add checkpoint data if it's not null
            if (row.checkpoint_id) {
                participantsMap.get(row.participant_id).checkpoints.push({
                    checkpoint_id: row.checkpoint_id,
                    name: row.checkpoint_name,
                    order: row.checkpoint_order,
                    time_finished: row.checkpoint_time_finished
                });
            }
        });

        // Convert the participants map to an array
        formattedRaceData.participants = Array.from(participantsMap.values());

        const race = formattedRaceData;

        return race;
    } catch(error) {
        console.error("Error fetching race:", error.message);
    }
}
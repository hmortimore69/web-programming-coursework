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
                SELECT p.participant_id, p.first_name, p.last_name, pr.bib_number, pr.time_finished AS participant_time_finished
                FROM participants p
                JOIN participants_races pr ON p.participant_id = pr.participant_id
                WHERE pr.race_id = ${race.race_id}
            `);
            const participantsArray = [];
            
            participants.forEach((participant) => {
                participantsArray.push({
                    id: participant.participant_id,
                    name: `${participant.first_name} ${participant.last_name}`,
                    time_finished: participant.participant_time_finished,
                });
            });

            races[race.race_id] = {
                time_started: race.time_started,
                time_finished: race.time_finished,
                participants: participantsArray,
            };
        }

        return races;
    } catch (error) {
        console.error("Error fetching races:", error.message);
    }
}

export async function getRace(raceID, page = 1, pageSize = 10) {
    try {
        const offset = (page - 1) * pageSize;

        const raceData = await dbConn.get(
            `SELECT
                r.race_id,
                r.time_started,
                r.time_finished
            FROM races r;`
        );

        const participants = await dbConn.all(`
            SELECT
                p.participant_id,
                p.first_name,
                p.last_name,
                pr.bib_number,
                pr.attended,
                pr.time_finished AS participant_time_finished
            FROM participants_races pr
            JOIN participants p ON pr.participant_id = p.participant_id
            WHERE pr.race_id = ${raceID}
            ORDER BY p.participant_id
            LIMIT ${pageSize} OFFSET ${offset};
        `);

        const totalParticipants = await dbConn.get(`
            SELECT COUNT(*) as total
            FROM participants_races
            WHERE race_id = ${raceID};
        `);

        for (const participant of participants) {
            participant.checkpoints = await dbConn.all(`
                SELECT
                    c.checkpoint_id,
                    c.checkpoint_name,
                    c.checkpoint_order,
                    ct.time_finished AS checkpoint_time_finished
                FROM checkpoints_times ct
                JOIN checkpoints c ON ct.checkpoint_id = c.checkpoint_id
                WHERE ct.participant_id = ${participant.participant_id}
                ORDER BY c.checkpoint_order;
            `);
        }

        const checkpoint_count = await dbConn.get(`
            SELECT COUNT(*) as total
            FROM checkpoints
            WHERE race_id = ${raceID}  
        `);

        return {
            race_id: raceID,
            time_started: raceData.time_started, 
            time_finished: raceData.time_finished,
            total_checkpoints: checkpoint_count.total,
            participants,
            pagination: {
                page,
                pageSize,
                total: totalParticipants.total,
                totalPages: Math.ceil(totalParticipants.total / pageSize)
            }
        };
    } catch (error) {
        console.error("Error fetching race data:", error);
        throw error;
    }
}
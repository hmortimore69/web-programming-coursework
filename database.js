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
            const participant_total = await dbConn.get(`
                SELECT COUNT(*) as total
                FROM participants p
                JOIN participants_races pr ON p.participant_id = pr.participant_id
                WHERE pr.race_id = ${race.race_id}
            `);

            races[race.race_id] = {
                timeStarted: race.time_started,
                timeFinished: race.time_finished,
                participants: participant_total.total,
            };
        }

        return races;
    } catch (error) {
        console.error("Error fetching races:", error.message);
    }
}

export async function getRace(raceId, page = 1, pageSize = 10) {
    try {
        const offset = (page - 1) * pageSize;

        const raceData = await dbConn.get(
            `SELECT
                r.race_id as raceId,
                r.time_started as timeStarted,
                r.time_finished as timeFinished
            FROM races r;`
        );

        const participants = await dbConn.all(`
            SELECT
                p.participant_id as participantId,
                p.first_name as firstName,
                p.last_name as lastName,
                pr.bib_number as bibNumber,
                pr.attended as attended,
                pr.time_finished AS timeFinished
            FROM participants_races pr
            JOIN participants p ON pr.participant_id = p.participant_id
            WHERE pr.race_id = ${raceId}
            ORDER BY p.participant_id
            LIMIT ${pageSize} OFFSET ${offset};
        `);

        const totalParticipants = await dbConn.get(`
            SELECT COUNT(*) as total
            FROM participants_races
            WHERE race_id = ${raceId};
        `);

        for (const participant of participants) {
            participant.checkpoints = await dbConn.all(`
                SELECT
                    c.checkpoint_id AS checkpointId,
                    c.checkpoint_name AS checkpointName,
                    c.checkpoint_order AS checkpointOrder,
                    ct.time_finished AS checkpointTimeFinished
                FROM checkpoints_times ct
                JOIN checkpoints c ON ct.checkpoint_id = c.checkpoint_id
                WHERE ct.participant_id = ${participant.participantId}
                ORDER BY c.checkpoint_order;
            `);
        }

        const checkpointCount = await dbConn.get(`
            SELECT COUNT(*) as total
            FROM checkpoints
            WHERE race_id = ${raceId}  
        `);

        return {
            raceId: raceId,
            timeStarted: raceData.timeStarted, 
            timeFinished: raceData.timeFinished,
            totalCheckpoints: checkpointCount.total,
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
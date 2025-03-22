import sqlite3 from "sqlite3";
import { open } from "sqlite";

async function init() {
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
    verbose: true,
  });
  await db.migrate({ migrationsPath: "./migrations-sqlite" });
  return db;
}

const dbConn = await init();

export async function getLastTenRaces() {
  try {
    let races = {};

    const raceData = await dbConn.all(
      "SELECT * FROM races ORDER BY time_started DESC LIMIT 10"
    );

    for (const race of raceData) {
      const participant_total = await dbConn.get(`
        SELECT COUNT(*) as total
        FROM participants p
        WHERE p.race_id = ${race.race_id}
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
        race_id as raceId,
        time_started as timeStarted,
        time_finished as timeFinished
      FROM races
      WHERE race_id = ?`, [raceId]
    );

    const participants = await dbConn.all(`
      SELECT
        participant_id as participantId,
        first_name as firstName,
        last_name as lastName,
        bib_number as bibNumber,
        attended as attended,
        time_finished AS timeFinished
      FROM participants
      WHERE race_id = ${raceId}
      ORDER BY participant_id
      LIMIT ${pageSize} OFFSET ${offset};
    `);

    const totalParticipants = await dbConn.get(`
      SELECT COUNT(*) as total
      FROM participants
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
        totalPages: Math.ceil(totalParticipants.total / pageSize),
      },
    };
  } catch (error) {
    console.error("Error fetching race data:", error);
    throw error;
  }
}

export async function createNewRace(req) {
  if (req.raceDetails) {
    const raceName = req.raceDetails["#race-name"];

    const startDateString = req.raceDetails["#race-start-date"];
    const startDate = new Date(startDateString);
    const startTimestamp = startDate.getTime();

    const durationString = req.raceDetails['#race-duration'];
    const [hours, minutes] = durationString.split(':').map(Number);
    const durationMilliseconds = (hours * 3600 + minutes * 60) * 1000;
    const finishTimestamp = startTimestamp + durationMilliseconds;

    console.log(raceName, startTimestamp, finishTimestamp);

    dbConn.run(`INSERT INTO races (race_name, time_started, time_finished) VALUES (?, ?, ?);`, [raceName, startTimestamp, finishTimestamp]);
  }

  if (req.checkpoints) {
    console.log(req.checkpoints);
  }

  if (req.marshalls) {
    console.log(req.marshalls);
  }

  if (req.participants) {
    console.log(req.participants);
  }
}

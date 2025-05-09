import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const DB_PATH = './Database/database.sqlite';

// Open database connection
let db;
(async () => {
  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
  console.log('Database connection established.');
})();

// Database Queries
export async function getAllRaces(page = 1, pageSize = 10) {
  try {
    const offset = (page - 1) * pageSize;
    const races = {};

    const raceData = await db.all(`
      SELECT * 
      FROM races 
      ORDER BY CAST(time_started AS INTEGER) DESC 
      LIMIT ? OFFSET ?
    `, [pageSize, offset]);    
    const raceCount = await db.all('SELECT COUNT(*) as total FROM races');

    for (const race of raceData) {
      const participantTotal = await db.get(`
        SELECT COUNT(*) as total
        FROM participants p
        WHERE p.race_id = ?
      `, [race.race_id]);

      races[race.race_id] = {
        raceLocation: race.race_location,
        scheduledStartTime: race.scheduled_start_time,
        scheduledDuration: race.scheduled_duration,
        timeStarted: race.time_started,
        timeFinished: race.time_finished,
        participants: participantTotal.total,
      };
    }

    races["pagination"] = {
      page,
      pageSize,
      total: raceCount[0].total,
      totalPages: Math.ceil(raceCount[0].total / pageSize),
    };

    return races;
  } catch (error) {
    console.error('Error fetching races:', error.message);
  }
}

export async function getRace(raceId, page = 1, pageSize = 10) {
  try {
    const offset = (page - 1) * pageSize;

    const raceData = await db.get(
      `SELECT
        race_id as raceId,
        race_location as raceLocation,
        time_started as timeStarted,
        time_finished as timeFinished,
        scheduled_start_time as scheduledStartTime,
        scheduled_duration as scheduledDuration
      FROM races
      WHERE race_id = ?`, [raceId],
    );

    const participants = await db.all(`
      SELECT
        participant_id as participantId,
        first_name as firstName,
        last_name as lastName,
        bib_number as bibNumber,
        attended as attended,
        time_finished AS timeFinished
      FROM participants
      WHERE race_id = ?
      ORDER BY participant_id
      LIMIT ? OFFSET ?
    `, [raceId, pageSize, offset]);

    const totalParticipants = await db.get(`
      SELECT COUNT(*) as total
      FROM participants
      WHERE race_id = ?
    `, [raceId]);

    for (const participant of participants) {
      participant.checkpoints = await db.all(`
        SELECT
          c.checkpoint_id AS checkpointId,
          c.checkpoint_name AS checkpointName,
          c.checkpoint_order AS checkpointOrder,
          ct.time_finished AS checkpointTimeFinished
        FROM checkpoints_times ct
        JOIN checkpoints c ON ct.checkpoint_id = c.checkpoint_id
        WHERE ct.participant_id = ?
        ORDER BY c.checkpoint_order;
      `, [participant.participantId]);
    }

    const checkpointCount = await db.get(`
      SELECT COUNT(*) as total
      FROM checkpoints
      WHERE race_id = ? 
    `, [raceId]);

    if (!raceData) return;

    return {
      raceId,
      raceLocation: raceData.raceLocation,
      timeStarted: raceData.timeStarted,
      timeFinished: raceData.timeFinished,
      scheduledStartTime: raceData.scheduledStartTime,
      scheduledDuration: raceData.scheduledDuration,
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
    console.error('Error fetching race data:', error);
  }
}

export async function createNewRace(req) {
  let newRaceId = null;

  if (req.raceDetails) {
    const raceName = req.raceDetails['#race-name'];
    const raceLocation = req.raceDetails['#race-location'];

    const startDateString = req.raceDetails['#race-start-date'];
    const startDate = new Date(startDateString);
    const scheduledStartTimestamp = startDate.getTime();

    const durationString = req.raceDetails['#race-duration'];
    const [hours, minutes] = durationString.split(':').map(Number);
    const scheduledDuration = (hours * 3600 + minutes * 60) * 1000;

    const result = await db.run(
      'INSERT INTO races (race_name, race_location, scheduled_start_time, scheduled_duration, time_started, time_finished) VALUES (?, ?, ?, ?, NULL, NULL)',
      [raceName, raceLocation, scheduledStartTimestamp, scheduledDuration]
    );
    newRaceId = result.lastID;
  }

  if (req.checkpoints.length > 0) {
    for (const checkpoint of req.checkpoints) {
      await db.run(
        'INSERT INTO checkpoints (race_id, checkpoint_name, checkpoint_order) VALUES (?, ?, ?)',
        [newRaceId, checkpoint['.checkpoint-name'], checkpoint['.checkpoint-order']]
      );
    }
  }

  if (req.marshalls.length > 0) {
    for (const marshall of req.marshalls) {
      await db.run(
        'INSERT INTO marshalls (race_id, first_name, last_name) VALUES (?, ?, ?)',
        [newRaceId, marshall['.marshall-first-name'], marshall['.marshall-last-name']]
      );
    }
  }

  if (req.participants.length > 0) {
    for (const participant of req.participants) {
      await db.run(
        `INSERT INTO participants (race_id, first_name, last_name, bib_number) 
         VALUES (?, ?, ?, COALESCE((SELECT MAX(bib_number) + 1 FROM participants WHERE race_id = ?), 1))`,
        [newRaceId, participant['.participant-first-name'], participant['.participant-last-name'], newRaceId]
      );
    }
  }
}

export async function deleteRaceById(raceId) {
  try {
    await db.run('DELETE FROM checkpoints WHERE race_id = ?', [raceId]);
    await db.run('DELETE FROM marshalls WHERE race_id = ?', [raceId]);
    await db.run('DELETE FROM participants WHERE race_id = ?', [raceId]);
    await db.run('DELETE FROM races WHERE race_id = ?', [raceId]);
    return true;
  } catch (error) {
    console.error(`Error deleting race with ID ${raceId}:`, error.message);
  }
}

export async function updateStartTime(raceId, data) {
  const timeStamp = JSON.parse(data.startTime);
  await db.run('UPDATE races SET time_started = ? WHERE race_id = ?', [timeStamp, raceId]);
}

export async function updateFinishTime(raceId, data) {
  const timeStamp = JSON.parse(data.finishTime);
  await db.run('UPDATE races SET time_finished = ? WHERE race_id = ?', [timeStamp, raceId]);
}

export async function submitResults(raceId, data) {
  for (const submission of data) {
    await submitParticipantTime(raceId, submission.bibNumber, submission.time, submission.submittedBy);
  }
}

async function submitParticipantTime(raceId, bibNumber, timestamp, submittedBy) {
  const participant = await db.get(`
    SELECT 
      pending_times as pendingTimes,
      time_finished as timeFinished
    FROM participants 
    WHERE race_id = ? AND bib_number = ?`, 
    [raceId, bibNumber]
  );

  let pendingTimes = participant.pendingTimes ? JSON.parse(participant.pendingTimes) : [];
  const currentTime = participant.timeFinished;

  const hasConflict = (currentTime !== null) || (pendingTimes.length > 0) || true;

  pendingTimes.push({ 
    time: timestamp, 
    submitted_by: submittedBy, 
    submitted_at: new Date().toISOString(),
    current_time: currentTime 
  });

  if (!hasConflict) {
    await db.run(`
      UPDATE participants
      SET
        time_finished = ?,
        pending_times = NULL,
        has_conflict = ?
      WHERE race_id = ? AND bib_number = ?`,
      [timestamp, hasConflict, raceId, bibNumber]
    );
  } else {
    await db.run(`
      UPDATE participants 
      SET 
        pending_times = ?, 
        has_conflict = ?
      WHERE race_id = ? AND bib_number = ?`,
      [JSON.stringify(pendingTimes), hasConflict, raceId, bibNumber]
    );
  }

  return;
}

export async function getConflicts(raceId) {
  return await db.all(`
    SELECT 
      participant_id as participantId, 
      bib_number as bibNumber,
      first_name as firstName,
      last_name as lastName,
      pending_times as pendingTimes,
      time_finished as timeFinished,
      has_conflict as hasConflict
    FROM participants
    WHERE race_id = ? AND has_conflict = TRUE
    ORDER BY bib_number`, 
    [raceId]
  );
}

export async function resolveConflict(raceId, bibNumber, acceptedTime) {
  await db.run(`
    UPDATE participants
    SET
      time_finished = ?,
      pending_times = NULL,
      has_conflict = FALSE
    WHERE race_id = ? AND bib_number = ?`, 
    [acceptedTime, raceId, bibNumber]
  );
}

export async function rejectConflict(raceId, bibNumber, rejectedTime) {
  try {
    const participant = await db.get(`
      SELECT pending_times as pendingTimes
      FROM participants
      WHERE race_id = ? AND bib_number = ?`,
      [raceId, bibNumber]
    );

    if (!participant) {
      throw new Error('Participant not found');
    }

    let pendingTimes = participant.pendingTimes ? JSON.parse(participant.pendingTimes) : [];
    
    // Remove the rejected time
    const updatedPendingTimes = pendingTimes.filter(timeObj => 
      timeObj.time !== rejectedTime
    );

    // Update the database
    await db.run(`
      UPDATE participants
      SET
        pending_times = ?,
        has_conflict = ?
      WHERE race_id = ? AND bib_number = ?`,
      [
        updatedPendingTimes.length > 0 ? JSON.stringify(updatedPendingTimes) : null,
        updatedPendingTimes.length > 0, // has_conflict true if still pending times
        raceId, 
        bibNumber
      ]
    );

    return { success: true, remainingConflicts: updatedPendingTimes.length };
  } catch (error) {
    console.error('Error rejecting conflict:', error);
    throw error;
  }
}
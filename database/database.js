import pkg from 'sqlite3';
const { Database } = pkg;

const DB_PATH = './Database/database.sqlite';

const DB_CONN = new Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Database connection established.');
  }
});

// sqlite3 promise wrappers
async function getAll(sql, args) {
  return await new Promise((resolve, reject) => {
    DB_CONN.all(sql, args, (error, rows) => {
      if (error) reject(error);
      resolve(rows);
    });
  });
}

async function getRow(sql, args) {
  return await new Promise((resolve, reject) => {
    DB_CONN.get(sql, args, (error, row) => {
      if (error) reject(error);
      resolve(row);
    });
  });
}

async function deleteRow(sql, args) {
  return await new Promise((resolve, reject) => {
    DB_CONN.run(sql, args, function (error) {
      if (error) reject(error);
      resolve(this.changes);
    });
  });
}

async function updateRace(sql, args) {
  return await new Promise((resolve, reject) => {
    DB_CONN.run(sql, args, function(error) {
      if (error) reject(error);
      resolve(this.changes);
    })
  })
}

// Main Database Queries
export async function getAllRaces(page = 1, pageSize = 10) {
  try {
    const offset = (page - 1) * pageSize;
    const races = {};

    const raceData = await getAll(`
      SELECT * 
      FROM races 
      ORDER BY CAST(time_started AS INTEGER) DESC 
      LIMIT ? OFFSET ?
    `, [pageSize, offset]);    
    const raceCount = await getAll('SELECT COUNT(*) as total FROM races');

    for (const race of raceData) {
      const participantTotal = await getRow(`
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

    const raceData = await getRow(
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

    const participants = await getAll(`
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

    const totalParticipants = await getRow(`
      SELECT COUNT(*) as total
      FROM participants
      WHERE race_id = ?
    `, [raceId]);

    for (const participant of participants) {
      participant.checkpoints = await getAll(`
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

    const checkpointCount = await getRow(`
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

    newRaceId = await new Promise((resolve, reject) => {
      DB_CONN.run(
        'INSERT INTO races (race_name, race_location, scheduled_start_time, scheduled_duration, time_started, time_finished) VALUES (?, ?, ?, ?, NULL, NULL)',
        [raceName, raceLocation, scheduledStartTimestamp, scheduledDuration],
        function (error) {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            resolve(this.lastID);
          }
        },
      );
    });
  }

  if (req.checkpoints.length > 0) {
    for (const checkpoint of req.checkpoints) {
      DB_CONN.run(
        'INSERT INTO checkpoints (race_id, checkpoint_name, checkpoint_order) VALUES (?, ?, ?)',
        [newRaceId, checkpoint['.checkpoint-name'], checkpoint['.checkpoint-order']],
      );
    }
  }

  if (req.marshalls.length > 0) {
    for (const marshall of req.marshalls) {
      DB_CONN.run(
        'INSERT INTO marshalls (race_id, first_name, last_name) VALUES (?, ?, ?)',
        [newRaceId, marshall['.marshall-first-name'], marshall['.marshall-last-name']],
      );
    }
  }

  if (req.participants.length > 0) {
    for (const participant of req.participants) {
      DB_CONN.run(
        `INSERT INTO participants (race_id, first_name, last_name, bib_number) 
         VALUES (?, ?, ?, COALESCE((SELECT MAX(bib_number) + 1 FROM participants WHERE race_id = ?), 1))`,
        [newRaceId, participant['.participant-first-name'], participant['.participant-last-name'], newRaceId]
      );
    }
  }
}

export async function deleteRaceById(raceId) {
  try {
    await deleteRow('DELETE FROM checkpoints WHERE race_id = ?', [raceId]);
    await deleteRow('DELETE FROM marshalls WHERE race_id = ?', [raceId]);
    await deleteRow('DELETE FROM participants WHERE race_id = ?', [raceId]);
    await deleteRow('DELETE FROM races WHERE race_id = ?', [raceId]);

    console.log(`The race with ID ${raceId} and its associated data has been deleted.`);
    return;
  } catch (error) {
    console.error(`Error deleting race with ID ${raceId}:`, error.message);
  }
}

export async function updateStartTime(raceId, data) {
  const timeStamp = JSON.parse(data.startTime);
  updateRace('UPDATE races SET time_started = ? WHERE race_id = ?', [timeStamp, raceId]);
}

export async function updateFinishTime(raceId, data) {
  const timeStamp = JSON.parse(data.finishTime);
  updateRace('UPDATE races SET time_finished = ? WHERE race_id = ?', [timeStamp, raceId]);
}

export async function submitResults(raceId, data) {
  console.log(data);
  for (const submission of data) {
    console.log(submission);
    submitParticipantTime(raceId, submission.bibNumber, submission.time, submission.submittedBy);
  }
}

async function submitParticipantTime(raceId, bibNumber, timestamp, submittedBy) {
  const participant = await getRow(`
    SELECT 
      pending_times as pendingTimes,
      time_finished as timeFinished
    FROM participants 
    WHERE race_id = ? AND bib_number = ?`, 
    [raceId, bibNumber]
  );

  let pendingTimes = participant.pendingTimes ? JSON.parse(participant.pendingTimes) : [];
  const currentTime = participant.timeFinished; // Store the current final time

  const hasConflict = (currentTime !== null) || (pendingTimes.length > 0);

  pendingTimes.push({ 
    time: timestamp, 
    submitted_by: submittedBy, 
    submitted_at: new Date().toISOString(),
    current_time: currentTime 
  });

  if (!hasConflict) {
    DB_CONN.run(`
      UPDATE participants
      SET
        time_finished = ?,
        pending_times = NULL,
        has_conflict = ?
      WHERE race_id = ? AND bib_number = ?`,
      [timestamp, false, raceId, bibNumber]
    );
  } else {
    DB_CONN.run(`
      UPDATE participants 
      SET 
        pending_times = ?, 
        has_conflict = ?
      WHERE race_id = ? AND bib_number = ?`,
      [JSON.stringify(pendingTimes), true, raceId, bibNumber]
    );
  }

  return { success: true, hasConflict };
}

export async function getConflicts(raceId) {
  return await getAll(`
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
  DB_CONN.run(`
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
    const participant = await getRow(`
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
    DB_CONN.run(`
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
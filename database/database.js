import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const DB_PATH = './Database/database.sqlite';

// Open database connection
const db = await open({
  filename: DB_PATH,
  driver: sqlite3.Database
});

// Database Queries

/**
 * Retrieves paginated race data with participant counts and pagination metadata.
 * 
 * @async
 * @function getAllRaces
 * @param {number} [page=1] - Current page number for pagination
 * @param {number} [pageSize=10] - Number of races per page
 * @returns {Promise<Object>} A promise that resolves to an object containing race data and pagination info
 * @throws {Error} If there's an error during database operations (error is caught and logged)
 */
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

/**
 * Retrieves comprehensive race data including participants (with pagination), checkpoints, and marshals.
 * 
 * @async
 * @function getRace
 * @param {number|string} raceId - The ID of the race to fetch
 * @param {number} [page=1] - Current page number for participant pagination
 * @param {number} [pageSize=10] - Number of participants per page
 * @returns {Promise<Object|null>} A promise that resolves to a race data object or null if race not found
 * @throws {Error} If there's an error during database operations (error is caught and logged)
 */
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

    const marshals = await getMarshals(raceId);
    const checkpoints = await getCheckpoints(raceId);

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
      marshals,
      checkpoints,
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

/**
 * Retrieves all marshals assigned to a specific race.
 * 
 * @async
 * @function getMarshals
 * @param {number|string} raceId - The ID of the race to fetch marshals for
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of marshal objects, or empty array on error
 * @throws {Error} If there's an error during database operation (error is caught and logged)
 */
export async function getMarshals(raceId) {
  try {
    const marshals = await db.all(`
      SELECT
        marshal_id as marshalId,
        first_name as firstName,
        last_name as lastName
      FROM marshals
      WHERE race_id = ?
      ORDER BY last_name, first_name
    `, [raceId]);

    return marshals;
  } catch (error) {
    console.error('Error fetching marshals:', error);
    return [];
  }
}

/**
 * Retrieves all checkpoints for a specific race.
 * 
 * @async
 * @function getCheckpoints
 * @param {number|string} raceId - The ID of the race to fetch checkpoints for
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of checkpoint objects, or empty array on error
 * @throws {Error} If there's an error during database operation (error is caught and logged)
 */
export async function getCheckpoints(raceId) {
  try {
    const checkpoints = await db.all(`
      SELECT
        checkpoint_id as checkpointId,
        race_id as raceId,
        checkpoint_name as checkpointName,
        checkpoint_order as checkpointOrder
      FROM checkpoints
      WHERE race_id = ?
      ORDER BY checkpoint_order, checkpoint_name
    `, [raceId]);

    return checkpoints;
  } catch (error) {
    console.error('Error fetching checkpoints:', error);
    return [];
  }
}

/**
 * Creates a new race along with its checkpoints, marshals, and participants.
 *
 * @async
 * @function createNewRace
 * @param {Object} req - The request object containing all race-related data.
 * @param {Object} req.raceDetails - Race configuration details.
 * @param {string} req.raceDetails.raceName - Name of the race.
 * @param {string} req.raceDetails.raceLocation - Location of the race.
 * @param {string} req.raceDetails.raceStartDate - Start date/time of the race in ISO format.
 * @param {string} req.raceDetails.raceDuration - Duration of the race in 'HH:MM' format.
 * @param {Array<Object>} [req.checkpoints] - Array of checkpoint objects.
 * @param {string} req.checkpoints[].checkpointName - Name of the checkpoint.
 * @param {number} req.checkpoints[].checkpointOrder - Sequence/order of the checkpoint.
 * @param {Array<Object>} [req.marshals] - Array of marshal objects.
 * @param {string} req.marshals[].firstName - Marshal's first name.
 * @param {string} req.marshals[].lastName - Marshal's last name.
 * @param {Array<Object>} [req.participants] - Array of participant objects.
 * @param {string} req.participants[].firstName - Participant's first name.
 * @param {string} req.participants[].lastName - Participant's last name.
 * @returns {Promise<void>} A promise that resolves when the race and all associated data are successfully created.
 * @throws {Error} If any database operation fails.
 */
export async function createNewRace(req) {
  let newRaceId = null;

  if (req.raceDetails) {
    const raceName = req.raceDetails['race-name'];
    const raceLocation = req.raceDetails['race-location'];

    const startDateString = req.raceDetails['race-start-date'];
    const startDate = new Date(startDateString);
    const scheduledStartTimestamp = startDate.getTime();

    const durationString = req.raceDetails['race-duration'];
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
        [newRaceId, checkpoint['checkpoint-name'], checkpoint['checkpoint-order']]
      );
    }
  }

  if (req.marshals.length > 0) {
    for (const marshal of req.marshals) {
      await db.run(
        'INSERT INTO marshals (race_id, first_name, last_name) VALUES (?, ?, ?)',
        [newRaceId, marshal['marshal-first-name'], marshal['marshal-last-name']]
      );
    }
  }

  if (req.participants.length > 0) {
    for (const participant of req.participants) {
      await db.run(
        `INSERT INTO participants (race_id, first_name, last_name, bib_number) 
         VALUES (?, ?, ?, COALESCE((SELECT MAX(bib_number) + 1 FROM participants WHERE race_id = ?), 1))`,
        [newRaceId, participant['participant-first-name'], participant['participant-last-name'], newRaceId]
      );
    }
  }
}

/**
 * Deletes a race and all its associated data (checkpoints, marshals, participants).
 * 
 * @async
 * @function deleteRaceById
 * @param {number|string} raceId - The ID of the race to delete
 * @returns {Promise<boolean>} A promise that resolves to true if deletion was successful, undefined if error occurred
 * @throws {Error} If any database operation fails (error is caught and logged)
 */
export async function deleteRaceById(raceId) {
  try {
    await db.run('DELETE FROM checkpoints WHERE race_id = ?', [raceId]);
    await db.run('DELETE FROM marshals WHERE race_id = ?', [raceId]);
    await db.run('DELETE FROM participants WHERE race_id = ?', [raceId]);
    await db.run('DELETE FROM races WHERE race_id = ?', [raceId]);
    return true;
  } catch (error) {
    console.error(`Error deleting race with ID ${raceId}:`, error.message);
  }
}

/**
 * Updates the start time for a specific race.
 * 
 * @async
 * @function updateStartTime
 * @param {number|string} raceId - The ID of the race to update
 * @param {Object} data - Object containing the new start time
 * @param {string} data.startTime - JSON string representing the new start time
 * @returns {Promise<void>} A promise that resolves when the update is complete
 * @throws {Error} If the database operation fails or JSON parsing fails
 */
export async function updateStartTime(raceId, data) {
  const timeStamp = JSON.parse(data.startTime);
  await db.run('UPDATE races SET time_started = ? WHERE race_id = ?', [timeStamp, raceId]);
}

/**
 * Updates the finish time for a specific race.
 * 
 * @async
 * @function updateFinishTime
 * @param {number|string} raceId - The ID of the race to update
 * @param {Object} data - Object containing the new finish time
 * @param {string} data.finishTime - JSON string representing the new finish time
 * @returns {Promise<void>} A promise that resolves when the update is complete
 * @throws {Error} If the database operation fails or JSON parsing fails
 */
export async function updateFinishTime(raceId, data) {
  const timeStamp = JSON.parse(data.finishTime);
  await db.run('UPDATE races SET time_finished = ? WHERE race_id = ?', [timeStamp, raceId]);
}

/**
 * Submits race results for multiple participants, handling both finish times and checkpoint times.
 * 
 * @async
 * @function submitResults
 * @param {number|string} raceId - The ID of the race
 * @param {Array<Object>} data - Array of result submission objects
 * @param {string} submittedBy - Identifier for who is submitting the results
 * @param {string} checkpoint - The checkpoint name ('Finish' for finish line)
 * @returns {Promise<void>} A promise that resolves when all submissions are complete
 * @throws {Error} If any participant is not found or database operations fail
 */
export async function submitResults(raceId, data, submittedBy, checkpoint) {
  for (const submission of data) {
    const timeToSubmit = submission.converted ? submission.time : 
                        (submission.type === 'online' ? submission.time : 
                        new Date(submission.time) - new Date(submission.raceStartTime));
        
    await submitParticipantTime(
      raceId, 
      submission.bibNumber, 
      timeToSubmit, 
      submittedBy,
      checkpoint
    );
  }
}

/**
 * Handles the submission of a single participant's time, managing conflicts and checkpoints.
 * 
 * @async
 * @function submitParticipantTime
 * @param {number|string} raceId - The ID of the race
 * @param {number|string} bibNumber - The participant's bib number
 * @param {number|string} timestamp - The time to submit (either as timestamp or Date string)
 * @param {string} submittedBy - Identifier for who is submitting the results
 * @param {string} checkpoint - The checkpoint name ('Finish' for finish line)
 * @returns {Promise<void>} A promise that resolves when the submission is complete
 * @throws {Error} If participant is not found or database operations fail
 * 
 * @private
 */
async function submitParticipantTime(raceId, bibNumber, timestamp, submittedBy, checkpoint) {
  // Convert timestamp to number if it isn't already
  const timeValue = typeof timestamp === 'number' ? timestamp : new Date(timestamp) - new Date(0);

  // First get the participant and their existing times
  const participant = await db.get(`
    SELECT 
      participant_id as participantId,
      pending_times as pendingTimes,
      time_finished as timeFinished
    FROM participants 
    WHERE race_id = ? AND bib_number = ?`, 
    [raceId, bibNumber]
  );

  if (!participant) {
    throw new Error('Participant not found');
  }

  if (checkpoint === 'Finish') {
    let pendingTimes = participant.pendingTimes ? JSON.parse(participant.pendingTimes) : [];
    const currentTime = participant.timeFinished;
    const hasConflict = (currentTime !== null) || (pendingTimes.length > 0);

    pendingTimes.push({ 
      time: timeValue, 
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
        [timeValue, hasConflict, raceId, bibNumber]
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
  } else {
    const existingTime = await db.get(`
      SELECT time_finished
      FROM checkpoints_times
      WHERE checkpoint_id = ? AND participant_id = ?`,
      [checkpoint, participant.participantId]
    );

    if (existingTime) {
      await db.run(`
        UPDATE checkpoints_times
        SET time_finished = ?
        WHERE checkpoint_id = ? AND participant_id = ?`,
        [timeValue, checkpoint, participant.participantId]
      );
    } else {
      await db.run(`
        INSERT INTO checkpoints_times (checkpoint_id, participant_id, time_finished)
        VALUES (?, ?, ?)`,
        [checkpoint, participant.participantId, timeValue]
      );
    }
  }
}

/**
 * Retrieves all participants with timing conflicts for a specific race.
 * 
 * @async
 * @function getConflicts
 * @param {number|string} raceId - The ID of the race to fetch conflicts for
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of participant objects with conflicts
 */
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

/**
 * Resolves a timing conflict by accepting a specific time for a participant.
 * 
 * @async
 * @function resolveConflict
 * @param {number|string} raceId - The ID of the race
 * @param {number|string} bibNumber - The participant's bib number
 * @param {string} acceptedTime - The time to accept as official finish time
 * @returns {Promise<void>} A promise that resolves when the update is complete
 * @throws {Error} If there's an error during database operation
 */
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

/**
 * Rejects a proposed time for a participant and updates their pending times.
 * 
 * @async
 * @function rejectConflict
 * @param {number|string} raceId - The ID of the race
 * @param {number|string} bibNumber - The participant's bib number
 * @param {string} rejectedTime - The time to reject
 * @returns {Promise<Object>} An object with success status and count of remaining conflicts
 * @throws {Error} If participant is not found or database operation fails
 */
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
      String(timeObj.time) !== String(rejectedTime)
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

/**
 * Registers a participant's interest in a race.
 * 
 * @async
 * @function registerParticipantInterest
 * @param {number|string} raceId - The ID of the race
 * @param {string} firstName - The participant's first name
 * @param {string} lastName - The participant's last name
 * @returns {Promise<void>} A promise that resolves when the registration is complete
 * @throws {Error} If there's an error during database operation
 */
export async function registerParticipantInterest(raceId, firstName, lastName) {
  await db.run(
    'INSERT INTO race_interests (race_id, first_name, last_name) VALUES (?, ?, ?)',
    [raceId, firstName, lastName]
  );
}

/**
 * Retrieves all pending participant interest requests for a race.
 * 
 * @async
 * @function getPendingParticipants
 * @param {number|string} raceId - The ID of the race
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of pending participants
 */
export async function getPendingParticipants(raceId) {
  try {
    const participants = await db.all(`
      SELECT 
        interest_id as interestId,
        first_name as firstName,
        last_name as lastName,
        timestamp
      FROM race_interests
      WHERE race_id = ? AND status IS NULL
      ORDER BY timestamp
    `, [raceId]);

    return participants;
  } catch (error) {
    console.error('Error fetching pending participants:', error);
    return [];
  }
}

/**
 * Approves or rejects a participant's interest request.
 * 
 * @async
 * @function updateParticipantStatus
 * @param {number|string} raceId - The ID of the race
 * @param {number|string} interestId - The ID of the interest record
 * @param {'approve'|'reject'} action - The action to take
 * @returns {Promise<boolean>} A promise that resolves to true if successful
 * @throws {Error} If there's an error during database operation
 */
export async function updateParticipantStatus(raceId, interestId, action) {
  try {
    if (action === 'approve') {
      // Get participant details
      const participant = await db.get(`
        SELECT first_name, last_name
        FROM race_interests
        WHERE interest_id = ?
      `, [interestId]);

      // Add to participants table
      await db.run(
        `INSERT INTO participants (race_id, first_name, last_name, bib_number) 
         VALUES (?, ?, ?, COALESCE((SELECT MAX(bib_number) + 1 FROM participants WHERE race_id = ?), 1))`,
        [raceId, participant.first_name, participant.last_name, raceId]
      );
    }

    // Update status in race_interests table
    await db.run(
      'UPDATE race_interests SET status = ? WHERE interest_id = ?',
      [action === 'approve' ? 'approved' : 'rejected', interestId]
    );

    return true;
  } catch (error) {
    console.error('Error updating participant status:', error);
    throw error;
  }
}

/**
 * Retrieves all participants for a specific race along with checkpoint data. (Excludes pagination)
 * @async
 * @function getAllParticipantsForRace
 * @param {number|string} raceId - The ID of the race to fetch participants for
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of participant objects
 * @throws {Error} If there's an error during database operations
 */
export async function getAllParticipantsForRace(raceId) {
  try {
    const participants = await db.all(`
      SELECT
        participant_id as participantId,
        first_name as firstName,
        last_name as lastName,
        bib_number as bibNumber,
        time_finished AS timeFinished
      FROM participants
      WHERE race_id = ?
      ORDER BY bib_number
    `, [raceId]);

    // Get checkpoints for each participant
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

    return participants;
  } catch (error) {
    console.error('Error fetching all participants:', error);
    throw error;
  }
}

/**
 * Updates race details and associated entities (checkpoints, marshals, and participants) in the database.
 * 
 * - Updates existing records if IDs are provided.
 * - Inserts new records if IDs are missing.
 * - Automatically assigns the next available `bib_number` to new participants.
 *
 * @async
 * @function updateRace
 * @param {number} raceId - The ID of the race to update.
 * @param {Object} data - The data object containing race updates.
 * @param {Object} [data.raceDetails] - Race metadata including location, start time, and duration.
 * @param {string} data.raceDetails.raceLocation - The location of the race.
 * @param {string} data.raceDetails.scheduledStartTime - The ISO string representing the scheduled start time.
 * @param {string} data.raceDetails.scheduledDuration - The scheduled duration as a string (e.g., "01:30").
 * @param {Array<Object>} data.checkpoints - Array of checkpoint data.
 * @param {number} [data.checkpoints[].checkpointId] - ID of the checkpoint (if updating).
 * @param {string} data.checkpoints[].checkpointName - Name of the checkpoint.
 * @param {number} data.checkpoints[].checkpointOrder - Order of the checkpoint in the race.
 * @param {Array<Object>} data.marshals - Array of marshal data.
 * @param {number} [data.marshals[].marshalId] - ID of the marshal (if updating).
 * @param {string} data.marshals[].firstName - First name of the marshal.
 * @param {string} data.marshals[].lastName - Last name of the marshal.
 * @param {Array<Object>} data.participants - Array of participant data.
 * @param {number} [data.participants[].participantId] - ID of the participant (if updating).
 * @param {string} data.participants[].firstName - First name of the participant.
 * @param {string} data.participants[].lastName - Last name of the participant.
 * 
 * @returns {Promise<void>} Resolves when all updates and inserts are complete.
 */
export async function updateRace(raceId, data) {
  if (data.raceDetails) {
    const raceLocation = data.raceDetails.raceLocation;

    const startDateString = data.raceDetails.scheduledStartTime;
    const startDate = new Date(startDateString);
    const scheduledStartTimestamp = startDate.getTime();

    const durationString = data.raceDetails.scheduledDuration;
    const [hours, minutes] = durationString.split(':').map(Number);
    const scheduledDuration = (hours * 3600 + minutes * 60) * 1000;

    await db.run(
      `UPDATE races
       SET race_location = ?, scheduled_start_time = ?, scheduled_duration = ?
       WHERE race_id = ?`,
      [raceLocation, scheduledStartTimestamp, scheduledDuration, raceId]
    );
  }

  if (data.checkpoints.length > 0) {
    for (const checkpoint of data.checkpoints) {
      if (checkpoint.checkpointId) {
        // Update if checkpointId exists
        await db.run(`
          UPDATE checkpoints
           SET checkpoint_name = ?, checkpoint_order = ?
           WHERE checkpoint_id = ?`,
          [checkpoint.checkpointName, checkpoint.checkpointOrder, checkpoint.checkpointId]
        );

        await removeRaceDetails({
          table: 'checkpoints',
          idColumn: 'checkpoint_id',
          raceId,
          updatedIds: data.checkpoints.filter(c => c.checkpointId).map(c => c.checkpointId),
        });
      } else {
        // Insert if checkpointId is missing
        await db.run(`
          INSERT INTO checkpoints (race_id, checkpoint_name, checkpoint_order)
           VALUES (?, ?, ?)`,
          [raceId, checkpoint.checkpointName, checkpoint.checkpointOrder]
        );
      }
    }
  }

  if (data.marshals.length > 0) {
    for (const marshal of data.marshals) {
      if (marshal.marshalId) {
        // Update if marshalId exists
        await db.run(
          `UPDATE marshals 
           SET first_name = ?, last_name = ?
           WHERE marshal_id = ?`,
          [marshal.firstName, marshal.lastName, marshal.marshalId]
        );

        await removeRaceDetails({
          table: 'marshals',
          idColumn: 'marshal_id',
          raceId,
          updatedIds: data.marshals.filter(m => m.marshalId).map(m => m.marshalId),
        });
      } else {
        // Insert if marshalId is missing
        await db.run(
          `INSERT INTO marshals (race_id, first_name, last_name)
           VALUES (?, ?, ?)`,
           [raceId, marshal.firstName, marshal.lastName]
        );
      }
    }
  }

  if (data.participants.length > 0) {
    for (const participant of data.participants) {
      if (participant.participantId) {
        // Update existing participant
        await db.run(
          `UPDATE participants
           SET first_name = ?, last_name = ?
           WHERE participant_id = ?`,
          [participant.firstName, participant.lastName, participant.participantId]
        );

        await removeRaceDetails({
          table: 'participants',
          idColumn: 'participant_id',
          raceId,
          updatedIds: data.participants.filter(p => p.participantId).map(p => p.participantId),
        });
      } else {
        // Insert new participant
        await db.run(
          `INSERT INTO participants (race_id, first_name, last_name, bib_number)
           VALUES (?, ?, ?, COALESCE((SELECT MAX(bib_number) + 1 FROM participants WHERE race_id = ?), 1))`,
           [raceId, participant.firstName, participant.lastName, raceId]
        );
      }
    }
  }
}

async function removeRaceDetails({ table, idColumn, raceId, updatedIds }) {
  const updatedIdsAsIntegers = updatedIds.map(id => parseInt(id, 10));

  const existing = await db.all(
    `SELECT ${idColumn} FROM ${table} WHERE race_id = ?`,
    [raceId]
  );
  const existingIds = existing.map(row => row[idColumn]);
  const toDelete = existingIds.filter(id => !updatedIdsAsIntegers.includes(id));

  for (const id of toDelete) {
    await db.run(`DELETE FROM ${table} WHERE ${idColumn} = ?`, [id]);
  }
}
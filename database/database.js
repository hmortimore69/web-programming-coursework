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
        time_started as timeStarted,
        time_finished as timeFinished
        race_started as raceStarted
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

    return {
      raceId,
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
    console.error('Error fetching race data:', error);
    throw error;
  }
}

export async function createNewRace(req) {
  let newRaceID = null;

  if (req.raceDetails) {
    const raceName = req.raceDetails['#race-name'];

    const startDateString = req.raceDetails['#race-start-date'];
    const startDate = new Date(startDateString);
    const startTimestamp = startDate.getTime();

    const durationString = req.raceDetails['#race-duration'];
    const [hours, minutes] = durationString.split(':').map(Number);
    const durationMilliseconds = (hours * 3600 + minutes * 60) * 1000;
    const finishTimestamp = startTimestamp + durationMilliseconds;

    newRaceID = await new Promise((resolve, reject) => {
      DB_CONN.run(
        'INSERT INTO races (race_name, time_started, time_finished) VALUES (?, ?, ?)',
        [raceName, startTimestamp, finishTimestamp],
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
        [newRaceID, checkpoint['.checkpoint-name'], checkpoint['.checkpoint-order']],
      );
    }
  }

  if (req.marshalls.length > 0) {
    for (const marshall of req.marshalls) {
      DB_CONN.run(
        'INSERT INTO marshalls (race_id, first_name, last_name) VALUES (?, ?, ?)',
        [newRaceID, marshall['.marshall-first-name'], marshall['.marshall-last-name']],
      );
    }
  }

  if (req.participants.length > 0) {
    for (const participant of req.participants) {
      DB_CONN.run(
        `INSERT INTO participants (race_id, first_name, last_name, bib_number) 
         VALUES (?, ?, ?, COALESCE((SELECT MAX(bib_number) + 1 FROM participants WHERE race_id = ?), 1))`,
        [newRaceID, participant['.participant-first-name'], participant['.participant-last-name'], newRaceID]
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
    return true; // Return the number of rows deleted from the races table
  } catch (error) {
    console.error(`Error deleting race with ID ${raceId}:`, error.message);
    throw error;
  }
}

export async function updateStartTime(raceId, data) {
  updateRace('UPDATE table races time_started = ? WHERE race_id = ?', [data, raceId]);
}
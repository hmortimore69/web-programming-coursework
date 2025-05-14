import express from 'express';
import * as db from './database/database.js';
import * as url from 'url';

const app = express();
const port = 8080;
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

app.use(express.static(`${__dirname}/public`));
app.use('/static', express.static(`${__dirname}/static`));
app.use(express.json());

// API Endpoints
app.get('/api/races', getRaces);
app.get('/api/races/:id', getRace);
app.get('/api/races/:id/pending-participants', getPendingParticipants);
app.patch('/api/races/:raceId/participants/:userId', updateParticipantStatus);

app.post('/api/new-race', createRace);
app.delete('/api/delete-race', deleteRace);
app.patch('/api/update-race', updateRace);
app.post('/api/register-interest', registerInterest);
app.get('/api/conflicts', getConflicts);
app.post('/api/resolve-conflict', resolveConflict);
app.post('/api/reject-timestamp', rejectTimestamp);

// Endpoints
app.get('/', (req, res) => {
  res.redirect('/home');
});
app.get('/home', (req, res) => {
  res.sendFile(`${__dirname}/public/index.html`);
});
app.get('/race/:raceid', (req, res) => {
  res.sendFile(`${__dirname}/public/race/race.html`);
});

// Admin User Endpoints
app.get('/dashboard', (req, res) => {
  res.sendFile(`${__dirname}/public/dashboard/dashboard.html`);
});
app.get('/new-race', (req, res) => {
  res.sendFile(`${__dirname}/public/newRace/newRace.html`);
});

async function getRaces(req, res) {
  const { page = 1, pageSize = 10 } = req.query;

  const result = await db.getAllRaces(parseInt(page), parseInt(pageSize));

  if (result) {
    res.json(result);
  } else {
    res.status(404).send('No races found.');
  }
}

async function getRace(req, res) {
  const { page = 1, pageSize = 10 } = req.query;
  const result = await db.getRace(req.params.id, parseInt(page), parseInt(pageSize));

  if (result) {
    res.json(result);
  } else {
    res.status(404).send('No race found with that ID.');
  }
}

async function createRace(req, res) {
  try {
    const raceDetails = req.body;
    const newRaceId = await db.createNewRace(raceDetails);

    res.status(201).json({ message: 'Race created successfully', race_id: newRaceId });
  } catch (error) {
    console.error('Error creating race:', error);
  }
}

async function deleteRace(req, res) {
  try {
    const { raceId } = req.query;

    const result = await db.deleteRaceById(raceId);

    if (result) {
      res.status(200).send('Race deleted successfuly.');
    } else {
      res.status(404).send('No race found with that ID.');
    }
  } catch (error) {
    console.error('Error deleting race:', error);
  }
}

async function updateRace(req, res) {
  try {
    const { raceId, action, data, submittedBy } = req.body;

    const raceExists = await db.getRace(raceId);

    if (!raceExists) {
      return res.status(404).send('Race not found');    
    }

    switch (action) {
      case 'update-start-time':
        await db.updateStartTime(raceId, data);
        break;
      case 'update-finish-time':
        await db.updateFinishTime(raceId, data);
        break;
      case 'add-participants':
        await db.addParticipants(raceId, data);
        break;
      case 'submit-results':
        await db.submitResults(raceId, data, submittedBy);
        break;
      default:
        return res.status(400).send('Invalid action');
      }

      res.status(200).send({ message: 'Action completed successfully', action });
  } catch (error) {
    console.error('Error updating race:', error);
    throw error;
  }
}

async function getConflicts(req, res) {
  const conflicts = await db.getConflicts(req.query.raceId);
  res.json(conflicts);
}

async function resolveConflict(req, res) {
  const { raceId, bibNumber, time } = req.body;
  await db.resolveConflict(raceId, bibNumber, time);
  res.sendStatus(200);
}

async function rejectTimestamp(req, res) {
  const { raceId, bibNumber, time } = req.body;
  await db.rejectConflict(raceId, bibNumber, time);
  res.sendStatus(200);
}

async function registerInterest(req, res) {
  try {
    const { raceId, firstName, lastName } = req.body;
    
    await db.registerParticipantInterest(raceId, firstName, lastName);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving interest:', error);
    res.status(500).json({ error: 'Failed to register interest' });
  }
}

async function getPendingParticipants(req, res) {
  try {
    const participants = await db.getPendingParticipants(req.params.id);
    res.json(participants);
  } catch (error) {
    console.error('Error fetching pending participants:', error);
    res.status(500).json({ error: 'Failed to fetch pending participants' });
  }
}

async function updateParticipantStatus(req, res) {
  try {
    const { raceId, userId } = req.params;
    const { action } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const success = await db.updateParticipantStatus(raceId, userId, action);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to update participant status' });
    }
  } catch (error) {
    console.error('Error updating participant status:', error);
    res.status(500).json({ error: 'Failed to update participant status' });
  }
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

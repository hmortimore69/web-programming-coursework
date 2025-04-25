import express from "express";
import * as db from "./database/database.js";
import * as url from 'url';

const app = express();
const port = 8080;
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

app.use(express.static(`${__dirname}/public`));
app.use(express.json());

// API Endpoints
app.get('/api/races', getRaces);
app.get('/api/races/:id', getRace);
app.post('/api/new-race', createRace);
app.delete('/api/delete-race/:id', deleteRace);

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
})
app.get('/new-race', (req, res) => {
    res.sendFile(`${__dirname}/public/newRace/newRace.html`);
})

async function getRaces(req, res) {
    const { page = 1, pageSize = 10 } = req.query;

    const result = await db.getAllRaces(parseInt(page), parseInt(pageSize));

    if (result) {
        res.json(result);
    } else {
        res.status(404).send("No races found.");
    }
}

async function getRace(req, res) {
    const { page = 1, pageSize = 10 } = req.query;
    const result = await db.getRace(req.params.id, parseInt(page), parseInt(pageSize));
    
    if (result) {
        res.json(result);
    } else {
        res.status(404).send("No race found with that ID.");
    }
}

async function createRace(req, res) {
    try {
        const raceDetails = req.body;
        const newRaceId = await db.createNewRace(raceDetails);

        res.status(201).json({ message: "Race created successfully", race_id: newRaceId });
    } catch (error) {
        console.error("Error creating race:", error);
    }
}

async function deleteRace(req, res) {
    try {
        
    } catch (error) {
        console.error("Error deleting race:", error);
    }
}

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

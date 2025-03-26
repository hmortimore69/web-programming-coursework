import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import * as db from "./database/database.js";

const app = express();
const port = 8080;
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static("public"));
app.use(express.json());

// API Endpoints
app.get('/api/races', getRaces);
app.get('/api/races/:id', getRace);
app.post('/api/admin/new-race', createRace);

// Endpoints
app.get('/', (req, res) => {
    res.redirect('/home');
});
app.get('/home', (req, res) => {
    res.sendFile(join(__dirname, "public", "index.html"));
}); 
app.get('/race/:raceid', (req, res) => {
    res.sendFile(join(__dirname, "public", "race", "race.html"));
});

// Admin User Endpoints
app.get('/admin', (req, res) => {
    res.sendFile(join(__dirname, "public", "admin", "admin.html"));
})
app.get('/admin/new-race', (req, res) => {
    res.sendFile(join(__dirname, "public", "admin", "newRace", "newRace.html"));
})

async function getRaces(req, res) {
    res.json(await db.getLastTenRaces());
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
    db.createNewRace(req.body);
}

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

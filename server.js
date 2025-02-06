import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import * as db from "./database.js";

const app = express();
const port = 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getRaces(req, res) {
    res.json(await db.getLastTenRaces());
}

async function getRace(req, res) {
    const result = await db.getRace(req.params.id);

    if (result) {
        res.json(result);
    } else {
        res.status(404).send("No race found with that ID.");
    }
}

// Default to /home
app.get('/', (req, res) => {
    res.redirect(302, '/home');
});

app.get('/home', (req, res) => {
    res.sendFile(join(__dirname, "public", "index.html"));
});

app.use(express.static("public", { extensions: ['html'] }));

// API Requests
app.get('/api/races', getRaces);
app.get('/api/races/:id', getRace);
app.get('/race/:raceid', (req, res) => {
    res.sendFile(join(__dirname, "public", "race", "race.html"));
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});

import express from "express";
import * as db from './database.js';

const app = express();
const port = 8080;

async function getRaces(req, res) {
    res.json(await db.getAllRaces());
}

async function getRace(req, res) {
    const result = await db.getRace(req.params.id);

    if (result) {
        res.json(result);
    } else {
        res.status(404).send("No race found with that ID.");
    }
}

app.use(express.static("public"));

app.get('/races', getRaces);
app.get('/races/:id', getRace);

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
})
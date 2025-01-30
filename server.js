import express from "express";

import * as db from './database.js';

const app = express();
const port = 8080;

async function getRaces(req, res) {
    res.json(await db.getAllRaces());
}

app.use(express.static("public"));

app.get('/races', getRaces);

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
})
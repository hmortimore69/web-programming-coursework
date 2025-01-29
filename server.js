import express from "express";
import * as races from './routes/races.js';

const app = express();
const port = 8080;

app.use(express.static("public"));

app.get('/races', (req, res) => {
    res.json(races.getAllRaces());
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
})
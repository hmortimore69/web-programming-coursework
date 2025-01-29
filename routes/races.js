import { readFile, watch } from "fs/promises";

let races = {};

async function loadRaces() {
    try {
        const data = await readFile("./sampleData.json", "utf-8");

        races =  JSON.parse(data);
    } catch (error) {
        console.error("Error loading races:", error.message);
    }
}

await loadRaces();

export function getAllRaces() {
    return races;
}

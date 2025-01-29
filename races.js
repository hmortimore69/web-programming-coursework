import { readFile } from "fs/promises";

async function loadRaces() {
    try {
        const data = await readFile("./sampleData.json", "utf-8");

        return JSON.parse(data);
    } catch (error) {
        console.error("Error loading races:", error.message);
    }
}

let races = await loadRaces();

export function getAllRaces() {
    return races;
}

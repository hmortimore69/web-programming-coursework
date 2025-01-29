// Helper function to fetch races from the server
async function fetchRaces() {
    try {
        const response = await fetch("/races");

        if (!response.ok) {
            throw new Error(`Response Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) { 
        console.error("Failed to fetch races:", error.message);
        return {};
    }
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
}

function formatTime(timestamp) {
    return timestamp ? new Date(timestamp * 1000).toLocaleString() : "N/A";
}

function createRaceRow(raceID, race) {
    const { Started, Finished, Participants } = race;
    const participantList = Object.values(Participants);

    const finishTimes = participantList.map(p => p["Time Finished"]).filter(Boolean);
    const fastestFinish = finishTimes.length ? Math.min(...finishTimes) : null;
    const fastestDuration = fastestFinish ? fastestFinish - Started : null;

    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${raceID}</td>
        <td>${formatTime(Started)}</td>
        <td>${formatTime(Finished)}</td>
        <td>${fastestDuration !== null ? formatDuration(fastestDuration) : "N/A"}</td>
        <td>${participantList.length}</td>
    `;

    return row;
}

function populateRaceTable(races) {
    const tableBody = document.querySelector("#race-history-table tbody");
    tableBody.innerHTML = "";

    Object.entries(races).forEach(([raceID, race]) => {
        tableBody.appendChild(createRaceRow(raceID, race));
    });
}

document.addEventListener("DOMContentLoaded", async function () {
    const races = await fetchRaces();
    populateRaceTable(races);
});

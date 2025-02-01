async function fetchRaces() {
    try {
        const response = await fetch("/api/races");

        if (!response.ok) {
            throw new Error(`Response Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) { 
        console.error("Failed to fetch races:", error.message);
        return {};
    }
}

/*
Code taken and added onto from geeksforgeeks
https://www.geeksforgeeks.org/how-to-convert-seconds-to-time-string-format-hhmmss-using-javascript/#approach-2-calculating-the-hours-minutes-and-seconds-individually
*/
function formatDuration(seconds) {
    if (seconds === null) return "--";
    
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
}

function formatTime(timestamp) {
    return timestamp ? new Date(timestamp * 1000).toLocaleString() : "--";
}

function createRaceRow(raceID, race) {
    console.log(race);
    const { Started, Finished, Participants } = race;
    const participantList = Object.values(Participants);

    const finishTimes = participantList.map(p => p["Time Finished"]).filter(Boolean);
    const fastestFinish = finishTimes.length ? Math.min(...finishTimes) : null;
    const fastestDuration = fastestFinish ? fastestFinish - Started : null;

    const row = document.createElement("tr");
    row.dataset.raceidentifier = raceID;

    let liveIndicator = ""
    if (Finished * 1000 >= Date.now() && Started * 1000 <= Date.now()) {
        row.style.backgroundColor = "#ffcccc";
        row.style.color = "#900";
        row.style.fontWeight = "bold";
        liveIndicator = `<span class="live-indicator">LIVE</span>`;
    }

    row.innerHTML = `
        <td>${raceID} ${liveIndicator}</td>
        <td>${formatTime(Started)}</td>
        <td>${formatTime(Finished)}</td>
        <td>${participantList.length}</td>
        <td>${formatDuration(fastestDuration)}</td>
    `;

    return row;
}

function populateRaceTable(races) {
    const tableBody = document.querySelector("#race-history-table tbody");

    if (races && Object.keys(races).length > 0) {
        tableBody.innerHTML = "";

        Object.entries(races).forEach(([raceID, race]) => {
            tableBody.appendChild(createRaceRow(raceID, race));
        });
    } else {
        tableBody.innerHTML = `<td style="cursor: auto;" colspan=5>No race data to display.</td>`;
    }
}

async function registerServiceWorker() {
    if (navigator.serviceWorker) {
        await navigator.serviceWorker.register('sw.js');
    }
}

window.addEventListener('load', registerServiceWorker);

document.addEventListener("DOMContentLoaded", async function() {
    const raceTable = document.querySelector("#race-history-table tbody");
    
    const races = await fetchRaces();
    console.log(races);
    populateRaceTable(races);

    raceTable.addEventListener("click", function(e) {
        let row = e.target.closest("tr");

        console.log(row, row.dataset.raceidentifier);
        if (row && row.dataset.raceidentifier) {
            let raceId = row.dataset.raceidentifier;
            window.location.href = `/race/${raceId}`;
        }
    });
});

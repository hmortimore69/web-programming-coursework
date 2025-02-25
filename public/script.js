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

function createRaceRow(raceID, race) {
    const { time_started, time_finished, participants } = race;
    const row = document.createElement("tr");
    row.dataset.raceidentifier = raceID;

    let liveIndicator = ""
    if (time_finished * 1000 >= Date.now() && time_started * 1000 <= Date.now()) {
        row.style.backgroundColor = "#ffcccc";
        row.style.color = "#900";
        row.style.fontWeight = "bold";
        liveIndicator = `<span class="live-indicator">LIVE</span>`;
    }

    row.innerHTML = `
        <td>${formatUnixTimestamp(time_started)} ${liveIndicator}</td>
        <td>${formatUnixTimestamp(time_finished)}</td>
        <td>${participants}</td>
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

// 
function formatUnixTimestamp(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    const day = date.getDate();
    const suffix = (day % 10 === 1 && day !== 11) ? 'st' :
                   (day % 10 === 2 && day !== 12) ? 'nd' :
                   (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
    const formattedDate = date.toLocaleDateString('en-UK', { weekday: 'long' }) + ' ' + day + suffix;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${formattedDate} ${hours}:${minutes}`;
}

// async function registerServiceWorker() {
//     if (navigator.serviceWorker) {
//         await navigator.serviceWorker.register('sw.js');
//     }
// }

// window.addEventListener('load', registerServiceWorker);

document.addEventListener("DOMContentLoaded", async function() {
    const raceTable = document.querySelector("#race-history-table tbody");
    const races = await fetchRaces();

    populateRaceTable(races);

    raceTable.addEventListener("click", function(e) {
        let row = e.target.closest("tr");

        if (row && row.dataset.raceidentifier) {
            let raceId = row.dataset.raceidentifier;
            window.location.href = `/race/${raceId}`;
        }
    });
});

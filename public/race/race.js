async function fetchRaceData() {
    try {
        const raceID = getRaceID();
        const response = await fetch(`/api/races/${raceID}`);

        if (!response.ok) throw new Error(`Response Status: ${response.status}`);

        const raceData = await response.json();

        renderRaceTable(raceData);
    } catch (error) {
        console.error("Error fetching race data:", error);
    }
}

function getRaceID() {
    const url = new URL(window.location.href);
    const args = url.pathname.split("/").filter(Boolean);

    return args[args.length - 1];
}

function renderRaceTable(raceData) {
    const section = document.getElementById("race-info-section");
    let liveIndicator = "";

    section.innerHTML = `
        <h2>Race Details</h2>
        <p><strong>Start Time:</strong> ${formatDate(raceData.time_started)}</p>
        <p><strong>Finish Time:</strong> ${formatDate(raceData.time_finished, "Ongoing")}</p>
        <h3>Participants</h3>
        <div class="race-table-container" id="race-container"></div>
    `;

    if (raceData.time_finished * 1000 >= Date.now() && raceData.time_started * 1000 <= Date.now()) {
        liveIndicator = `<span class="live-indicator">LIVE</span>`;
    }

    document.getElementById("race-tracker-header").innerHTML = `PJC Race Tracker ${liveIndicator}`;

    const container = document.getElementById("race-container");
    container.innerHTML = generateRaceTable(raceData);
}

function generateRaceTable(raceData) {
    const checkpoints = getUniqueSortedCheckpoints(raceData.participants);
    let tableHTML = `
        <table class="race-table" id="race-info-table" border="1">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Bib Number</th>
                    <th>Attended</th>
                    ${checkpoints.map(cp => `<th>${cp.name}</th>`).join("")}
                    <th>Finish</th>
                </tr>
            </thead>
            <tbody>
                ${raceData.participants.map(p => generateParticipantRow(p, raceData.time_started, checkpoints)).join("")}
            </tbody>
        </table>`;

    return tableHTML;
}

function generateParticipantRow(participant, raceStart, checkpoints) {
    let previousTime = raceStart;

    return `
        <tr>
            <td>${participant.id}</td>
            <td>${participant.name}</td>
            <td>${participant.bib}</td>
            <td>${participant.attended ? 'Y' : 'N'}</td>
            ${checkpoints.map(checkpoint => {
                const cpTime = participant.checkpoints.find(cp => cp.checkpoint_id === checkpoint.checkpoint_id);
                const formattedTime = formatCheckpointTime(cpTime, previousTime, raceStart);

                if (cpTime && cpTime.time_finished !== null) {
                    previousTime = cpTime.time_finished;
                }

                return `<td>${formattedTime}</td>`;
            }).join("")}
            <td>${participant.time_finished ? formatCheckpointTime(participant, previousTime, raceStart) : "—"}</td>
        </tr>`;
}

function formatCheckpointTime(cpTime, previousTime, raceStart) {
    if (!cpTime || cpTime.time_finished === null) return "—";

    const timeDiffInSeconds = cpTime.time_finished - raceStart;
    const timefromPrevCheckpoint = cpTime.time_finished - previousTime;

    return `+${formatTime(timefromPrevCheckpoint)} (${formatTime(timeDiffInSeconds)})`;
}

function getUniqueSortedCheckpoints(participants) {
    const uniqueCheckpoints = [];

    participants.forEach(({ checkpoints }) => {
        checkpoints.forEach(cp => {
            if (!uniqueCheckpoints.some(c => c.checkpoint_id === cp.checkpoint_id)) {
                uniqueCheckpoints.push(cp);
            }
        });
    });

    return uniqueCheckpoints.sort((a, b) => a.order - b.order);
}


function formatDate(timestamp, defaultText = "Unknown") {
    return timestamp ? new Date(timestamp * 1000).toLocaleString() : defaultText;
}

function formatTime(timeDiffInSeconds) {
    const hours = Math.floor(timeDiffInSeconds / 3600);
    const minutes = Math.floor((timeDiffInSeconds % 3600) / 60);
    const seconds = timeDiffInSeconds % 60;

    return `${hours > 0 ? hours + ':' : ''}${minutes < 10 && hours > 0 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}

document.addEventListener("DOMContentLoaded", () => {
    fetchRaceData();
    setInterval(fetchRaceData, 10000);
});
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
    const raceStartTimeElement = document.querySelector("#race-start-time");
    const raceFinishTimeElement = document.querySelector("#race-finish-time");

    let liveIndicator = "";

    raceStartTimeElement.textContent = `${formatDate(raceData.time_finished)}`;
    raceFinishTimeElement.textContent = `${formatDate(raceData.time_finished, "Ongoing")}`;

    if (raceData.time_finished * 1000 >= Date.now() && raceData.time_started * 1000 <= Date.now()) {
        liveIndicator = `<span class="live-indicator">LIVE</span>`;
    }

    document.querySelector("#race-tracker-header").innerHTML = `PJC Race Tracker ${liveIndicator}`;

    generateTableBody(raceData);
}

/*
 * Input: raceData: JSON
 * Return: None
 * This function generates the tbody's rows for each participant that took part in the race.
 */
function generateTableBody(raceData) {
    const raceCheckpointCounterElement = document.querySelector("#race-checkpoint-counter");
    const checkpoints = getUniqueSortedCheckpoints(raceData.participants);
    const tableBody = document.querySelector(".race-table-container tbody");

    raceCheckpointCounterElement.textContent = `${checkpoints.length}`

    tableBody.innerHTML = `${raceData.participants.map(p => 
        fillParticipantRow(p, raceData.time_started, checkpoints)
    ).join("")}`;
}

/*
 * Input: participant: JSON Object, raceStart: Integer, checkpoints: JSON Object
 * Return: HTML element
 * This function generates the content for each row made in generateTableBody. It fills the details for each participant.
 */
function fillParticipantRow(participant, raceStart, checkpoints) {
    if (!participant.attended) return "";

    let previousTime = raceStart;

    const tableRow = `
        <tr>
            <td colspan="3">
                <details>
                    <summary>
                        <table class="inner-participant-table">
                            <tr class="inner-participant-table">
                                <td>${participant.name}</td>
                                <td>${participant.bib}</td>
                                <td>${participant.time_finished ? formatTime(participant.time_finished - raceStart) : "--"}</td>
                            </tr>
                        </table>
                    </summary>
                    <div class="details-contents-wrapper">
                        <table class="inner-checkpoint-table">
                            <tr>
                                <th>Checkpoint</th>
                                <th>Time</th>
                            </tr>
                            ${checkpoints.map(checkpoint => {
                                const cpTime = participant.checkpoints.find(cp => cp.checkpoint_id === checkpoint.checkpoint_id);
                                const formattedTime = formatCheckpointTime(cpTime, previousTime, raceStart);
                                
                                if (cpTime && cpTime.time_finished !== null) {
                                    previousTime = cpTime.time_finished;
                                }

                                return `
                                    <tr>
                                        <td>${checkpoint.name}</td>
                                        <td>${formattedTime}</td>
                                    </tr>`;
                            }).join("")}
                        </table>
                    </div>
                </details>
            </td>
        </tr>`;

    return tableRow;
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

function formatCheckpointTime(participant, previousTime, raceStart) {
    if (!participant || participant.time_finished === null) return "--";

    const timeDiffInSeconds = participant.time_finished - raceStart;
    const timefromPrevCheckpoint = participant.time_finished - previousTime;

    return `+${formatTime(timefromPrevCheckpoint)} (${formatTime(timeDiffInSeconds)})`;
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
});

document.querySelector("#refresh-stats-btn").addEventListener("click", function() {
    console.log("Refreshing Stats");
    fetchRaceData();
});
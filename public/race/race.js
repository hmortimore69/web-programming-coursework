// pagination global, <--- figure out how to not use global variable
let currentPage = 1;

async function fetchRaceData(page = 1) {
    let pageSize = 10;
    
    try {
        const raceID = getRaceID();
        const response = await fetch(`/api/races/${raceID}?page=${page}&pageSize=${pageSize}`);

        if (!response.ok) throw new Error(`Response Status: ${response.status}`);

        const raceData = await response.json();
        console.log(raceData);

        renderRaceTable(raceData);
        updatePaginationControls(raceData.pagination);
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
    const checkpointCountElement = document.querySelector("#race-checkpoint-counter");
    const tableBody = document.querySelector(".race-table tbody");
    
    raceStartTimeElement.textContent = formatDate(raceData.timeStarted);
    raceFinishTimeElement.textContent = formatDate(raceData.timeFinished);
    checkpointCountElement.textContent = raceData.totalCheckpoints;

    let liveIndicator = "";
    if (raceData.timeFinished * 1000 >= Date.now() && raceData.timeStarted * 1000 <= Date.now()) {
        liveIndicator = `<span class="live-indicator">LIVE</span>`;
        document.querySelector("#race-tracker-header").innerHTML = `Race Dsetails ${liveIndicator}`;
    }

    tableBody.innerHTML = raceData.participants.map(participant => `
        <tr>
            <td>${participant.bibNumber}</td>
            <td>${participant.firstName} ${participant.lastName}</td>
            <td>${formatTime(participant.timeFinished - raceData.timeStarted) || "--"}</td>
        </tr>`).join("");
}

/*
 *  INPUT: participants: Array
 *  RETURN: uniqueCheckpoints: Array
 *  This function returns each unique checkpoint and sorts them in order.
 */
function getUniqueSortedCheckpoints(participants) {
    const uniqueCheckpoints = [];

    for (const participant of participants) {
        for (const cp of participant.checkpoints) {
            if (!uniqueCheckpoints.some(c => c.checkpointId === cp.checkpointId)) {
                uniqueCheckpoints.push(cp);
            }
        }
    }

    return uniqueCheckpoints.sort((a, b) => a.order - b.order);
}

function formatDate(timestamp, defaultText = "Unknown") {
    return timestamp ? new Date(timestamp * 1000).toLocaleString() : defaultText;
}

function formatTime(timeDiffInSeconds) {
    if (timeDiffInSeconds < 0) return null;

    const hours = Math.floor(timeDiffInSeconds / 3600);
    const minutes = Math.floor((timeDiffInSeconds % 3600) / 60);
    const seconds = timeDiffInSeconds % 60;

    return `${hours > 0 ? hours + ':' : ''}${minutes < 10 && hours > 0 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}

function updatePaginationControls(pagination) {
    const prevButton = document.querySelector("#prev-page");
    const nextButton = document.querySelector("#next-page");
    const pageInfo = document.querySelector("#page-info");

    pageInfo.textContent = `Page ${pagination.page} of ${pagination.totalPages}`;

    prevButton.disabled = pagination.page === 1;
    nextButton.disabled = pagination.page === pagination.totalPages;
}

document.querySelector("#prev-page").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        fetchRaceData(currentPage);
    }
});

document.querySelector("#next-page").addEventListener("click", () => {
    currentPage++;
    fetchRaceData(currentPage);
});


document.addEventListener("DOMContentLoaded", () => {
    fetchRaceData();
});

document.querySelector("#refresh-stats-button").addEventListener("click", function() {
    console.log("Refreshing Stats");
    fetchRaceData();
});

/*  ===============
 *     GRAVEYARD
 *  ===============
 * 
 *  ${checkpoints.map(checkpoint => {
 *      const cpTime = participant.checkpoints.find(cp => cp.checkpointId === checkpoint.checkpointId);
 *      const formattedTime = formatCheckpointTime(cpTime, previousTime, raceStart);
 *      
 *      if (cpTime && cpTime.timeFinished !== null) {
 *          previousTime = cpTime.timeFinished;
 *  
 *      return `
 *          <tr>
 *              <td>${checkpoint.name}</td>
 *              <td>${formattedTime}</td>
 *          </tr>`;
 *  }).join("")}
 * 
 *  function formatCheckpointTime(participant, previousTime, raceStart) {
 *      if (!participant || participant.timeFinished === null) return "--";
 *
 *      const timeDiffInSeconds = participant.timeFinished - raceStart;
 *      const timefromPrevCheckpoint = participant.timeFinished - previousTime;
 *
 *      return `+${formatTime(timefromPrevCheckpoint)} (${formatTime(timeDiffInSeconds)})`;
 *  }
 */

function formatTime(timeDiffInSeconds) {
    const hours = Math.floor(timeDiffInSeconds / 3600);
    const minutes = Math.floor((timeDiffInSeconds % 3600) / 60);
    const seconds = timeDiffInSeconds % 60;

    return `${hours > 0 ? hours + ':' : ''}${minutes < 10 && hours > 0 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}

async function fetchRaceData() {
    const url = new URL(window.location.href);
    const args = url.pathname.split("/").filter(Boolean);
    const raceID = args[args.length - 1];

    try {
        const response = await fetch(`/api/races/${raceID}`);
        
        if (!response.ok) {
            throw new Error(`Response Status: ${response.status}`);
        }

        let raceData = await response.json();

        renderRaceTable(raceData); 
    
    } catch (error) {
        console.error(error.message);
    }
}

function renderRaceTable(raceData) {
    const section = document.getElementById("race-info-section");
    const startTime = raceData.started ? new Date(raceData.started * 1000).toLocaleString() : "Unknown";
    const finishTime = raceData.finished ? new Date(raceData.finished * 1000).toLocaleString() : "Ongoing";

    section.innerHTML = `
        <h2>Race Details</h2>
        <p><strong>Start Time:</strong> ${startTime}</p>
        <p><strong>Finish Time:</strong> ${finishTime}</p>
        
        <h3>Participants</h3>
        <div class="race-table-container" id="race-container"></div>
    `;

    const container = document.getElementById("race-container");
    container.innerHTML = "";

    let checkpoints = [];
    raceData.participants.forEach(participant => {
        participant.Checkpoints.forEach(cp => {
            if (!checkpoints.some(c => c.checkpoint_id === cp.checkpoint_id)) {
                checkpoints.push(cp);
            }
        });
    });

    checkpoints.sort((a, b) => a.order - b.order);



    let tableHTML = `
        <table class="race-table" id="race-info-table" border="1">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Bib Number</th>
                    <th>Attended</th>`;

    if (checkpoints.length > 0) {
        checkpoints.forEach(checkpoint => {
            tableHTML += `<th>${checkpoint.name}</th>`;
        });
    }

    tableHTML += `<th>Finish</th></tr></thead><tbody>`;

    raceData.participants.forEach(participant => {
        tableHTML += `
            <tr>
                <td>${participant.ID}</td>
                <td>${participant.Name}</td>
                <td>${participant["Bib Number"]}</td>
                <td>${participant.Attended ? 'Y' : 'N'}</td>`
    
        if (checkpoints.length > 0) {
            let previousTime = raceData.started; 
            checkpoints.forEach(checkpoint => {
                const cpTime = participant.Checkpoints.find(cp => cp.checkpoint_id === checkpoint.checkpoint_id);
    
                let timeDifference = "—"; 
                if (cpTime && cpTime.time_finished !== null) {
                    const timeDiffInSeconds = cpTime.time_finished - raceData.started;
                    const timefromPrevCheckpoint = cpTime.time_finished - previousTime;
    
                    timeDifference = `+${formatTime(timefromPrevCheckpoint)} (${formatTime(timeDiffInSeconds)})`;
                
                    previousTime = cpTime.time_finished;
                }
    
                tableHTML += `<td>${timeDifference}</td>`;
            });
        }
    
        tableHTML += `<td>${participant["Time Finished"] ? new Date(participant["Time Finished"] * 1000).toLocaleTimeString() : "—"}</td></tr>`;
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
}

document.addEventListener("DOMContentLoaded", function() {
    fetchRaceData();
});

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
        console.log("Fetched race data:", raceData);

        renderRaceTable(raceData); // Call function to render table
    
    } catch(error) {
        console.error(error.message);
    }
}

function renderRaceTable(raceData) {
    const container = document.getElementById("race-container");
    container.innerHTML = ""; // Clear previous content

    // Convert timestamps to readable format
    const startTime = new Date(raceData.Started * 1000).toLocaleString();
    const finishTime = new Date(raceData.Finished * 1000).toLocaleString();

    // Create the table
    let tableHTML = `
        <h2>Race Details</h2>
        <p><strong>Start Time:</strong> ${startTime}</p>
        <p><strong>Finish Time:</strong> ${finishTime}</p>
        
        <h3>Participants</h3>
        <table border="1">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Bib Number</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Add participants to the table
    raceData.Participants.forEach(participant => {
        tableHTML += `
            <tr>
                <td>${participant.ID}</td>
                <td>${participant.Name}</td>
                <td>${participant["Bib Number"]}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML; // Inject table into the page
}

document.addEventListener("DOMContentLoaded", function() {
    fetchRaceData();
});

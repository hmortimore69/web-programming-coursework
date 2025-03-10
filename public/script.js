/**
 * Fetches race data from the api endpoint.
 * @returns {Promise<Object>} A promise that will resolve to a race data object.
 */
async function fetchRaces() {
  try {
    const response = await fetch("/api/races");

    if (!response.ok) {
      throw new Error(`Response Status: ${response.status}`);
    }

    console.log(await response.json());

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch races:", error.message);
    return {};
  }
}

/**
 * Creates a table row (tr) element for a given race using the given HTML template.
 * @param {Number} raceId - The unique identifier for the race.
 * @param {Object} race - The race JSON object containing details.
 * @returns {HTMLElement} The generated table row (tr) element.
 */

function createRaceRow(raceId, race) {
  const { timeStarted, timeFinished, participants } = race;
  const template = document.querySelector("#race-row-template");
  const row = template.content.cloneNode(true).querySelector("tr");

  row.dataset.raceIdentifier = raceId;
  row.querySelector(".start-time").textContent = formatUnixTimestamp(timeStarted);
  row.querySelector(".end-time").textContent = formatUnixTimestamp(timeFinished);
  row.querySelector(".participants").textContent = participants;

  if (timeFinished * 1000 >= Date.now() && timeStarted * 1000 <= Date.now()) {
    const liveIndicatorTemplate = document.querySelector("#live-indicator-template");
    const liveIndicator = liveIndicatorTemplate.content.cloneNode(true);
    row.querySelector(".live-indicator-container").appendChild(liveIndicator);
  }

  return row;
}

function populateRaceTable(races) {
  const tableBody = document.querySelector("#race-history-table tbody");
  tableBody.innerHTML = "";

  if (races && Object.keys(races).length > 0) {
    for (const [raceId, race] in Object.entries(races)) {
      tableBody.appendChild(createRaceRow(raceId, race));
    }
  }
}

function formatUnixTimestamp(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000);
  const day = date.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? "st" 
    : day % 10 === 2 && day !== 12 ? "nd" 
      : day % 10 === 3 && day !== 13 ? "rd" 
        : "th";
  const formattedDate = date.toLocaleDateString("en-UK", { weekday: "long" }) + " " + day + suffix;
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${formattedDate} ${hours}:${minutes}`;
}

document.addEventListener("DOMContentLoaded", async function () {
  const raceTable = document.querySelector("#race-history-table tbody");
  const races = await fetchRaces();

  populateRaceTable(races);

  raceTable.addEventListener("click", function (e) {
    const row = e.target.closest("tr");

    if (row && row.dataset.raceIdentifier) {
      const raceId = row.dataset.raceIdentifier;
      window.location.href = `/race/${raceId}`;
    }
  });
});

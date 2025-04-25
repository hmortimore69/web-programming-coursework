document.addEventListener("DOMContentLoaded", async function () {
  const raceTable = document.querySelector("#race-history-table tbody");
  fetchRaces();

  raceTable.addEventListener("click", function (e) {
    const row = e.target.closest("tr");

    if (row && row.dataset.raceIdentifier) {
      const raceId = row.dataset.raceIdentifier;
      window.location.href = `/race/${raceId}`;
    }
  });
});

/**
 * Fetches race data from the api endpoint.
 * @returns {Promise<JSON>} A promise that will resolve to a race data object.
 */
async function fetchRaces(page = 1) {
  const pageSize = 10;

  try {
    const response = await fetch(`/api/races?page=${page}&pageSize=${pageSize}`);

    if (!response.ok) {
      throw new Error(`Response Status: ${response.status}`);
    }

    const raceData = await response.json();

    populateRaceTable(raceData);
    updatePaginationControls(raceData.pagination);

    return raceData;
  } catch (error) {
    console.error("Failed to fetch races:", error.message);
    return {};
  }
}

/**
 * Populates the race history table with the race data.
 * @param {JSON} races - The race JSON, where keys are race IDs.
 */
function populateRaceTable(races) {
  const tableBody = document.querySelector("#race-history-table tbody");
  tableBody.innerHTML = "";

  // Creates a row in the table for each race using a template
  if (races && Object.keys(races).length > 0) {
    for (const [raceId, race] of Object.entries(races)) {
      if (raceId === "pagination") continue; 
      tableBody.appendChild(createRaceRow(raceId, race));
    }
  }
}

/**
 * Creates a table row (tr) element for a given race using the given HTML template.
 * @param {Number} raceId - The unique identifier for the race.
 * @param {JSON} race - The race JSON object containing details.
 * @returns {HTMLElement} The generated table row (tr) element.
 */
function createRaceRow(raceId, race) {
  console.log(race);
  const { timeStarted, timeFinished, participants } = race;
  const template = document.querySelector("#race-row-template");
  const row = template.content.cloneNode(true).querySelector("tr");

  row.dataset.raceIdentifier = raceId;
  row.querySelector(".start-time").textContent = formatUnixTimestamp(timeStarted);
  row.querySelector(".end-time").textContent = formatUnixTimestamp(timeFinished);
  row.querySelector(".participants").textContent = participants;

  if (timeFinished >= Date.now() && timeStarted <= Date.now()) {
    row.classList.add("live-race");
  }

  return row;
}

/**
 * This function converts a timestamp in to a formatted datetime string.
 * @param {number} timestamp - The timestamp in miliseconds.
 * @returns {string} The formatted datetime string.
 */
function formatUnixTimestamp(timestamp) {
  const date = new Date(timestamp);
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";
  const month = date.toLocaleDateString("en-UK", { month: "short" });
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day}${suffix} ${month} ${year} ${hours}:${minutes}`;
}

/**
 * Updates pagination buttons and page information.
 * @param {Object} pagination - Pagination details object.
 */
function updatePaginationControls(pagination) {
  const prevButton = document.querySelector('#prev-page');
  const nextButton = document.querySelector('#next-page');
  const pageInfo = document.querySelector('#page-info');

  if (pagination.totalPages === 0) pagination.page = 0;

  pageInfo.textContent = `Page ${pagination.page} of ${pagination.totalPages}`;

  prevButton.disabled = pagination.page <= 1;
  nextButton.disabled = pagination.page === pagination.totalPages;

  prevButton.dataset.page = pagination.page - 1;
  nextButton.dataset.page = pagination.page + 1;
}

document.querySelector('#prev-page').addEventListener('click', (event) => {
  const page = Number(event.target.dataset.page);
  if (page > 0) fetchRaces(page);
});

document.querySelector('#next-page').addEventListener('click', (event) => {
  const page = Number(event.target.dataset.page);
  fetchRaces(page);
});
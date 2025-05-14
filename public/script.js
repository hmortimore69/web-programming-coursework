/**
 * Main entry point for the application.
 * Initializes the service worker, sets up event listeners, and fetches initial race data.
 * @function
 * @returns {void}
 */
function main() {
  registerServiceWorker();
  
  const raceTable = document.querySelector('#race-history-table tbody');

  fetchRaces();

  raceTable.addEventListener('click', function (e) {
    const row = e.target.closest('tr');

    if (row && row.dataset.raceIdentifier) {
      const raceId = row.dataset.raceIdentifier;
      window.location.href = `/race/${raceId}`;
    }
  });
}

/**
 * Fetches race data from the API endpoint with pagination support.
 * @async
 * @function
 * @param {number} [page=1] - The page number to fetch (defaults to 1).
 * @returns {Promise<Object>} A promise that resolves to an object containing race data and pagination information.
 */
async function fetchRaces(page = 1) {
  const pageSize = 10;

  try {
    const response = await fetch(`/api/races?page=${page}&pageSize=${pageSize}`);

    if (!response.ok) {
      throw new Error(`Response Status: ${response.status}`);
    }

    const raceDetails = await response.json();

    populateRaceTable(raceDetails);
    updatePaginationControls(raceDetails.pagination);

    return raceDetails;
  } catch (error) {
    console.error('Failed to fetch races:', error.message);
    return {};
  }
}

/**
 * Populates the race history table with the provided race data.
 * @function
 * @param {Object} races - The race data object where keys are race IDs and values are race details.
 * @returns {void}
 */
function populateRaceTable(races) {
  const tableBody = document.querySelector('#race-history-table tbody');
  tableBody.innerHTML = '';

  // Creates a row in the table for each race using a template
  if (races && Object.keys(races).length > 0) {
    for (const [raceId, race] of Object.entries(races)) {
      if (raceId === 'pagination') continue;
      tableBody.appendChild(createRaceRow(raceId, race));
    }
  }
}

/**
 * Creates a table row element for a given race using an HTML template.
 * @function
 * @param {string} raceId - The unique identifier for the race.
 * @param {Object} race - The race object containing details.
 * @param {number} race.timeStarted - The timestamp when the race actually started.
 * @param {string} race.raceLocation - The location of the race.
 * @param {number} race.timeFinished - The timestamp when the race finished.
 * @param {number} race.scheduledStartTime - The scheduled start time of the race.
 * @param {number} race.scheduledDuration - The scheduled duration of the race.
 * @param {number} race.participants - The number of participants in the race.
 * @returns {HTMLTableRowElement} The generated table row element.
 */
function createRaceRow(raceId, race) {
  const { timeStarted, raceLocation, timeFinished, scheduledStartTime, scheduledDuration, participants } = race;
  const template = document.querySelector("#race-row-template");
  const row = template.content.cloneNode(true).querySelector("tr");

  row.dataset.raceIdentifier = raceId;

  // Display times - show actual if available, otherwise show scheduled
  const displayStartTime = timeStarted || scheduledStartTime;
  
  row.querySelector(".start-time").textContent = formatUnixTimestamp(displayStartTime);
  row.querySelector(".location").textContent = raceLocation;
  row.querySelector(".participants").textContent = participants;

  // Update race status 
  const now = Date.now();
  const isLive = (timeStarted && timeStarted <= now && (!timeFinished || timeFinished >= now));

  if (isLive) {
    row.classList.add("live-race");
    row.dataset.raceStatus = "live";
  } else if (!timeStarted && scheduledStartTime <= now) {
    row.dataset.raceStatus = "ready-to-start";
  } else if (timeFinished && timeFinished < now) {
    row.dataset.raceStatus = "finished";
  }

  return row;
}

/**
 * Converts a Unix timestamp into a formatted datetime string.
 * @function
 * @param {number} timestamp - The timestamp in milliseconds.
 * @returns {string} The formatted datetime string or 'Not started' if timestamp is erroneous.
 */
function formatUnixTimestamp(timestamp) {
  if (!timestamp) return 'Not started';

  const date = new Date(timestamp);
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th';
  const month = date.toLocaleDateString('en-UK', { month: 'short' });
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day}${suffix} ${month} ${year} ${hours}:${minutes}`;
}

/**
 * Updates the pagination controls based on the current pagination state.
 * @function
 * @param {Object} pagination - Pagination details object.
 * @param {number} pagination.page - Current page number.
 * @param {number} pagination.totalPages - Total number of pages available.
 * @returns {void}
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

/**
 * Registers the service worker for the application.
 * @async
 * @function
 */
async function registerServiceWorker() {
  if (navigator.serviceWorker) {
    await navigator.serviceWorker.register('./sw.js');
  }
}

// Event Listeners

/**
 * DOMContentLoaded event listener that calls the main function.
 * @event
 */
document.addEventListener('DOMContentLoaded', main);

/**
 * Change event listener for the role selector dropdown.
 * @event
 */
document.querySelector('#role-selector')?.addEventListener('change', (e) => {
  userType.setRole(e.target.value);
});

/**
 * Click event listener for the previous page button.
 * @event
 */
document.querySelector('#prev-page').addEventListener('click', (event) => {
  const page = Number(event.target.dataset.page);
  if (page > 0) fetchRaces(page);
});

/**
 * Click event listener for the next page button.
 * @event
 */
document.querySelector('#next-page').addEventListener('click', (event) => {
  const page = Number(event.target.dataset.page);
  fetchRaces(page);
});

/**
 * Click event listener for the clear storage button.
 * @event
 */
document.querySelector('#clear-storage')?.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all localStorage data?')) {
    localStorage.clear();
    window.location.reload();
  }
});
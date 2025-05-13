let currentPage = 1;

/**
 * Fetches race data from the API endpoint and updates the UI table and race details.
 * If a race is offline, it will check whether there is a cached version of the race and use it.
 * @param {number} page - The current page number for pagination (default: 1).
 */
async function fetchRaceData(page = 1) {
  const pageSize = 10;

  try {
    const raceID = getRaceID();
    const response = await fetch(`/api/races/${raceID}?page=${page}&pageSize=${pageSize}`);

    if (!response.ok) throw new Error(`Response Status: ${response.status}`);

    const raceDetails = await response.json();

    currentPage = page;
    
    // Clear previously saved race data and store current race for offline use
    localStorage.removeItem('storedRace');
    localStorage.setItem('storedRace', JSON.stringify(raceDetails));

    updateRaceDetails(raceDetails);
    renderRaceTable(raceDetails);
    updatePaginationControls(raceDetails.pagination);
  } catch (error) {
    console.error('Error fetching race data:', error);

    if (hasOfflineRaceData()) {
      const offlineData = localStorage.getItem('storedRace');
      const parsedData = JSON.parse(offlineData);

      updateRaceDetails(parsedData.raceDetails);
      renderRaceTable(parsedData.raceDetails);
      updatePaginationControls(parsedData.raceDetails.pagination);
    }
  }
}

/**
 * Retrieves the race ID from the URL.
 * @returns {string} The race ID from the current URL.
 */
function getRaceID() {
  const url = new URL(window.location.href);
  const args = url.pathname.split('/').filter(Boolean);

  return args[args.length - 1];
}

/**
 * Updates all race detail elements
 * @param {Object} raceDetails - The race data object
 */
function updateRaceDetails(raceDetails) {
  document.querySelector('#race-start-time').textContent = formatDate(raceDetails.timeStarted);
  document.querySelector('#race-location').textContent = raceDetails.raceLocation || 'N/A';
  document.querySelector('#race-checkpoint-counter').textContent = raceDetails.totalCheckpoints || 0;
  document.querySelector('#participant-count').textContent = raceDetails.pagination?.total || 0;

  // Update live indicator if race is active
  if (raceDetails.timeFinished >= Date.now() && raceDetails.timeStarted <= Date.now()) {
    const liveTemplate = document.querySelector('#live-indicator-template').content.cloneNode(true);
    const raceHeader = document.querySelector('#race-title');
    raceHeader.appendChild(liveTemplate);
  }
}

/**
 * Renders the race table using row templates.
 * @param {Object} raceDetails - The race data object retrieved from the API endpoint.
 */
function renderRaceTable(raceDetails) {
  const tableBody = document.querySelector('.race-table tbody');

  tableBody.innerHTML = '';

  for (const participant of raceDetails.participants) {
    const row = document.querySelector('#participant-row-template').content.cloneNode(true);
    row.querySelector('.bib-number').textContent = participant.bibNumber;
    row.querySelector('.participant-name').textContent = `${participant.firstName} ${participant.lastName}`;

    const finishTimeCell = row.querySelector('.finish-time');
    
    if (participant.timeFinished) {
      finishTimeCell.textContent = formatRacerTime((participant.timeFinished));
    } else {
      finishTimeCell.textContent = 'Pending';
    }
    tableBody.appendChild(row);
  }
}

/**
 * Formats a Unix timestamp into a readable date string.
 * @param {number} timestamp - The Unix timestamp to format.
 * @param {string} [defaultText="N/A"] - Default text if timestamp is missing.
 * @returns {string} Formatted date string.
 */
function formatDate(timestamp, defaultText = 'Not Started') {
  if (!timestamp) return defaultText;
  
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formats time difference in seconds into a human-readable format (hh:mm:ss or mm:ss).
 * @param {number} timeDiffInSeconds - Time difference in seconds.
 * @returns {string|null} Formatted time string or null if invalid.
 */
function formatRacerTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msRemain = ms % 1000;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${msRemain.toString().padStart(3, '0')}`;
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

/**
 * Checks if the current race matches the stored offline race
 * @returns {boolean} True if the race is available offline
 */
function hasOfflineRaceData() {
  const offlineData = localStorage.getItem('storedRace');
  if (!offlineData) return false;
  
  const parsedData = JSON.parse(offlineData);
  return parsedData.raceId === getRaceID();
}

document.querySelector('#prev-page').addEventListener('click', (event) => {
  const page = Number(event.target.dataset.page);
  if (page > 0) fetchRaceData(page);
});

document.querySelector('#next-page').addEventListener('click', (event) => {
  const page = Number(event.target.dataset.page);
  fetchRaceData(page);
});

document.addEventListener('DOMContentLoaded', () => {
  if (!navigator.onLine && hasOfflineRaceData()) {
    const offlineData = JSON.parse(localStorage.getItem('storedRace'));

    updateRaceDetails(offlineData);
    renderRaceTable(offlineData);
    updatePaginationControls(offlineData.pagination);
  } else {
    fetchRaceData(currentPage);
    setInterval(() => fetchRaceData(currentPage), 10000);
  }
});

document.querySelector('#refresh-stats-button').addEventListener('click', function () {
  fetchRaceData(currentPage);
});

document.querySelector('#dashboard-button').addEventListener('click', function () {
  window.location.href = '/dashboard';
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
 *      return `+${formatRacerTime(timefromPrevCheckpoint)} (${formatRacerTime(timeDiffInSeconds)})`;
 *  }
 *
 *  function getUniqueSortedCheckpoints(participants) {
 *      const uniqueCheckpoints = [];
 *
 *      for (const participant of participants) {
 *          for (const cp of participant.checkpoints) {
 *              if (!uniqueCheckpoints.some(c => c.checkpointId === cp.checkpointId)) {
 *                  uniqueCheckpoints.push(cp);
 *              }
 *           }
 *      }
 *
 *      return uniqueCheckpoints.sort((a, b) => a.order - b.order);
 *  }
 */

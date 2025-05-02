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
    
    // Clear previously saved race data and store current race for offline use
    localStorage.removeItem('storedRace');
    localStorage.setItem('storedRace', JSON.stringify({
      raceDetails,
      timestamp: Date.now(),
      raceID
    }));

    renderRaceTable(raceDetails);
    updatePaginationControls(raceDetails.pagination);
  } catch (error) {
    console.error('Error fetching race data:', error);

    if (hasOfflineRaceData()) {
      const offlineData = localStorage.getItem('storedRace');
      const parsedData = JSON.parse(offlineData);

      console.log('Using offline race data');
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
 * Renders the race table using row templates.
 * @param {Object} raceDetails - The race data object retrieved from the API endpoint.
 */
function renderRaceTable(raceDetails) {
  const raceStartTimeElement = document.querySelector('#race-start-time');
  const raceFinishTimeElement = document.querySelector('#race-finish-time');
  const checkpointCountElement = document.querySelector('#race-checkpoint-counter');
  const tableBody = document.querySelector('.race-table tbody');

  raceStartTimeElement.textContent = formatDate(raceDetails.timeStarted);
  raceFinishTimeElement.textContent = formatDate(raceDetails.timeFinished);
  checkpointCountElement.textContent = raceDetails.totalCheckpoints;

  if (raceDetails.timeFinished >= Date.now() && raceDetails.timeStarted <= Date.now()) {
    const liveTemplate = document.querySelector('#live-indicator-template').content.cloneNode(true);
    const raceTrackerHeader = document.querySelector('#race-tracker-header')
    raceTrackerHeader.textContent = 'Race Details ';
    raceTrackerHeader.appendChild(liveTemplate);
  }

  tableBody.innerHTML = '';

  const rowTemplate = document.querySelector('#participant-row-template');

  
  for (const participant of raceDetails.participants) {
    const row = rowTemplate.content.cloneNode(true);
    row.querySelector('.bib-number').textContent = participant.bibNumber;
    row.querySelector('.participant-name').textContent = `${participant.firstName} ${participant.lastName}`;
    row.querySelector('.finish-time').textContent = formatTime(participant.timeFinished - raceDetails.timeStarted) || '--';

    tableBody.appendChild(row);
  }
}

/**
 * Formats a Unix timestamp into a readable date string.
 * @param {number} timestamp - The Unix timestamp to format.
 * @param {string} [defaultText="N/A"] - Default text if timestamp is missing.
 * @returns {string} Formatted date string.
 */
function formatDate(timestamp, defaultText = 'N/A') {
  return timestamp ? new Date(timestamp).toLocaleString() : defaultText;
}

/**
 * Formats time difference in seconds into a human-readable format (hh:mm:ss or mm:ss).
 * @param {number} timeDiffInSeconds - Time difference in seconds.
 * @returns {string|null} Formatted time string or null if invalid.
 */
function formatTime(timeDiffInSeconds) {
  if (timeDiffInSeconds < 0) return null;

  const hours = Math.floor(timeDiffInSeconds / 3600);
  const minutes = Math.floor((timeDiffInSeconds % 3600) / 60);
  const seconds = timeDiffInSeconds % 60;

  // e.g. 10:01:03
  return `${hours > 0 ? hours + ':' : ''}${minutes < 10 && hours > 0 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
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
  return parsedData.raceID === getRaceID();
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
    console.log('Offline mode - using cached race data');

    renderRaceTable(offlineData.raceDetails);
    updatePaginationControls(offlineData.raceDetails.pagination);
  } else {
    fetchRaceData();
  }
  
  setInterval(fetchRaceData, 10000);
});

document.querySelector('#refresh-stats-button').addEventListener('click', function () {
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

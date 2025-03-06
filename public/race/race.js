/**
 * Fetches race data from the API endpoint and updates the UI table and race details.
 * @param {number} page - The current page number for pagination (default: 1).
 */
async function fetchRaceData(page = 1) {
  const pageSize = 10;

  try {
    const raceID = getRaceID();
    const response = await fetch(`/api/races/${raceID}?page=${page}&pageSize=${pageSize}`);

    if (!response.ok) throw new Error(`Response Status: ${response.status}`);

    const raceData = await response.json();
    console.log(raceData);

    renderRaceTable(raceData);
    updatePaginationControls(raceData.pagination);
  } catch (error) {
    console.error('Error fetching race data:', error);
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
 * @param {Object} raceData - The race data object retrieved from the API endpoint.
 */
function renderRaceTable(raceData) {
  const raceStartTimeElement = document.querySelector('#race-start-time');
  const raceFinishTimeElement = document.querySelector('#race-finish-time');
  const checkpointCountElement = document.querySelector('#race-checkpoint-counter');
  const tableBody = document.querySelector('.race-table tbody');

  raceStartTimeElement.textContent = formatDate(raceData.timeStarted);
  raceFinishTimeElement.textContent = formatDate(raceData.timeFinished);
  checkpointCountElement.textContent = raceData.totalCheckpoints;

  if (raceData.timeFinished * 1000 >= Date.now() && raceData.timeStarted * 1000 <= Date.now()) {
    const liveTemplate = document.querySelector('#live-indicator-template').content.cloneNode(true);
    document.querySelector('#race-tracker-header').textContent = 'Race Details ';
    document.querySelector('#race-tracker-header').appendChild(liveTemplate);
  }

  tableBody.innerHTML = '';

  const rowTemplate = document.querySelector('#participant-row-template');

  
  for (const participant of raceData.participants) {
    const row = rowTemplate.content.cloneNode(true);
    row.querySelector('.bib-number').textContent = participant.bibNumber;
    row.querySelector('.participant-name').textContent = `${participant.firstName} ${participant.lastName}`;
    row.querySelector('.finish-time').textContent = formatTime(participant.timeFinished - raceData.timeStarted) || '--';

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
  return timestamp ? new Date(timestamp * 1000).toLocaleString() : defaultText;
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

  pageInfo.textContent = `Page ${pagination.page} of ${pagination.totalPages}`;

  prevButton.disabled = pagination.page === 1;
  nextButton.disabled = pagination.page === pagination.totalPages;

  prevButton.dataset.page = pagination.page - 1;
  nextButton.dataset.page = pagination.page + 1;
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
  fetchRaceData();
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

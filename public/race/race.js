/**
 * Global constant for the current page in pagination.
 * @type {number}
 */
let currentPage = 1;
let liveTimerInterval = null;

/**
 * Fetches race data from the API endpoint and updates the UI table and race details.
 * If offline, checks for cached race data and uses it if available.
 * @async
 * @function
 * @param {number} [page=1] - The current page number for pagination (default: 1).
 * @throws {Error} When API response is not OK or network request fails.
 * @returns {Promise<void>}
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
      // Use offline data
      const offlineData = localStorage.getItem('storedRace');
      const parsedData = JSON.parse(offlineData);

      updateRaceDetails(parsedData.raceDetails);
      renderRaceTable(parsedData.raceDetails);
      updatePaginationControls(parsedData.raceDetails.pagination);
    }
  }
}

/**
 * Retrieves the race ID from the current URL path.
 * @function
 * @returns {string} The race ID extracted from the URL.
 */
function getRaceID() {
  const url = new URL(window.location.href);
  const args = url.pathname.split('/').filter(Boolean);

  return args[args.length - 1];
}

/**
 * Updates all race detail elements in the UI.
 * @function
 * @param {Object} raceDetails - The race data object containing:
 * @param {number} raceDetails.timeStarted - Unix timestamp of race start
 * @param {string} raceDetails.raceLocation - Location of the race
 * @param {number} raceDetails.totalCheckpoints - Number of checkpoints
 * @param {Object} raceDetails.pagination - Pagination info
 * @param {number} raceDetails.pagination.total - Total participant count
 * @returns {void}
 */
function updateRaceDetails(raceDetails) {
  // Date-Related States
  const now = Date.now();
  const isLive = raceDetails.timeStarted && raceDetails.timeStarted <= now && 
    (!raceDetails.timeFinished || raceDetails.timeFinished >= now);
  const isFinished = raceDetails.timeFinished && raceDetails.timeFinished < now;
  
  // Element handles
  const liveTimer = document.querySelector('#race-live-timer');
  const raceHeader = document.querySelector('#race-title');
  const liveIndicator = document.querySelector('.live-indicator');
  const registerForm = document.querySelector('#register-interest-section');
  const raceHeaderContainer = document.querySelector('#race-header-container');

  // Initialise default text content
  document.querySelector('#race-start-time').textContent = formatDate(raceDetails.timeStarted);
  document.querySelector('#race-location').textContent = raceDetails.raceLocation || 'N/A';
  document.querySelector('#race-checkpoint-counter').textContent = raceDetails.totalCheckpoints || 0;
  document.querySelector('#participant-count').textContent = raceDetails.pagination?.total || 0;

  // Clear any existing interval
  if (liveTimerInterval) {
    clearInterval(liveTimerInterval);
    liveTimerInterval = null;
  }

  // Race is currently live
  if (isLive) {
    // Add live indicator if not already present
    if (!liveIndicator) {
      const template = document.querySelector('#live-indicator-template');
      if (template) {
        const clone = template.content.cloneNode(true);
        raceHeader.appendChild(clone);
      }
    }

    // Remove registration form if exists
    if (registerForm) {
      registerForm.remove();
      if (raceHeaderContainer) {
        raceHeaderContainer.style["grid-template-columns"] = "1fr"; // Enlarge race header by removing a column
      }
    }

    // Start 10ms update interval
    liveTimerInterval = setInterval(() => {
      const elapsed = Date.now() - raceDetails.timeStarted;
      liveTimer.textContent = formatRacerTime(elapsed);
    }, 10);
  } 
  // Race was manually started but is now finished
  else if (isFinished) {
    const duration = raceDetails.timeFinished - raceDetails.timeStarted;
    liveTimer.textContent = formatRacerTime(duration);

    // Remove live indicator if exists
    if (liveIndicator) {
      liveIndicator.remove();
    }

    // Remove registration form if exists
    if (registerForm) {
      registerForm.remove();
      if (raceHeaderContainer) {
        raceHeaderContainer.style["grid-template-columns"] = "1fr"; // Enlarge race header by removing a column
      }
    }
  }
  // Race hasn't started yet
  else {
    liveTimer.textContent = "00:00:00.000";
  }
}

/**
 * Renders the race participant table using row templates.
 * @function
 * @param {Object} raceDetails - The race data object containing:
 * @param {Array} raceDetails.participants - Array of participant objects
 * @returns {void}
 */
function renderRaceTable(raceDetails) {
  const tableBody = document.querySelector('.race-table tbody');

  // Clear table
  tableBody.innerHTML = '';

  for (const participant of raceDetails.participants) {
    const finishTimeCell = row.querySelector('.finish-time');
    const row = document.querySelector('#participant-row-template').content.cloneNode(true);

    // Set racer details
    row.querySelector('.bib-number').textContent = participant.bibNumber;
    row.querySelector('.participant-name').textContent = `${participant.firstName} ${participant.lastName}`;

    // Show racer time
    if (participant.timeFinished) {
      finishTimeCell.textContent = formatRacerTime((participant.timeFinished));
    } else {
      finishTimeCell.textContent = 'N/A';
    }
    tableBody.appendChild(row);
  }
}

/**
 * Formats a Unix timestamp into a readable date string.
 * @function
 * @param {number} timestamp - The Unix timestamp in milliseconds
 * @param {string} [defaultText="Not Started"] - Default text if timestamp is missing
 * @returns {string} Formatted date string or default text
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
 * Formats milliseconds into a human-readable time format (HH:MM:SS.mmm).
 * @function
 * @param {number} ms - Time duration in milliseconds
 * @returns {string} Formatted time string (HH:MM:SS.mmm)
 */
function formatRacerTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msRemain = ms % 1000;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${msRemain.toString().padStart(3, '0')}`;
}

/**
 * Updates pagination controls based on current pagination state.
 * @function
 * @param {Object} pagination - Pagination details object containing:
 * @param {number} pagination.page - Current page number
 * @param {number} pagination.totalPages - Total number of pages
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
 * Checks if offline race data is available for the current race.
 * @function
 * @returns {boolean} True if matching offline race data exists in localStorage
 */
function hasOfflineRaceData() {
  const offlineData = localStorage.getItem('storedRace');
  if (!offlineData) return false;
  
  const parsedData = JSON.parse(offlineData);
  return parsedData.raceId === getRaceID();
}

/**
 * Registers user interest in a race via API.
 * @async
 * @function
 * @param {string} firstName - Participant's first name
 * @param {string} lastName - Participant's last name
 * @throws {Error} When registration fails
 * @returns {Promise<Object>} API response data
 */
async function registerInterest(firstName, lastName) {
  const raceId = getRaceID();
  
  try {
    const response = await fetch('/api/register-interest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raceId,
        firstName,
        lastName
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to register interest');
    }

    return await response.json();
  } catch (error) {
    console.error('Error registering interest:', error);
    throw error;
  }
}

/**
 * Exports race data to CSV format and triggers download.
 * @async
 * @function
 * @throws {Error} When export process fails
 * @returns {Promise<void>}
 */
async function exportToCSV() {
  try {
    const raceId = getRaceID();
    const button = document.querySelector('#export-csv-button');
    
    button.disabled = true;
    
    // First get basic race info
    const raceResponse = await fetch(`/api/races/${raceId}`);
    if (!raceResponse.ok) throw new Error('Failed to fetch race details');
    const raceDetails = await raceResponse.json();
    
    // Then get ALL participants
    const participants = await fetchAllParticipants(raceId);
    
    if (!participants || participants.length === 0) {
      alert('No participant data to export');
      return;
    }

    // Create CSV content
    let csv = `Location:,${raceDetails.raceLocation}\n`;
    csv += `Start Time:,${new Date(raceDetails.timeStarted)}\n\n`;
    
    // Header row
    csv += 'Bib Number,First Name,Last Name,Finish Time';
    
    // Add checkpoint headers if available
    if (participants[0]?.checkpoints?.length > 0) {
      participants[0].checkpoints.forEach(cp => {
        csv += `,${cp.checkpointName}`;
      });
    }
    csv += '\n';
    
    // Participant rows
    for (const participant of participants) {
      const finishTime = participant.timeFinished 
        ? formatRacerTime(participant.timeFinished)
        : 'Pending';
      
      csv += `"${participant.bibNumber}","${participant.firstName}","${participant.lastName}","${finishTime}"\n`;
    }

    // Create and trigger download
    const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const link = document.createElement('a');

    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `race_${raceId}_export_${new Date().toISOString().split('T')[0]}.csv`);

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
    
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    const button = document.querySelector('#export-csv-button');
    if (button) {
      button.disabled = false;
    }
  }
}

/**
 * Fetches all participants for a race from the API.
 * @async
 * @function
 * @param {string} raceId - The ID of the race
 * @throws {Error} When API request fails
 * @returns {Promise<Array>} Array of participant objects
 */
async function fetchAllParticipants(raceId) {
  try {
    const response = await fetch(`/api/races/${raceId}/all-participants`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching all participants:', error);
    throw error;
  }
}

/**
 * Handles the submission of the interest form, validates input, and registers interest via API.
 * @async
 * @function handleInterestFormSubmission
 * @param {Event} event - The form submission event
 * @returns {Promise<void>}
 * @throws {Error} When form validation fails or registration API call fails
 */
async function handleInterestFormSubmission(event) {
  event.preventDefault();
  
  // Get form elements
  const form = event.target;
  const firstNameInput = form.querySelector('#first-name');
  const lastNameInput = form.querySelector('#last-name');
  const submitButton = form.querySelector('#register-interest-button');
  const confirmationMessage = form.querySelector('#interest-confirmation');
  
  // Validate inputs
  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  
  if (!firstName || !lastName) {
    showConfirmationMessage(
      confirmationMessage,
      'Please enter both first and last name',
      'error'
    );
    return;
  }

  // Update UI for loading state
  setButtonState(submitButton, {
    disabled: true,
    text: 'Registering...'
  });

  try {
    // Attempt registration
    await registerInterest(firstName, lastName);
    
    // Handle success
    form.reset();
    showConfirmationMessage(
      confirmationMessage,
      'Thank you for your interest!',
      'success'
    );
  } catch (error) {
    // Handle error
    showConfirmationMessage(
      confirmationMessage,
      'Failed to register interest. Please try again.',
      'error'
    );
  } finally {
    // Reset button state
    setButtonState(submitButton, {
      disabled: false,
      text: 'Register Interest'
    });
  }
}

/**
 * Displays a confirmation message with the specified type (success/error).
 * @function showConfirmationMessage
 * @param {HTMLElement} element - The confirmation message element
 * @param {string} message - The message to display
 * @param {'success'|'error'} type - The type of message (determines styling)
 * @returns {void}
 */
function showConfirmationMessage(element, message, type) {
  if (!element) return;
  
  element.textContent = message;
  element.className = `${type}-message`;
  element.classList.remove('hidden');
}

/**
 * Updates the state of a button element.
 * @function setButtonState
 * @param {HTMLButtonElement} button - The button element to update
 * @param {Object} options - Configuration options
 * @param {boolean} options.disabled - Whether the button should be disabled
 * @param {string} options.text - The text to display on the button
 * @returns {void}
 */
function setButtonState(button, { disabled, text }) {
  if (!button) return;
  
  button.disabled = disabled;
  button.textContent = text;
}

// Event Listeners

/**
 * Previous page button click handler.
 * @event
 */
document.querySelector('#prev-page').addEventListener('click', (event) => {
  const page = Number(event.target.dataset.page);
  if (page > 0) fetchRaceData(page);
});

/**
 * Next page button click handler.
 * @event
 */
document.querySelector('#next-page').addEventListener('click', (event) => {
  const page = Number(event.target.dataset.page);
  fetchRaceData(page);
});

/**
 * DOMContentLoaded event handler that initializes race data.
 * @event
 */
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

/**
 * Refresh stats button click handler.
 * @event
 */
document.querySelector('#refresh-stats-button').addEventListener('click', function () {
  fetchRaceData(currentPage);
});

/**
 * Dashboard button click handler.
 * @event
 */
document.querySelector('#dashboard-button').addEventListener('click', function () {
  window.location.href = '/dashboard';
});

/**
 * Export CSV button click handler.
 * @event
 */
document.querySelector('#export-csv-button')?.addEventListener('click', exportToCSV);

/**
 * Interest form submission handler.
 * @event
 */
document.querySelector('#interest-form')?.addEventListener('submit', handleInterestFormSubmission);
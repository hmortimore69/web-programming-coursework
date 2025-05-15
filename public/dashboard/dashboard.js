/**
 * Main initialization function for the race dashboard.
 * @async
 * @function main
 * @returns {Promise<void>}
 */
async function main() {
  const race = await getRace();
  const raceId = race.raceId;

  // Initialise components
  syncTimerWithRaceState(race);
  raceTimer.init();
  TimestampManager.init(raceId);

  // Add click handler for race deletion
  document.querySelector('#delete-race-button').addEventListener('click', async () => {
    const confirmDelete = confirm('Are you sure you want to delete this race? This action cannot be undone.');
    if (confirmDelete) {
      await deleteRaceById(raceId);
    }
  });

  // Fetch and display pending participant requests
  const participants = await fetchPendingParticipants(raceId);
  renderPendingParticipants(participants);

  // Add event for participant approval/rejection buttons
  document.querySelector('#pending-participants-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('accept-participant')) {
      // Handle participant approval

      const item = e.target.closest('.conflict-item');
      handleParticipantAction(raceId, item.dataset.userId, 'approve');
    } else if (e.target.classList.contains('reject-participant')) {
      // Handle participant rejection

      const item = e.target.closest('.conflict-item');
      handleParticipantAction(raceId, item.dataset.userId, 'reject');
    }
  });

  // Add refresh button for pending participants list
  document.querySelector('#refresh-participants').addEventListener('click', async () => {
    const participants = await fetchPendingParticipants(raceId);
    renderPendingParticipants(participants);
  });

  // Set up periodic synchronization of race state (every 10 seconds)
  setInterval(() => syncTimerWithRaceState(), 10000);
}

/**
 * Synchronizes the race timer with the current race state.
 * @function syncTimerWithRaceState
 * @param {Object} [race] - The race data object
 * @param {number} race.scheduledStartTime - Scheduled start time timestamp
 * @param {number} race.scheduled_duration - Scheduled duration in milliseconds
 * @param {number} race.timeStarted - Actual start time timestamp
 * @param {number} race.timeFinished - Actual finish time timestamp
 * @returns {void}
 */
function syncTimerWithRaceState(race) {
  if (!race) return;

  const { scheduledStartTime, scheduled_duration, timeStarted, timeFinished } = race;
  const now = Date.now();

  raceTimer.stop();

  // Race is currently live
  if (timeStarted && timeStarted <= now && (!timeFinished || timeFinished >= now)) {
    const elapsed = now - timeStarted;
    raceTimer.setTime(elapsed);
    raceTimer.start();
    return;
  }

  // Race was manually started but is now finished
  if (timeStarted && timeFinished && timeFinished < now) {
    const finalTime = timeFinished - timeStarted;
    raceTimer.setTime(finalTime);
    raceTimer.finish();
    return;
  }

  // Race hasn't started yet - show countdown to scheduled time
  if (!timeStarted && scheduledStartTime > now) {
    raceTimer.startCountdown(scheduledStartTime);
    return;
  }

  // Scheduled start time passed but race wasn't started
  if (!timeStarted && scheduledStartTime <= now) {
    if (!navigator.onLine && raceTimer.liveIndicator) {
      raceTimer.liveIndicator.textContent = '● OFFLINE';
      raceTimer.liveIndicator.style.color = 'orange';
    }

    if (raceTimer.liveIndicator && navigator.onLine) {
      raceTimer.liveIndicator.textContent = '● STARTING';
      raceTimer.liveIndicator.style.color = 'orange';
    }
    return;
  }
}

/** 
 * Retrieves race data from API or localStorage fallback (includes pagination).
 * @async
 * @function getRace
 * @returns {Promise<Object|null>} Race data object or null if not found
 */
async function getRace() {
  const stored = localStorage.getItem('storedRace');

  if (navigator.onLine) {
    try {
      const raceId = JSON.parse(stored)?.raceId;
      if (!raceId) {
        console.error("Race ID not found in storedRace.");
        return null;
      }

      const response = await fetch(`/api/races/${raceId}`);
      if (!response.ok) {
        console.error(`Failed to fetch race data. Status: ${response.status}`);
        return stored ? JSON.parse(stored) : null;
      }

      const raceDetails = await response.json();
            
      // Update localStorage with the latest race data
      localStorage.setItem('storedRace', JSON.stringify(raceDetails));
      return raceDetails;
    } catch (error) {
      console.error("Error fetching race data:", error);
      return stored ? JSON.parse(stored) : null;
    }
  } else {
    console.warn("Offline: Falling back to storedRace in localStorage.");
    return stored ? JSON.parse(stored) : null;
  }
}

/**
 * Deletes a race by ID.
 * @async
 * @function deleteRaceById
 * @param {string} raceId - The ID of the race to delete
 * @returns {Promise<void>}
 */
async function deleteRaceById(raceId) {
  try {
    const response = await fetch(`/api/delete-race?raceId=${raceId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      localStorage.removeItem(`raceTimestamps`);
      window.location.href = "/home";
    } else {
      throw new Error(`Response Status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting race', error);
  }
}

/**
 * Updates a property in the storedRace localStorage.
 * @function updateLocalStorageProperty
 * @param {string} property - The property to update
 * @param {*} value - The new value
 * @returns {void}
 */
function updateLocalStorageProperty(property, value) {
  const storedRace = JSON.parse(localStorage.getItem('storedRace'));
  storedRace[property] = value;
  localStorage.setItem('storedRace', JSON.stringify(storedRace));
}

/**
 * Starts the race by setting the start time.
 * @async
 * @function startRace
 * @returns {Promise<void>}
 */
async function startRace() {
  const updatedStartTime = Date.now();

  try {
    const raceDetails = JSON.parse(localStorage.getItem('storedRace'));
    const raceId = raceDetails.raceId;

    if (raceTimer.isRunning || raceTimer.isFinished) {
      return;
    }

    const confirmStart = confirm('Are you sure you want to start this race?');
    if (!confirmStart) return;

    updateLocalStorageProperty("timeStarted", updatedStartTime);

    await updateRaceData(raceId, 'update-start-time', { startTime: updatedStartTime });
  

    // Sync timer with new state
    const updatedRace = JSON.parse(localStorage.getItem('storedRace'));
    syncTimerWithRaceState(updatedRace);
  } catch (error) {
    console.error('Error starting race:', error);
  }
}

/**
 * Finishes the race by setting the finish time.
 * @async
 * @function finishRace
 * @returns {Promise<void>}
 */
async function finishRace() {
  try {
    const raceDetails = JSON.parse(localStorage.getItem('storedRace'));
    const raceId = raceDetails.raceId;
    const timeStarted = raceDetails.timeStarted;

    if (!timeStarted || raceTimer.isFinished) return;

    // Use the raceTimer's elapsedTime which accounts for pauses
    const finalTime = raceTimer.elapsedTime;
    const updatedFinishTime = timeStarted + finalTime;

    const confirmFinish = confirm('Are syou sure you want to end this race?');
    if (!confirmFinish) return;

    // Update localStorage
    updateLocalStorageProperty("timeFinished", updatedFinishTime);

    // Update server
    await updateRaceData(raceId, 'update-finish-time', { finishTime: updatedFinishTime });

    // Sync timer with new state
    const updatedRace = JSON.parse(localStorage.getItem('storedRace'));
    syncTimerWithRaceState(updatedRace);
  } catch (error) {
    console.error('Error ending race:', error);
  }
}

/**
 * Helper function to update race data on the server.
 * @async
 * @function updateRaceData
 * @param {string} raceId - The race ID
 * @param {string} action - The action to perform
 * @param {Object} data - The data to update
 * @returns {Promise<void>}
 */
async function updateRaceData(raceId, action, data) {
  try {
    const response = await fetch(`/api/update-race`, {
      method: "PATCH",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raceId,
        action,
        data
      }),
    });

    if (response.ok) {
    } else {
      throw new Error(`Response Status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error performing action: ${action}`, error);
  }
}

/**
 * Navigates back to the race results page.
 * @function returnToResults
 * @returns {void}
 */
function returnToResults() {
  const stored = JSON.parse(localStorage.getItem('storedRace'));
  const raceId = stored?.raceId;

  window.location.href = `/race/${raceId}`;
}

/**
 * Fetches pending participants for a race.
 * @async
 * @function fetchPendingParticipants
 * @param {string} raceId - The race ID
 * @returns {Promise<Array>} Array of pending participants
 */
async function fetchPendingParticipants(raceId) {
  try {
    const response = await fetch(`/api/races/${raceId}/pending-participants`);
    if (!response.ok) {
      throw new Error(`Failed to fetch pending participants. Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching pending participants:', error);
    return [];
  }
}

/**
 * Renders pending participants to the UI.
 * @function renderPendingParticipants
 * @param {Array} participants - Array of participant objects
 * @param {string} participants[].interestId - Participant interest ID
 * @param {string} participants[].firstName - Participant first name
 * @param {string} participants[].lastName - Participant last name
 * @returns {void}
 */
function renderPendingParticipants(participants) {
  const container = document.querySelector('#pending-participants-list');
  const template = document.querySelector('#participant-card-template');
  const emptyState = container.querySelector('.empty-state');

  // Clear existing content except empty state
  for (const el of container.querySelectorAll('.conflict-item')) {
    el.remove();
  }

  if (participants.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  for (const participant of participants) {
    const clone = template.content.cloneNode(true);
    const item = clone.querySelector('.conflict-item');
    item.dataset.userId = participant.interestId;
    
    clone.querySelector('.participant-name').textContent = `${participant.firstName} ${participant.lastName}`;
    
    container.appendChild(clone);
  }
}

/**
 * Handles participant approval/rejection actions.
 * @async
 * @function handleParticipantAction
 * @param {string} raceId - The race ID
 * @param {string} userId - The user ID to act on
 * @param {'approve'|'reject'} action - The action to perform
 * @returns {Promise<void>}
 */
async function handleParticipantAction(raceId, userId, action) {
  try {
    const response = await fetch(`/api/races/${raceId}/participants/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action })
    });

    if (!response.ok) {
      throw new Error(`Failed to ${action} participant. Status: ${response.status}`);
    }

    // Refresh the list
    const participants = await fetchPendingParticipants(raceId);
    renderPendingParticipants(participants);
  } catch (error) {
    console.error(`Error ${action}ing participant:`, error);
  }
}

// Event Listeners

/**
 * Load main when DOM loaded.
 * @event
 */
document.addEventListener('DOMContentLoaded', main);

/**
 * Start race event.
 * @event
 */
document.querySelector('#start-race-button').addEventListener('click', startRace);

/**
 * Finish race event.
 * @event
 */
document.querySelector('#finish-race-button').addEventListener('click', finishRace);

/**
 * Return to race view event.
 * @event
 */
document.querySelector('#back-button').addEventListener('click', returnToResults);
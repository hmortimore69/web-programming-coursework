const raceTimer = {
  // Properties
  timerElement: document.querySelector('#race-timer'),
  liveIndicator: document.querySelector('#live-indicator'),
  startTime: null,
  timerInterval: null,
  elapsedTime: 0,
  isRunning: false,
  isCountdown: false,
  isFinished: false,

  // Methods
  start() {
    if (this.isRunning) return;

    this.startTime = Date.now() - this.elapsedTime;
    this.isRunning = true;

    if (this.liveIndicator) {
      this.liveIndicator.textContent = '● LIVE';
      this.liveIndicator.style.color = 'red';
    }

    this.timerInterval = setInterval(() => this.update(), 10);
  },

  startCountdown(targetTime) {
    if (this.isRunning) return;

    this.isCountdown = true;
    this.isRunning = true;

    if (this.liveIndicator) {
      this.liveIndicator.textContent = '● STARTS SOON';
      this.liveIndicator.style.color = 'orange';
    }

    this.timerInterval = setInterval(() => {
      const now = Date.now();
      const remaining = targetTime - now;

      if (remaining <= 0) {
        clearInterval(this.timerInterval);
        this.isCountdown = false;
        this.start();
      } else {
        if (remaining > 60000) {
          this.liveIndicator.textContent = '● WAITING';
          this.liveIndicator.style.color = 'grey';
        } else if (remaining > 10000) {
          this.liveIndicator.textContent = '● STARTS SOON';
          this.liveIndicator.style.color = 'orange';
        } else {
          this.liveIndicator.textContent = '● STARTING';
          this.liveIndicator.style.color = 'red';
        }
        this.updateCountdownDisplay(remaining);
      }
    }, 10);
  },

  stop() {
    if (!this.isRunning) return;

    clearInterval(this.timerInterval);
    this.isRunning = false;
    this.isCountdown = false;
    this.elapsedTime = Date.now() - this.startTime;

    if (this.liveIndicator) {
      this.liveIndicator.textContent = '';
    }
  },

  finish() {
    this.stop();
    this.isFinished = true;

    if (this.liveIndicator) {
      this.liveIndicator.textContent = '● FINISHED';
      this.liveIndicator.style.color = 'green';
    }
  },

  reset() {
    this.stop();
    this.elapsedTime = 0;
    this.updateDisplay(0);
  },

  adjustTime(deltaTime) {
    this.elapsedTime += deltaTime;
    if (this.elapsedTime < 0) {
      this.elapsedTime = 0;
    }
    this.updateDisplay(this.elapsedTime);
    if (this.isRunning && !this.isCountdown) {
      this.startTime = Date.now() - this.elapsedTime;
    }
  },

  setTime(elapsed) {
    this.elapsedTime = elapsed;
    this.updateDisplay(this.elapsedTime);
  },

  update() {
    this.elapsedTime = Date.now() - this.startTime;
    this.updateDisplay(this.elapsedTime);
  },

  updateDisplay(elapsed) {
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const milliseconds = elapsed % 1000;

    this.timerElement.textContent =
      `${hours.toString().padStart(2, '0')}:` +
      `${minutes.toString().padStart(2, '0')}:` +
      `${seconds.toString().padStart(2, '0')}.` +
      `${milliseconds.toString().padStart(3, '0')}`;
  },

  updateCountdownDisplay(timeRemaining) {
    const days = Math.floor(timeRemaining / 86400000);
    const hours = Math.floor((timeRemaining % 86400000) / 3600000);
    const minutes = Math.floor((timeRemaining % 3600000) / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);

    this.timerElement.textContent =
        `Starts in ${days.toString().padStart(2, '0')}d ` +
        `${hours.toString().padStart(2, '0')}h ` +
        `${minutes.toString().padStart(2, '0')}m ` +
        `${seconds.toString().padStart(2, '0')}s`;
  },
};

async function main() {
  const race = await getRace();
  const raceId = race.raceId;

  syncTimerWithRaceState(race);
  initTimestampRecording(raceId);

  document.querySelector('#delete-race-button').addEventListener('click', () => {
    deleteRaceById(raceId);
  });

  setInterval(() => syncTimerWithRaceState(), 10000);
}

function syncTimerWithRaceState(race) {
  if (!race) return;

  console.log(race);

  const { scheduled_start_time, scheduled_duration, timeStarted, timeFinished } = race;
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
  if (!timeStarted && scheduled_start_time > now) {
    raceTimer.startCountdown(scheduled_start_time);
    return;
  }

  // Scheduled start time passed but race wasn't started
  if (!timeStarted && scheduled_start_time <= now) {
    raceTimer.updateDisplay(0);
    if (raceTimer.liveIndicator) {
      raceTimer.liveIndicator.textContent = '● STARTING';
      raceTimer.liveIndicator.style.color = 'orange';
    }
    return;
  }

  // Default case
  raceTimer.reset();
}

function initTimestampRecording(raceId) {
  let workingTimestamps = [];
  let stagedTimestamps = [];
  let committedTimestamps = [];
  let selectedTimestamp = null;

  // Load existing timestamps from localStorage
  const storedRace = JSON.parse(localStorage.getItem('storedRace')) || {};
  if (storedRace.workingTimestamps) workingTimestamps = storedRace.workingTimestamps;
  if (storedRace.stagedTimestamps) stagedTimestamps = storedRace.stagedTimestamps;
  if (storedRace.committedTimestamps) committedTimestamps = storedRace.committedTimestamps;
  
  renderAllTimestamps();

  // Record current time (adds to working area)
  document.querySelector('#record-timestamp-button').addEventListener('click', () => {
    if (!raceTimer.isRunning) {
      alert('Race timer is not running!');
      return;
    }

    const timestamp = {
      id: Date.now(),
      time: raceTimer.elapsedTime,
      recordedAt: new Date().toISOString()
    };

    workingTimestamps.push(timestamp);
    updateLocalStorage();
    renderAllTimestamps();
  });

  // Assign timestamp to racer (moves from working to staged)
  document.querySelector('#assign-timestamp-button').addEventListener('click', () => {
    const racerNumber = document.querySelector('#racer-number-input').value;
    if (!racerNumber || !selectedTimestamp) {
      alert('Please select a timestamp and enter a racer number');
      return;
    }

    // Find timestamp in working area
    const timestampIndex = workingTimestamps.findIndex(t => t.id === selectedTimestamp);
    if (timestampIndex !== -1) {
      const timestamp = workingTimestamps[timestampIndex];
      timestamp.racerNumber = racerNumber;
      
      // Move to staged
      stagedTimestamps.push(timestamp);
      workingTimestamps.splice(timestampIndex, 1);
      
      updateLocalStorage();
      renderAllTimestamps();
      document.querySelector('#racer-number-input').value = '';
      selectedTimestamp = null;
    }
  });

  // Commit all staged timestamps
  document.querySelector('#commit-timestamps-button').addEventListener('click', async () => {
    if (stagedTimestamps.length === 0) {
      alert('No timestamps to commit');
      return;
    }

    try {
      // Here you would normally make your API call
      // For now we'll just move them to committed
      committedTimestamps.push(...stagedTimestamps);
      stagedTimestamps = [];
      updateLocalStorage();
      renderAllTimestamps();
      alert('Timestamps committed successfully!');
    } catch (error) {
      console.error('Error committing timestamps:', error);
      alert('Failed to commit timestamps');
    }
  });

  function renderAllTimestamps() {
    renderTimestamps('working', workingTimestamps);
    renderTimestamps('staged', stagedTimestamps);
    renderTimestamps('committed', committedTimestamps);
  }

  function renderTimestamps(area, timestamps) {
    const tableBody = document.querySelector(`#${area}-timestamps-list`);
    tableBody.innerHTML = '';

    timestamps.forEach(timestamp => {
      const row = document.createElement('tr');
      row.dataset.id = timestamp.id;
      if (timestamp.id === selectedTimestamp) {
        row.style.backgroundColor = '#e6f7ff';
      }

      if (area === 'working') {
        row.innerHTML = `
          <td>${formatTime(timestamp.time)}</td>
          <td>
            <button class="select-action" data-id="${timestamp.id}">Select</button>
            <button class="delete-action" data-id="${timestamp.id}">Delete</button>
          </td>
        `;
      } else if (area === 'staged') {
        row.innerHTML = `
          <td>${formatTime(timestamp.time)}</td>
          <td>${timestamp.racerNumber || 'Not assigned'}</td>
          <td>
            <button class="select-action" data-id="${timestamp.id}">Select</button>
            <button class="unstage-action" data-id="${timestamp.id}">Unstage</button>
          </td>
        `;
      } else { // committed
        row.innerHTML = `
          <td>${formatTime(timestamp.time)}</td>
          <td>${timestamp.racerNumber || 'Not assigned'}</td>
        `;
      }

      tableBody.appendChild(row);
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.select-action').forEach(button => {
      button.addEventListener('click', (e) => {
        selectedTimestamp = parseInt(e.target.dataset.id);
        renderAllTimestamps();
      });
    });

    document.querySelectorAll('.delete-action').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        workingTimestamps = workingTimestamps.filter(t => t.id !== id);
        updateLocalStorage();
        renderAllTimestamps();
      });
    });

    document.querySelectorAll('.unstage-action').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        const timestampIndex = stagedTimestamps.findIndex(t => t.id === id);
        if (timestampIndex !== -1) {
          const timestamp = stagedTimestamps[timestampIndex];
          workingTimestamps.push(timestamp);
          stagedTimestamps.splice(timestampIndex, 1);
          updateLocalStorage();
          renderAllTimestamps();
        }
      });
    });
  }

  function updateLocalStorage() {
    const storedRace = JSON.parse(localStorage.getItem('storedRace')) || {};
    storedRace.workingTimestamps = workingTimestamps;
    storedRace.stagedTimestamps = stagedTimestamps;
    storedRace.committedTimestamps = committedTimestamps;
    localStorage.setItem('storedRace', JSON.stringify(storedRace));
  }

  function formatTime(milliseconds) {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const ms = milliseconds % 1000;

    return `${hours.toString().padStart(2, '0')}:` +
           `${minutes.toString().padStart(2, '0')}:` +
           `${seconds.toString().padStart(2, '0')}.` +
           `${ms.toString().padStart(3, '0')}`;
  }
}

async function getRace() {
  const stored = localStorage.getItem('storedRace');
  console.log(stored);

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
        return stored ? JSON.parse(stored) : null; // Fallback to localStorage
      }

      const raceDetails = await response.json();
      
      console.log(raceDetails);
      
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

async function deleteRaceById(raceId) {
  try {
    const response = await fetch(`/api/delete-race?raceId=${raceId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      window.location.href = "/home";
    } else {
      throw new Error(`Response Status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error posting new race', error);
  }
}

function updateLocalStorageProperty(property, value) {
  const storedRace = JSON.parse(localStorage.getItem('storedRace'));
  storedRace[property] = value;
  localStorage.setItem('storedRace', JSON.stringify(storedRace));
}

async function startRace() {
  const updatedStartTime = Date.now();

  try {
    const raceDetails = JSON.parse(localStorage.getItem('storedRace'));
    const raceId = raceDetails.raceId;
    const scheduledDuration = raceDetails.scheduled_duration;

    const updatedFinishTime = updatedStartTime + scheduledDuration;

    updateLocalStorageProperty("timeStarted", updatedStartTime);
    updateLocalStorageProperty("timeFinished", updatedFinishTime);

    // Update server
    await updateRaceData(raceId, 'update-start-time', { startTime: updatedStartTime });
    await updateRaceData(raceId, 'update-finish-time', { finishTime: updatedFinishTime });
  
    // Sync timer with new state
    const updatedRace = JSON.parse(localStorage.getItem('storedRace'));
    syncTimerWithRaceState(updatedRace);

  } catch (error) {
    console.error('Error starting race:', error);
  }
}

// Helper function to avoid repetitive code
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
      console.log(`Successfully performed action: ${action}`);
    } else {
      throw new Error(`Response Status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error performing action: ${action}`, error);
  }
}

document.addEventListener('DOMContentLoaded', main);
document.querySelector('#start-timer-button').addEventListener('click', startRace);
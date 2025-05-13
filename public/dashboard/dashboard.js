async function main() {
  const race = await getRace();
  const raceId = race.raceId;

  syncTimerWithRaceState(race);
  TimestampManager.init(raceId);

  document.querySelector('#delete-race-button').addEventListener('click', () => {
    deleteRaceById(raceId);
  });

  setInterval(() => syncTimerWithRaceState(), 10000);
}

function syncTimerWithRaceState(race) {
  if (!race) return;

  const { scheduledStartTime, scheduled_duration, timeStarted, timeFinished } = race;
  const now = Date.now();

  raceTimer.stop();

  // Race is currently live
  console.log(timeStarted && timeStarted <= now && (!timeFinished || timeFinished >= now));
  if (timeStarted && timeStarted <= now && (!timeFinished || timeFinished >= now)) {
    // Add check if race exceeds 24 hours, rten cap timer at 24 and finish race (TODO)
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
    // If offline, start race as normal and if you are not a race admin (server will handle time differential)
    if (!navigator.onLine && userType.getRole() !== 'admin') {
      elapsed = now - scheduledStartTime;
      raceTimer.setTime(elapsed);
      raceTimer.start();
    }

    if (raceTimer.liveIndicator) {
      raceTimer.liveIndicator.textContent = '● STARTING';
      raceTimer.liveIndicator.style.color = 'orange';
    }
    return;
  }
}

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
        return stored ? JSON.parse(stored) : null; // Fallback to localStorage
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

    if (raceTimer.isRunning || raceTimer.isFinished) {
      return;
    }

    updateLocalStorageProperty("timeStarted", updatedStartTime);

    await updateRaceData(raceId, 'update-start-time', { startTime: updatedStartTime });
  

    console.log("STARTED");
    // Sync timer with new state
    const updatedRace = JSON.parse(localStorage.getItem('storedRace'));
    syncTimerWithRaceState(updatedRace);
  } catch (error) {
    console.error('Error starting race:', error);
  }
}

async function finishRace() {
  try {
    const raceDetails = JSON.parse(localStorage.getItem('storedRace'));
    const raceId = raceDetails.raceId;
    const timeStarted = raceDetails.timeStarted;

    if (!timeStarted) {
      alert('Race has not been started yet!');
      return;
    }

    // Use the raceTimer's elapsedTime which accounts for pauses
    const finalTime = raceTimer.elapsedTime;
    const updatedFinishTime = timeStarted + finalTime;

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
    } else {
      throw new Error(`Response Status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error performing action: ${action}`, error);
  }
}

function returnToResults() {
  const stored = JSON.parse(localStorage.getItem('storedRace'));
  const raceId = stored?.raceId;

  window.location.href = `/race/${raceId}`;
}

document.addEventListener('DOMContentLoaded', main);
document.querySelector('#start-race-button').addEventListener('click', startRace);
document.querySelector('#finish-race-button').addEventListener('click', finishRace);
document.querySelector('#back-button').addEventListener('click', returnToResults);
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

function main() {
  const race = getStoredRace();
  const raceId = race.raceID;

  // Clone storedRace for mutable actions
  localStorage.setItem('mutableRaceData', JSON.stringify(race));

  if (race) {
    const { timeStarted, timeFinished } = race.raceDetails;
    const now = Date.now();

    if (timeStarted <= now && timeFinished >= now) {
      // Race is live
      const elapsed = now - timeStarted;
      raceTimer.setTime(elapsed);
      raceTimer.start();
    } else if (timeStarted > now) {
      // Race hasn't started yet (show countdown)
      raceTimer.startCountdown(timeStarted);
		} else if (timeFinished < now) {
			const finalTime = timeFinished - timeStarted;
			raceTimer.setTime(finalTime);
			raceTimer.finish();
    } else {
      // Race is over or not live
      raceTimer.reset();
    }
  }

  document.querySelector('#delete-race-button').addEventListener('click', () => {
    deleteRaceById(raceId);
  });
}

function getStoredRace() {
  const stored = localStorage.getItem('storedRace');
  return stored ? JSON.parse(stored) : null;
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
  const mutableRaceData = JSON.parse(localStorage.getItem('mutableRaceData'));
  mutableRaceData.raceDetails[property] = value;
  localStorage.setItem('mutableRaceData', JSON.stringify(mutableRaceData));
}

async function startRace() {
  updateLocalStorageProperty("timeStarted", Date.now());

  try {
    const response = await fetch(`/api/update-race`, {
      method: "PATCH",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData),
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

document.addEventListener('DOMContentLoaded', main);
document.querySelector('#start-timer-button').addEventListener('click', startRace);
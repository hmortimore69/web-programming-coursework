class RaceTimer {
  constructor() {
    this.timerElement = document.querySelector('#race-timer');
    this.liveIndicator = document.querySelector('#live-indicator');
    this.startTime = null;
    this.timerInterval = null;
    this.elapsedTime = 0;

		// Status booleans used to set state of timer
    this.isRunning = false;
    this.isCountdown = false;
		this.isFinished = false;
  }

  // Starts the timer (from 0 or resume)
  start() {
    if (this.isRunning) return;
    
    this.startTime = Date.now() - this.elapsedTime;
    this.isRunning = true;
    
    if (this.liveIndicator) {
      this.liveIndicator.textContent = '● LIVE';
      this.liveIndicator.style.color = 'red';
    }

    this.timerInterval = setInterval(() => this.update(), 10);
  }

  // Starts a countdown
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
      // Countdown finished, switch to live timer
      clearInterval(this.timerInterval);
      this.isCountdown = false;
      this.start();
    } else {
      // Update the live indicator based on remaining time
      if (remaining > 60000) { 
				// More than 1 minute
        this.liveIndicator.textContent = '● WAITING';
        this.liveIndicator.style.color = 'grey';
      } else if (remaining > 10000) { 
				// Between 10 seconds and 1 minute
        this.liveIndicator.textContent = '● STARTS SOON';
        this.liveIndicator.style.color = 'orange';
      } else { 
				// Less than 10 seconds
        this.liveIndicator.textContent = '● STARTING';
        this.liveIndicator.style.color = 'red';
      }

      this.updateCountdownDisplay(remaining);
    }
  }, 10);
}

  // Stops the timer (pauses)
  stop() {
    if (!this.isRunning) return;
    
    clearInterval(this.timerInterval);
    this.isRunning = false;
    this.isCountdown = false;
    this.elapsedTime = Date.now() - this.startTime;
    
    if (this.liveIndicator) {
      this.liveIndicator.textContent = '';
    }
  }

	finish() {
    this.stop(); // Stop updates
    this.isFinished = true;
    
    if (this.liveIndicator) {
      this.liveIndicator.textContent = '● FINISHED';
      this.liveIndicator.style.color = 'green';
    }
  }

  // Resets the timer
  reset() {
    this.stop();
    this.elapsedTime = 0;
    this.updateDisplay(0);
  }

  // Manual time adjustment (+/-) using delta
  adjustTime(deltaTime) {
    this.elapsedTime += deltaTime;
    if (this.elapsedTime < 0) {
      this.elapsedTime = 0; // Ensure elapsed time doesn't go below 0
    }
    this.updateDisplay(this.elapsedTime);
    if (this.isRunning && !this.isCountdown) {
      this.startTime = Date.now() - this.elapsedTime;
    }
  }

  // Sets time manually (for initialization)
  setTime(elapsedMs) {
    this.elapsedTime = elapsedMs;
    this.updateDisplay(this.elapsedTime);
  }

  // Updates the display (for live timer)
  update() {
    this.elapsedTime = Date.now() - this.startTime;
    this.updateDisplay(this.elapsedTime);
  }

  // Formats and displays the time (for live timer)
  updateDisplay(elapsedMs) {
    const hours = Math.floor(elapsedMs / 3600000);
    const minutes = Math.floor((elapsedMs % 3600000) / 60000);
    const seconds = Math.floor((elapsedMs % 60000) / 1000);
    const milliseconds = elapsedMs % 1000;

    this.timerElement.textContent =
      `${hours.toString().padStart(2, '0')}:` +
      `${minutes.toString().padStart(2, '0')}:` +
      `${seconds.toString().padStart(2, '0')}.` +
      `${milliseconds.toString().padStart(3, '0')}`;
  }

  // Formats and displays the countdown (new method)
  updateCountdownDisplay(remainingMs) {
    const hours = Math.floor(remainingMs / 3600000);
    const minutes = Math.floor((remainingMs % 3600000) / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);

    this.timerElement.textContent =
      `Starts in ${hours.toString().padStart(2, '0')}h ` +
      `${minutes.toString().padStart(2, '0')}m ` +
      `${seconds.toString().padStart(2, '0')}s`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const raceTimer = new RaceTimer();
  const race = getStoredRace();

  if (race) {
    const { timeStarted, timeFinished } = race.raceData;
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
});

function getStoredRace() {
  const stored = localStorage.getItem('storedRace');
  return stored ? JSON.parse(stored) : null;
}
const raceTimer = {
  timerElement: document.querySelector('#race-timer'),
  liveIndicator: document.querySelector('#live-indicator'),
  startTime: null,
  timerInterval: null,
  elapsedTime: 0,
  isRunning: false,
  isCountdown: false,
  isFinished: false,
  maxDuration: 24 * 60 * 60 * 1000,

  start() {
    if (this.isRunning) return;

    this.startTime = Date.now() - this.elapsedTime;
    this.isRunning = true;
    this.elapsedTime = 0;


    if (this.liveIndicator) {
      this.liveIndicator.textContent = '● LIVE';
      this.liveIndicator.style.color = 'red';
    }

    this.timerInterval = setInterval(() => this.update(), 10);
  },

  startCountdown(targetTime) {
    if (this.isRunning) return;

    this.isCountdown = true;

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
        this.updateTimerElementForCountdown(remaining);
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

  setTime(elapsed) {
    this.elapsedTime = elapsed;
    this.updateTimerElement(this.elapsedTime);
  },

  update() {
    this.elapsedTime = Date.now() - this.startTime;
    this.updateTimerElement(this.elapsedTime);
  },

  updateTimerElement(elapsed) {
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

  updateTimerElementForCountdown(timeRemaining) {
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

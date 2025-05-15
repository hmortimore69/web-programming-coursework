/**
 * Race timer management object with countdown, live timing, and status indicators.
 * @namespace raceTimer
 */
const raceTimer = {
  // DOM Elements
  timerElement: document.querySelector('#race-timer'), // Main timer display element
  liveIndicator: document.querySelector('#live-indicator'),
  
  // Timer state properties
  startTime: null, // Timestamp when timer started
  timerInterval: null, // Reference to the interval
  elapsedTime: 0, // Current elapsed time in ms
  isRunning: false, // Whether timer is actively counting
  isCountdown: false, // Whether in countdown mode
  isFinished: false, // Whether race is finished
  maxDuration: 24 * 60 * 60 * 1000, // 24 hour maximum duration
  online: navigator.onLine, // Current connection status

  /**
   * Initialize timer with event listeners
   */
  init() {
    window.addEventListener('online', this.updateConnection.bind(this)),
    window.addEventListener('offline', this.updateConnection.bind(this))
  },

  /**
   * Start the race timer
   */
  start() {
    if (this.isRunning) return; // Prevent duplicate starts
  
    // Clear any existing countdown interval
    if (this.isCountdown) {
      clearInterval(this.timerInterval);
      this.isCountdown = false;
    }
  
    // Set start time accounting for any existing elapsed time
    this.startTime = Date.now() - this.elapsedTime;
    this.isRunning = true;
    this.elapsedTime = 0;
  
    // Update live indicator
    if (this.liveIndicator) {
      this.liveIndicator.textContent = '● LIVE';
      this.liveIndicator.style.color = this.online ? 'red' : 'orange';
    }
  
    // Start update loop (10ms precision)
    this.timerInterval = setInterval(() => this.update(), 10);
  },

  /**
   * Update connection to be called by timestamp manager
   */
  updateConnection() {    
    this.online = navigator.onLine;
  },

  /**
   * Start countdown to target time
   * @param {number} targetTime - Timestamp when countdown ends
   */
  startCountdown(targetTime) {
    if (this.isRunning) return;

    this.isCountdown = true;

    // Set up countdown interval (10ms precision)
    this.timerInterval = setInterval(() => {
      const now = Date.now();
      const remaining = targetTime - now;

      if (remaining <= 0) {
        // Countdown complete
        clearInterval(this.timerInterval);
        this.isCountdown = false;
      } else {
        // Update status indicator based on remaining time
        if (remaining > 60000) {
          this.liveIndicator.textContent = '● WAITING';
          this.liveIndicator.style.color = 'grey';
        } else if (remaining > 10000) {
          this.liveIndicator.textContent = '● STARTS SOON';
          this.liveIndicator.style.color = 'orange';
        } else {
          this.liveIndicator.textContent = '● STARTING';
          this.liveIndicator.style.color = 'orange';
        }
        this.updateTimerElementWithoutMs(remaining);
      }
    }, 10);
  },

  /**
   * Stop the timer
   */
  stop() {
    if (!this.isRunning) return;

    clearInterval(this.timerInterval);

    this.isRunning = false;
    this.isCountdown = false;
    this.elapsedTime = Date.now() - this.startTime;

    // Clear live indicator
    if (this.liveIndicator) {
      this.liveIndicator.textContent = '';
    }
  },

  /**
   * Mark race as finished
   */
  finish() {
    this.stop();
    this.isFinished = true;

    // Update indicator to finished state
    if (this.liveIndicator) {
      this.liveIndicator.textContent = '● FINISHED';
      this.liveIndicator.style.color = 'green';
    }
  },

  /**
   * Set timer to specific elapsed time
   * @param {number} elapsed - Time in milliseconds
   */
  setTime(elapsed) {
    this.elapsedTime = elapsed;
    this.updateTimerElement(this.elapsedTime);
  },

  /**
   * Update timer display with current elapsed time
   */
  update() {
    this.elapsedTime = Date.now() - this.startTime;
    this.updateTimerElement(this.elapsedTime);
  },

  /**
   * Format and display elapsed time (HH:MM:SS.mmm)
   * @param {number} elapsed - Time in milliseconds
   */
  updateTimerElement(elapsed) {
    // Calculate time components
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const milliseconds = elapsed % 1000;

    // Format with leading zeros
    this.timerElement.textContent =
        `${hours.toString().padStart(2, '0')}:` +
        `${minutes.toString().padStart(2, '0')}:` +
        `${seconds.toString().padStart(2, '0')}.` +
        `${milliseconds.toString().padStart(3, '0')}`;
  },

  /**
   * Format and display countdown time wihtout miliseconds (Xd XXh XXm XXs)
   * @param {number} timeRemaining - Time in milliseconds
   */
  updateTimerElementWithoutMs(timeRemaining) {
    // Calculate time components
    const days = Math.floor(timeRemaining / 86400000);
    const hours = Math.floor((timeRemaining % 86400000) / 3600000);
    const minutes = Math.floor((timeRemaining % 3600000) / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);

    // Format with leading zeros
    this.timerElement.textContent =
          `Starts in ${days.toString().padStart(2, '0')}d ` +
          `${hours.toString().padStart(2, '0')}h ` +
          `${minutes.toString().padStart(2, '0')}m ` +
          `${seconds.toString().padStart(2, '0')}s`;
  },
};
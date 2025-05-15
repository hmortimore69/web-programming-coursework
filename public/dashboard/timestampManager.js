/**
 * Manages race timestamps including recording, staging, and submitting them.
 * @namespace TimestampManager
 */
const TimestampManager = {
  working: [], // Timestamps stored without assignment
  staged: [], // Timestamps assigned but not submitted
  selected: null, // Currently selected timestamp ID
  raceStartTime: null, // Race start time

  /**
   * Initialize the timestamp manager
   * @param {string} raceId - The ID of the current race
   */
  init(raceId) {
    this.raceId = raceId;
    this.load(); // Load saved data from localStorage
    this.renderAll(); // Render all timestamp lists
    this.bindEvents(); // Set up event listeners
    this.updateSubmitButtonState(); // Configure submit button
    this.renderTimestampDropdowns(); // Populate marshal selection
  },

  /**
   * Load saved timestamp data from localStorage
   */
  load() {
    try {
      const storedRace = JSON.parse(localStorage.getItem('storedRace'));
      const storedData = JSON.parse(localStorage.getItem('raceTimestamps'));

      // Reset if no data or race ID mismatch (different race)
      if (!storedData || (storedRace && storedData.raceId !== storedRace.raceId)) {
        this.working = [];
        this.staged = [];
        return;
      }

      // Load stored data
      this.working = storedData.working || [];
      this.staged = storedData.staged || [];
      this.raceStartTime = storedRace?.timeStarted ? new Date(storedRace.timeStarted) : null;
    } catch (e) {
      console.error('Error parsing timestamp data:', e);
      this.working = [];
      this.staged = [];
    }
  },

  /**
   * Bind all DOM event listeners
   */
  bindEvents() {
    // Button event handlers
    document.querySelector('#record-timestamp-button').addEventListener('click', this.record.bind(this));
    document.querySelector('#assign-timestamp-button').addEventListener('click', this.assign.bind(this));
    document.querySelector('#submit-timestamps-button').addEventListener('click', this.submit.bind(this));

    // Online/offline status handlers
    window.addEventListener('online', this.handleOnlineStatus.bind(this));
    window.addEventListener('offline', this.handleOnlineStatus.bind(this));
  },

  /**
   * Handle online/offline status changes
   */
  async handleOnlineStatus() {
    raceTimer.online = navigator.onLine;
    this.updateSubmitButtonState();

    if (raceTimer.online) {
      try {
        // Refresh race data when coming back online
        const response = await fetch(`/api/races/${JSON.parse(localStorage.getItem('storedRace'))?.raceId}`);
        if (!response.ok) throw new Error(`Response Status: ${response.status}`);
        
        const raceDetails = await response.json();
        
        // Update stored race data
        localStorage.removeItem('storedRace');
        localStorage.setItem('storedRace', JSON.stringify(raceDetails));
      } catch (error) {
        throw Error(error);
      }

      // Convert any offline timestamps to online format
      this.convertOfflineTimestamps();
    }

    this.save(); // Persist current state
  },

  /**
   * Update submit button state based on online status
   */
  updateSubmitButtonState() {
    const submitButton = document.querySelector('#submit-timestamps-button');
    if (!submitButton) return;
    
    submitButton.disabled = !raceTimer.online;
    submitButton.title = raceTimer.online 
      ? 'Submit timestamps to server' 
      : 'Submission requires internet connection';
    
    // Visual feedback
    submitButton.classList.toggle('disabled-button', !raceTimer.online);
    submitButton.classList.toggle('enabled-button', raceTimer.online);
  },

  /**
   * Render timestamp checkpoint and marshal dropdowns
   */
  renderTimestampDropdowns() {
    const marshalDropdown = document.querySelector('#marshal-select');
    const checkpointDropdown = document.querySelector('#checkpoint-select');
    
    // Clear existing options
    marshalDropdown.innerHTML = ''; 
    checkpointDropdown.innerHTML = ''; 
    
    // Add default option for Marshal
    const defaultMarshalOption = document.createElement('option');
    defaultMarshalOption.value = '';
    defaultMarshalOption.textContent = 'Select a Marshal';
    marshalDropdown.appendChild(defaultMarshalOption);

    // Add default options for Checkpoint
    const defaultCheckpointOption = document.createElement('option');
    defaultCheckpointOption.value = '';
    defaultCheckpointOption.textContent = 'Select a Checkpoint';
    checkpointDropdown.appendChild(defaultCheckpointOption);
    
    // Add marshal options from stored race data
    const marshals = JSON.parse(localStorage.getItem('storedRace')).marshals || [];
    for (const marshal of marshals) {
      const option = document.createElement('option');
      option.value = `${marshal.firstName} ${marshal.lastName}`;
      option.textContent = `${marshal.firstName} ${marshal.lastName}`;
      marshalDropdown.appendChild(option);
    }

    // Add checkpoint options from stored race data
    const checkpoints = JSON.parse(localStorage.getItem('storedRace')).checkpoints || [];
    for (const checkpoint of checkpoints) {
      const option = document.createElement('option');
      option.value = `${checkpoint.checkpointId}`;
      option.textContent = `${checkpoint.checkpointName} (${checkpoint.checkpointOrder})`;
      checkpointDropdown.appendChild(option);
    }

    const finishCheckpointOption = document.createElement('option');
    finishCheckpointOption.value = 'Finish';
    finishCheckpointOption.textContent = 'Finish';
    checkpointDropdown.appendChild(finishCheckpointOption);
  },

  /**
   * Record a new timestamp
   */
  record() {
    let timestamp;
    
    if (raceTimer.online) {
      // Online recording - use elapsed time from race timer
      timestamp = {
        id: Date.now(),
        raceId: this.raceId,
        time: raceTimer.elapsedTime,
        type: 'online'
      };
    } else {
      // Offline recording logic
      if (this.raceStartTime && raceTimer.isLive) {
        // Offline but with active timer - use elapsed time
        timestamp = {
          id: Date.now(),
          raceId: this.raceId,
          time: raceTimer.elapsedTime,
          type: 'online' // Mark as online since it's using the timer
        };
      } else {
        // Full offline mode - record actual timestamp
        timestamp = {
          id: Date.now(),
          raceId: this.raceId,
          time: Date.now(), // Current system time
          type: 'offline'
        };
      }
    }

    this.working.push(timestamp);
    this.save();
    this.renderAll();
  },

  /**
   * Convert offline timestamps to online format when connection is restored
   */
  async convertOfflineTimestamps() {
    if (!raceTimer.online || !this.raceStartTime) return;
    
    try {
      const convertTimestamps = (array) => {
        return array.map(t => {
          if (t.type === 'offline') {
            const recordedTime = new Date(t.time);
            return {
              ...t,
              time: recordedTime - this.raceStartTime, // Convert to elapsed time
              type: 'online',
              converted: true,
              conversionTime: Date.now()
            };
          }
          return t;
        });
      }

      // Process both working and staged arrays
      this.working = convertTimestamps(this.working);
      this.staged = convertTimestamps(this.staged);

      this.save();
      this.renderAll();
    } catch (error) {
      console.error('Failed to convert timestamps:', error);
    }
  },

  /**
   * Assign a bib number to selected timestamp
   */
  assign() {
    const bibNumber = document.querySelector('#racer-number-input').value;
    if (!bibNumber || !this.selected) {
      // TODO: Add validation for valid bib numbers
      return;
    }

    // Move timestamp from working to staged with bib number
    const index = this.working.findIndex(t => t.id === this.selected);
    if (index !== -1) {
      const timestamp = this.working.splice(index, 1)[0];
      timestamp.bibNumber = bibNumber;
      this.staged.push(timestamp);
      this.selected = null;
      this.save();
      this.renderAll();
      document.querySelector('#racer-number-input').value = ''; // Clear input
    }
  },

  /**
   * Submit staged timestamps to server
   */
  async submit() {
    const timestampErrorElement = document.querySelector('#timestamp-error-message');
    timestampErrorElement.style.color = 'red';

    // Validation checks
    if (this.staged.length === 0) {
      timestampErrorElement.textContent = 'Stage the timestamps you want to commit.';
      return;
    }

    const submittedBy = document.querySelector('#marshal-select').value;
    if (!submittedBy) {
      timestampErrorElement.textContent = 'Select a marshal.';
      return;
    }

    const checkpoint = document.querySelector('#checkpoint-select').value;
    if (!checkpoint) {
      timestampErrorElement.textContent = 'Select a checkpoint.';
      return;
    }
    
    // Prepare submission data
    const data = [...this.staged];
    const action = 'submit-results';
    const raceId = this.raceId;

    try {
      const response = await fetch(`/api/update-race`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raceId,
          action,
          data,
          submittedBy,
          checkpoint
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Response Status: ${response.status}`);
      }

      timestampErrorElement.textContent = ''; // Clear errors on success
    } catch (error) {
      console.error(`Error submitting timestamps:`, error);
      // TODO: Add user feedback for submission errors
    }

    // Clear staged timestamps after submission
    this.staged = [];
    this.save();
    this.renderAll();
  },

  /**
   * Render both working and staged timestamp lists
   */
  renderAll() {
    this.render('working', this.working);
    this.render('staged', this.staged);
  },

  /**
   * Render a timestamp list
   * @param {string} area - Either 'working' or 'staged'
   * @param {Array} timestamps - Array of timestamp objects
   */
  render(area, timestamps) {
    const tbody = document.querySelector(`#${area}-timestamps-list`);
    tbody.innerHTML = ''; // Clear existing content

    for (const ts of timestamps) {
      const templateId = `${area}-timestamp-template`;
      const template = document.querySelector(`#${templateId}`);
      const clone = template.content.cloneNode(true);
      const row = clone.querySelector('tr');

      // Set row attributes
      row.dataset.id = ts.id;
      if (ts.id === this.selected) row.style.backgroundColor = '#e6f7ff'; // Highlight selected

      // Format time display
      const timeCell = row.querySelector('.timestamp-cell');
      if (ts.type === 'online') {
        timeCell.textContent = this.formatTime(ts.time);
      } else {
        timeCell.textContent = `[OFFLINE] Recorded at: ${this.formatOfflineTimestamp(ts.time)}`;
        timeCell.style.color = 'orange'; // Visual distinction for offline
      }

      // Add bib number for staged timestamps
      if (area == 'staged') {
        const racerCell = row.querySelector('.racer-number-cell');
        racerCell.textContent = ts.bibNumber || 'Not assigned';
      }

      // Set up button event handlers
      this.setupRowButtons(row, ts, area);
      
      tbody.appendChild(row);
    }
  },

  /**
   * Set up event handlers for row buttons
   * @param {HTMLElement} row - The table row element
   * @param {Object} ts - The timestamp object
   * @param {string} area - Either 'working' or 'staged'
   */
  setupRowButtons(row, ts, area) {
    // Select button
    const selectButton = row.querySelector('.select-action');
    if (selectButton) {
      selectButton.dataset.id = ts.id;
      selectButton.addEventListener('click', () => {
        this.selected = parseInt(selectButton.dataset.id);
        this.renderAll();
      });
    }

    // Delete button (working area only)
    const deleteButton = row.querySelector('.delete-timestamp-button');
    if (deleteButton) {
      deleteButton.dataset.id = ts.id;
      deleteButton.addEventListener('click', () => {
        this.working = this.working.filter(t => t.id !== parseInt(deleteButton.dataset.id));
        this.save();
        this.renderAll();
      });
    }

    // Unstage button (staged area only)
    const unstageButton = row.querySelector('.unstage-action');
    if (unstageButton) {
      unstageButton.dataset.id = ts.id;
      unstageButton.addEventListener('click', () => {
        const id = parseInt(unstageButton.dataset.id);
        const index = this.staged.findIndex(t => t.id === id);
        if (index !== -1) {
          this.working.push(this.staged.splice(index, 1)[0]);
          this.save();
          this.renderAll();
        }
      });
    }
  },

  /**
   * Save current state to localStorage
   */
  save() {
    const dataToStore = {
      working: this.working,
      staged: this.staged,
      raceId: this.raceId,
      online: raceTimer.online,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('raceTimestamps', JSON.stringify(dataToStore));
  },

  /**
   * Format elapsed time (HH:MM:SS.mmm)
   * @param {number} ms - Time in milliseconds
   * @returns {string} Formatted time string
   */
  formatTime(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const msRemain = ms % 1000;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${msRemain.toString().padStart(3, '0')}`;
  },

  /**
   * Format offline timestamp (HH:MM:SS.mmm)
   * @param {number} unixTimestamp - Unix timestamp in ms
   * @returns {string} Formatted time string
   */
  formatOfflineTimestamp(unixTimestamp) {
    const date = new Date(unixTimestamp);
    return `${date.getHours().toString().padStart(2, '0')}:` +
           `${date.getMinutes().toString().padStart(2, '0')}:` +
           `${date.getSeconds().toString().padStart(2, '0')}.` +
           `${date.getMilliseconds().toString().padStart(3, '0')}`;
  },
};
/**
 * Manages conflicts with timestamps.
 * Provides UI for reviewing and accepting/rejecting timestamps.
 * @class ConflictManager
 */
class ConflictManager {
  /**
   * Initialize conflict manager with race ID from localStorage
   */
  constructor() {
    // Get race ID from stored race data
    this.raceId = JSON.parse(localStorage.getItem('storedRace')).raceId;
    this.conflicts = []; // Array to store conflict data
    this.init(); // Start initialization
  }

  /**
   * Initialize conflict manager - load data and setup UI
   * @async
   */
  async init() {
    await this.loadConflicts(); // Fetch conflict data
    this.setupEventListeners(); // Bind UI event handlers
  }

  /**
   * Load conflict data from server API
   * @async
   */
  async loadConflicts() {
    try {
      const response = await fetch(`/api/conflicts?raceId=${this.raceId}`);
      this.conflicts = await response.json(); // Store conflict data

      this.renderConflictList(); // Update list with new data
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  }

  /**
   * Render the list of conflicts to the DOM
   */
  renderConflictList() {
    const container = document.querySelector('#conflict-list');
    container.innerHTML = ''; // Clear existing content

    // Create a card for each conflict
    for (const conflict of this.conflicts) {
      const template = document.querySelector('#conflict-card-template');
      const card = template.content.cloneNode(true);

      // Set data attributes for conflict item
      const conflictItem = card.querySelector('.conflict-item');
      conflictItem.dataset.timeFinished = conflict.timeFinished;
      conflictItem.dataset.bibNumber = conflict.bibNumber;
      conflictItem.dataset.participantName = `${conflict.firstName} ${conflict.lastName}`;

      // Populate participant info
      card.querySelector('.participant-name').textContent = `${conflict.firstName} ${conflict.lastName}`;
      card.querySelector('.bib-number').textContent = `#${conflict.bibNumber}`;

      // Show current time if available
      if (conflict.currentTime) {
        card.querySelector('.timestamp-value').textContent = this.formatTime(conflict.currentTime);
      } else {
        card.querySelector('.current-time').remove(); // Hide section if no current time
      }

      // Render timestamp options for this conflict
      const optionsContainer = card.querySelector('.timestamp-options');
      this.renderTimestampOptions(optionsContainer, conflict);

      container.appendChild(card);
    }
  }

  /**
   * Render the available timestamp options for a conflict
   * @param {HTMLElement} container - DOM element to render into
   * @param {Object} conflict - Conflict data object
   */
  renderTimestampOptions(container, conflict) {
    const times = JSON.parse(conflict.pendingTimes || '[]');
    
    // Create an option for each pending timestamp
    for (const t of times) {
        const template = document.querySelector('#timestamp-option-template');
        const option = template.content.cloneNode(true);
        
        // Format and display the timestamp
        option.querySelector('.timestamp-value').textContent = this.formatTime(t.time);
        
        // Show comparison with current time if available
        if (t.current_time) {
            option.querySelector('.timestamp-comparison').textContent = 
                `Current time: ${this.formatTime(t.current_time)}`;
            option.querySelector('.timestamp-comparison').style.display = 'block';
        }
        
        // Show submission metadata
        option.querySelector('.timestamp-source').textContent = 
            `Submitted by ${t.submitted_by} at ${new Date(t.submitted_at).toLocaleString()}`;
        
        // Set data attributes for action buttons
        option.querySelector('.accept-timestamp-button').dataset.bib = conflict.bibNumber;
        option.querySelector('.accept-timestamp-button').dataset.time = t.time;
        
        option.querySelector('.reject-timestamp-button').dataset.bib = conflict.bibNumber;
        option.querySelector('.reject-timestamp-button').dataset.time = t.time;
        
        container.appendChild(option);
    }
  }

  /**
   * Format milliseconds into HH:MM:SS.mmm time string
   * @param {number} ms - Time in milliseconds
   * @returns {string} Formatted time string
   */
  formatTime(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const msRemain = ms % 1000;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${msRemain.toString().padStart(3, '0')}`;
  }

  /**
   * Set up all DOM event listeners
   */
  setupEventListeners() {
    // Refresh button listener
    document.querySelector('#refresh-conflicts').addEventListener('click', () => {
      this.loadConflicts();
    });

    // Event for accept/reject buttons
    document.querySelector('#conflict-list').addEventListener('click', async (e) => {
      if (e.target.classList.contains('accept-timestamp-button')) {
        // Accept Timestamp

        const bibNumber = e.target.dataset.bib;
        const time = e.target.dataset.time;
        await this.resolveConflict(bibNumber, time);
      }

      if (e.target.classList.contains('reject-timestamp-button')) {
        // Reject Timestamp

        const bibNumber = e.target.dataset.bib;
        const time = e.target.dataset.time;
        await this.rejectTimestamp(bibNumber, time);
      }
    });
  }

  /**
   * Resolve a conflict by accepting a timestamp
   * @async
   * @param {string} bibNumber - Participant's bib number
   * @param {number} acceptedTime - The timestamp being accepted (ms)
   */
  async resolveConflict(bibNumber, acceptedTime) {
    try {
      const response = await fetch('/api/resolve-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raceId: this.raceId,
          bibNumber,
          time: acceptedTime,
        }),
      });

      if (response.ok) {
        this.showSuccess('Timestamp accepted successfully');
        await this.loadConflicts(); // Refresh data
      } else {
        throw new Error('Server error');
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  }

  /**
   * Reject a timestamp
   * @async
   * @param {string} bibNumber - Participant's bib number
   * @param {number} time - The timestamp being rejected (ms)
   */
  async rejectTimestamp(bibNumber, time) {
    try {
      const response = await fetch('/api/reject-timestamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raceId: this.raceId,
          bibNumber,
          time,
        }),
      });
  
      if (!response.ok) {
        console.error('Failed to reject timestamp');
      }
      await this.loadConflicts(); // Refresh data

    } catch (error) {
      console.error('Error rejecting timestamp:', error);
    }
  }
}

/**
 * Initialise conflict manager when DOM loads.
 * @event
 */document.addEventListener('DOMContentLoaded', () => {
  new ConflictManager();
});
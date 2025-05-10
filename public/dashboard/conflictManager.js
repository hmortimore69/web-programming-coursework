class ConflictManager {
  constructor() {
    this.raceId = JSON.parse(localStorage.getItem('storedRace')).raceId;
    this.conflicts = [];
    this.init();
  }

  async init() {
    await this.loadConflicts();
    this.setupEventListeners();
  }

  async loadConflicts() {
    try {
      const response = await fetch(`/api/conflicts?raceId=${this.raceId}`);
      this.conflicts = await response.json();

      this.renderConflictList();
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  }

  renderConflictList() {
    const container = document.querySelector('#conflict-list');

    container.innerHTML = '';
    for (const conflict of this.conflicts) {
      const template = document.querySelector('#conflict-card-template');
      const card = template.content.cloneNode(true);

      card.querySelector('.conflict-item').dataset.timeFinished = conflict.timeFinished;
      card.querySelector('.conflict-item').dataset.bibNumber = conflict.bibNumber;
      card.querySelector('.conflict-item').dataset.participantName = `${conflict.firstName} ${conflict.lastName}`;

      card.querySelector('.participant-name').textContent = `${conflict.firstName} ${conflict.lastName}`;
      card.querySelector('.bib-number').textContent = `#${conflict.bibNumber}`;

      if (conflict.currentTime) {
        card.querySelector('.timestamp-value').textContent = this.formatTime(conflict.currentTime);
      } else {
        card.querySelector('.current-time').remove();
      }

      const optionsContainer = card.querySelector('.timestamp-options');
      this.renderTimestampOptions(optionsContainer, conflict);

      container.appendChild(card);
    }
  }

  renderTimestampOptions(container, conflict) {
    const times = JSON.parse(conflict.pendingTimes || '[]');
    
    for (const t of times) {
        const template = document.querySelector('#timestamp-option-template');
        const option = template.content.cloneNode(true);
        
        option.querySelector('.timestamp-value').textContent = this.formatTime(t.time);
        
        // Show comparison with current time if it exists
        if (t.current_time) {
            option.querySelector('.timestamp-comparison').textContent = 
                `Current time: ${this.formatTime(t.current_time)}`;
            option.querySelector('.timestamp-comparison').style.display = 'block';
        }
        
        option.querySelector('.timestamp-source').textContent = 
            `Submitted by ${t.submitted_by} at ${new Date(t.submitted_at).toLocaleString()}`;
        
        // Set data attributes for both accept and reject buttons
        option.querySelector('.accept-button').dataset.bib = conflict.bibNumber;
        option.querySelector('.accept-button').dataset.time = t.time;
        
        option.querySelector('.reject-button').dataset.bib = conflict.bibNumber;
        option.querySelector('.reject-button').dataset.time = t.time;
        
        container.appendChild(option);
    }
  }

  formatTime(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const msRemain = ms % 1000;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${msRemain.toString().padStart(3, '0')}`;
  }

  setupEventListeners() {
    document.querySelector('#refresh-conflicts').addEventListener('click', () => {
      this.loadConflicts();
    });

    // Accept/reject buttons
    document.querySelector('#conflict-list').addEventListener('click', async (e) => {
      if (e.target.classList.contains('accept-timestamp-button')) {
        const bibNumber = e.target.dataset.bib;
        const time = e.target.dataset.time;
        await this.resolveConflict(bibNumber, time);
      }

      if (e.target.classList.contains('reject-timestamp-button')) {
        const bibNumber = e.target.dataset.bib;
        const time = e.target.dataset.time;
        await this.rejectTimestamp(bibNumber, time);
      }
    });
  }

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
        await this.loadConflicts();
      } else {
        throw new Error('Server error');
      }
    } catch (error) {
      console.error('Failed to resolve conflict. Please try again.');
    }
  }

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
  
      const result = await response.json();
      
      if (response.ok) {
        await this.loadConflicts();
      } else {
        throw new Error(result.error || 'Failed to reject timestamp');
      }
    } catch (error) {
      console.error(error.message);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ConflictManager();
});

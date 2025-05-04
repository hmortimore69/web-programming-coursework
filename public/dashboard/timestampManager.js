const TimestampManager = {
  working: [],
  staged: [],
  selected: null,

  init(raceId) {
    this.raceId = raceId;
    this.load();
    this.renderAll();
    this.bindEvents();
  },

  load() {
    try {
      const storedRace = JSON.parse(localStorage.getItem('storedRace'));
      const storedData = JSON.parse(localStorage.getItem('raceTimestamps'));

      if (!storedData || (storedRace && storedData.raceId !== storedRace.raceId)) {
        this.working = [];
        this.staged = [];
        return;
      }

      this.working = storedData.working || [];
      this.staged = storedData.staged || [];
    } catch (e) {
      console.error('Error parsing timestamp data:', e);
      this.working = [];
      this.staged = [];
    }
  },

  bindEvents() {
    document.querySelector('#record-timestamp-button').addEventListener('click', this.record.bind(this));
    document.querySelector('#assign-timestamp-button').addEventListener('click', this.assign.bind(this));
    document.querySelector('#submit-timestamps-button').addEventListener('click', this.submit.bind(this));
  },

  record() {
    if (!raceTimer.isRunning) return; // add an alert

    const timestamp = {
      id: Date.now(),
      raceId: this.raceId,
      time: raceTimer.elapsedTime,
    };

    this.working.push(timestamp);
    this.save();
    this.renderAll();
  },

  assign() {
    const bibNumber = document.querySelector('#racer-number-input').value;
    if (!bibNumber || !this.selected) {
      // add an alert
      return;
    }

    const index = this.working.findIndex(t => t.id === this.selected);
    if (index !== -1) {
      const timestamp = this.working.splice(index, 1)[0];
      timestamp.bibNumber = bibNumber;
      this.staged.push(timestamp);
      this.selected = null;
      this.save();
      this.renderAll();
      document.querySelector('#racer-number-input').value = '';
    }
  },

  async submit() {
    if (this.staged.length === 0) return; // add an alert
    
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

    this.staged = [];
    this.save();
    this.renderAll();
    // add an alert
  },

  renderAll() {
    this.render('working', this.working);
    this.render('staged', this.staged);
  },

  render(area, timestamps) {
    const tbody = document.querySelector(`#${area}-timestamps-list`);
    tbody.innerHTML = '';

    timestamps.forEach(ts => {
      const templateId = `${area}-timestamp-template`;
      const template = document.getElementById(templateId);
      const clone = template.content.cloneNode(true);
      const row = clone.querySelector('tr');

      row.dataset.id = ts.id;
      if (ts.id === this.selected) row.style.backgroundColor = '#e6f7ff';

      // Set the timestamp
      const timeCell = row.querySelector('.timestamp-cell');
      timeCell.textContent = this.formatTime(ts.time);

      // Set bib number
      if (area == 'staged') {
        const racerCell = row.querySelector('.racer-number-cell');
        racerCell.textContent = ts.bibNumber || 'Not assigned';
      }

      // Add event listeners to buttons
      const selectButton = row.querySelector('.select-action');
      if (selectButton) {
        selectButton.dataset.id = ts.id;
        selectButton.addEventListener('click', () => {
          this.selected = parseInt(selectButton.dataset.id);
          this.renderAll();
        });
      }

      const deleteButton = row.querySelector('.delete-action');
      if (deleteButton) {
        deleteButton.dataset.id = ts.id;
        deleteButton.addEventListener('click', () => {
          this.working = this.working.filter(t => t.id !== parseInt(deleteButton.dataset.id));
          this.save();
          this.renderAll();
        });
      }

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

      tbody.appendChild(row);
    });
  },

  save() {
    const storageKey = 'raceTimestamps';
    const dataToStore = {
      working: this.working,
      staged: this.staged,
      raceId: this.raceId,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToStore));
  },

  formatTime(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const msRemain = ms % 1000;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${msRemain.toString().padStart(3, '0')}`;
  },
};

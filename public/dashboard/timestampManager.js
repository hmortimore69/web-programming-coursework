const TimestampManager = {
  working: [],
  staged: [],
  selected: null,
  boundHandleOnlineStatus: null,

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

  async handleOnlineStatus() {
    raceTimer.online = navigator.onLine;
    raceTimer.online = raceTimer.online;

    if (raceTimer.online) {
      try {
        const response = await fetch(`/api/races/${JSON.parse(localStorage.getItem('storedRace'))?.raceId}`);
        if (!response.ok) throw new Error(`Response Status: ${response.status}`);
        
        const raceDetails = await response.json();
        
        // Clear previously saved race data and store current race for offline use
        localStorage.removeItem('storedRace');
        localStorage.setItem('storedRace', JSON.stringify(raceDetails));
      } catch (error) {
        throw Error(error);
      }

      this.convertOfflineTimestamps();
    }

    this.save();
  },

  record() {
    const timestamp = {
      id: Date.now(),
      raceId: this.raceId,
      // Store differently based on online status
      ...(raceTimer.online ? {
        time: raceTimer.elapsedTime,
        type: 'online'
      } : {
        time: Date.now(),
        type: 'offline'
      })
    };

    this.working.push(timestamp);
    this.save();
    this.renderAll();
  },

  async convertOfflineTimestamps() {
    if (!raceTimer.online) return;
    
    try {
      const response = await fetch(`/api/races/${this.raceId}`);
      if (!response.ok) throw new Error('Failed to fetch race data');
      
      const raceData = await response.json();
      const raceStartTime = new Date(raceData.timeStarted);

      

      // Helper function to convert timestamps in an array
      const convertTimestamps = (array) => {
        return array.map(t => {
          if (t.type === 'offline') {
            const recordedTime = new Date(t.time);
            return {
              ...t,
              time: recordedTime - raceStartTime,
              state: 'online',
              converted: true,
              conversionTime: Date.now()
            };
          }
          return t;
        });
      }

      // Convert timestamps for both this.working and this.staged
      this.working = convertTimestamps(this.working);
      this.staged = convertTimestamps(this.staged);

      this.save();
      this.renderAll();
    } catch (error) {
      console.error('Failed to convert timestamps:', error);
    }
  },

  assign() {
    const bibNumber = document.querySelector('#racer-number-input').value;
    if (!bibNumber || !this.selected) {
      // add validation to ensure bib is an actual runner
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
  
      if (!response.ok) {
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

    for (const ts of timestamps) {
      const templateId = `${area}-timestamp-template`;
      const template = document.querySelector(`#${templateId}`);
      const clone = template.content.cloneNode(true);
      const row = clone.querySelector('tr');

      row.dataset.id = ts.id;
      if (ts.id === this.selected) row.style.backgroundColor = '#e6f7ff';

      // Set the timestamp
      const timeCell = row.querySelector('.timestamp-cell');
      if (ts.state === 'online') {
        timeCell.textContent = this.formatTime(ts.time);
      } else {
        timeCell.textContent = `[OFFLINE] Recorded at: ${this.formatOfflineTimestamp(ts.time)}`;
        timeCell.style.color = 'orange';
      }

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

      const deleteButton = row.querySelector('.delete-timestamp-button');
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
    }
  },

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

  formatTime(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const msRemain = ms % 1000;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${msRemain.toString().padStart(3, '0')}`;
  },

  formatOfflineTimestamp(unixTimestamp) {
    const date = new Date(unixTimestamp);
    const h = date.getHours(); // Get hours in local time
    const m = date.getMinutes(); // Get minutes in local time
    const s = date.getSeconds(); // Get seconds in local time
    const msRemain = date.getMilliseconds(); // Get milliseconds in local time
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${msRemain.toString().padStart(3, '0')}`;
  },
};

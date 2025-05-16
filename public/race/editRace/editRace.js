/**
 * Initializes the race edit form when DOM is loaded
 * Loads race data from localStorage and sets up form for editing
 */
document.addEventListener('DOMContentLoaded', function () {
  // Load the race data from localStorage
  const storedRace = JSON.parse(localStorage.getItem('storedRace'));

  // Redirect if no race data found
  if (!storedRace) {
    console.error('No race data found in localStorage');
    window.location.href = `/`;
    return;
  }

  // Initialize form with race data
  populateForm(storedRace);

  // Set up form event handlers
  setupFormHandlers(storedRace);
});

/**
 * Populates the race editing form with existing race data.
 * 
 * @param {Object} raceData - The race data to populate the form with
 * @param {string} raceData.raceLocation
 * @param {number} raceData.scheduledStartTime
 * @param {number} raceData.scheduledDuration
 * @param {Array} raceData.checkpoints
 * @param {Array} raceData.marshals
 * @param {Array} raceData.participants
 */
function populateForm(raceData) {
  // Load basic race details
  if (raceData) {
    document.querySelector('#race-start-date').value = formatDateTimeForInput(raceData.scheduledStartTime) || '';
    document.querySelector('#race-location').value = raceData.raceLocation || '';
    document.querySelector('#race-duration').value = setTimeBoxFromMs(raceData.scheduledDuration) || '24:00';
  }

  // Load checkpoints
  const checkpointList = document.querySelector('#checkpoint-list');
  checkpointList.innerHTML = '';
  if (raceData.checkpoints?.length) {
    for (const checkpoint of raceData.checkpoints) {
      addCheckpoint(checkpoint);
    }
  }

  // Load marshals (skip first one as it's in template)
  const marshalList = document.querySelector('#marshal-list');
  if (raceData.marshals?.length > 1) {
    marshalList.innerHTML = ''; // Clear default template
    for (const marshal of raceData.marshals) {
      addMarshal(marshal);
    }
  } else if (raceData.marshals?.length === 1) {
    // Just update the existing template fields
    const marshal = raceData.marshals[0];
    document.querySelector('.marshal-first-name').dataset.marshalId = marshal.marshalId;
    document.querySelector('.marshal-first-name').value = marshal.firstName || '';
    document.querySelector('.marshal-last-name').value = marshal.lastName || '';
  }

  // Load participants
  const participantList = document.querySelector('#participant-list');
  participantList.innerHTML = '';
  if (raceData.participants?.length) {
    for (const participant of raceData.participants) {
      addParticipant(participant);
    }
  }
}

/**
 * Sets up event handlers for race editing form.
 * 
 * @function
 * @param {Object} originalRaceData - The original race data used to retrieve race ID
 */
function setupFormHandlers(originalRaceData) {
  // Store original race ID if it exists
  const raceId = originalRaceData.raceId || generateRaceId();

  // Form navigation handlers
  for (const button of document.querySelectorAll('.next-step')) {
    button.addEventListener('click', handleNextStep);
  }

  for (const button of document.querySelectorAll('.previous-step')) {
    button.addEventListener('click', handlePrevStep);
  }

  // Add item buttons
  document.querySelector('#add-checkpoint-button').addEventListener('click', () => {
    addCheckpoint();
  });

  document.querySelector('#add-marshal-button').addEventListener('click', () => {
    addMarshal();
  });

  document.querySelector('#add-participant-button').addEventListener('click', () => {
    addParticipant();
  });

  // Submit handler
  document.querySelector('#submit-button').addEventListener('click', (e) => {
    e.preventDefault();
    submitUpdatedRace(raceId);
  });

  // Tab click handlers
  for (const tab of document.querySelectorAll('.progress-tab')) {
    tab.addEventListener('click', handleTabClick);
  }
}

/**
 * Submits the updated race data to the backend.
 * 
 * @async
 * @function
 * @param {string} raceId - The unique ID of the race
 */
async function submitUpdatedRace(raceId) {
  if (!validateForm()) {
    return;
  }

  const data = collectFormData();
  const action = 'edit-race';
  
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
      window.location.href = `/race/${raceId}`;
    } else {
      throw new Error(`Response Status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error performing action: ${action}`, error);
  }
}

/**
 * Collects form values into a race data object.
 * 
 * @function
 * @returns {Object} Collected race data from form
 */
function collectFormData() {
  const raceData = {
    raceDetails: {
      scheduledStartTime: document.querySelector('#race-start-date').value,
      raceLocation: document.querySelector('#race-location').value,
      scheduledDuration: document.querySelector('#race-duration').value
    },
    checkpoints: [],
    marshals: [],
    participants: [],
  };

  // Collect checkpoints
  for (const checkpoint of document.querySelectorAll('.checkpoint-details')) {
    raceData.checkpoints.push({
      checkpointId: checkpoint.querySelector('.checkpoint-name').dataset.checkpointId ? checkpoint.querySelector('.checkpoint-name').dataset.checkpointId : null,
      checkpointName: checkpoint.querySelector('.checkpoint-name').value,
      checkpointOrder: checkpoint.querySelector('.checkpoint-order').value,
    });
  }

  // Collect marshals
  for (const marshal of document.querySelectorAll('.marshal-details')) {
    raceData.marshals.push({
      marshalId: marshal.querySelector('.marshal-first-name').dataset.marshalId ? marshal.querySelector('.marshal-first-name').dataset.marshalId : null,
      firstName: marshal.querySelector('.marshal-first-name').value,
      lastName: marshal.querySelector('.marshal-last-name').value,
    });
  }

  // Collect participants
  for (const participant of document.querySelectorAll('.participant-details')) {
    raceData.participants.push({
      participantId: participant.querySelector('.participant-first-name').dataset.participantId ? participant.querySelector('.participant-first-name').dataset.participantId : null,
      firstName: participant.querySelector('.participant-first-name').value,
      lastName: participant.querySelector('.participant-last-name').value,
    });
  }

  return raceData;
}

/**
 * Adds a checkpoint row to the form.
 * 
 * @function
 * @param {Object} [checkpoint={}] - Optional checkpoint data to pre-fill
 */
function addCheckpoint(checkpoint = {}) {
  const template = document.querySelector('#new-checkpoint-template');
  const clone = template.content.cloneNode(true);

  if (checkpoint['checkpointId']) {
    clone.querySelector('.checkpoint-name').dataset.checkpointId = checkpoint.checkpointId;
  }
  if (checkpoint['checkpointName']) {
    clone.querySelector('.checkpoint-name').value = checkpoint.checkpointName;
  }
  if (checkpoint['checkpointOrder']) {
    clone.querySelector('.checkpoint-order').value = checkpoint.checkpointOrder;
  }

  clone.querySelector('.remove-checkpoint-button').addEventListener('click', function () {
    this.closest('.checkpoint-details').remove();
  });

  document.querySelector('#checkpoint-list').appendChild(clone);
}

/**
 * Adds a marshal row to the form.
 * 
 * @function
 * @param {Object} [marshal={}] - Optional marshal data to pre-fill
 */
function addMarshal(marshal = {}) {
  const template = document.querySelector('#new-marshal-template');
  const clone = template.content.cloneNode(true);

  if (marshal['marshalId']) {
    clone.querySelector('.marshal-first-name').dataset.marshalId = marshal.marshalId;
  }
  if (marshal['firstName']) {
    clone.querySelector('.marshal-first-name').value = marshal.firstName;
  }
  if (marshal['lastName']) {
    clone.querySelector('.marshal-last-name').value = marshal.lastName;
  }

  clone.querySelector('.remove-marshal-button').addEventListener('click', function () {
    this.closest('.marshal-details').remove();
  });

  document.querySelector('#marshal-list').appendChild(clone);
}

/**
 * Adds a participant row to the form.
 * 
 * @function
 * @param {Object} [participant={}] - Optional participant data to pre-fill
 */
function addParticipant(participant = {}) {
  const template = document.querySelector('#new-participant-template');
  const clone = template.content.cloneNode(true);

  if (participant['participantId']) {
    clone.querySelector('.participant-first-name').dataset.participantId = participant.participantId;
  }
  if (participant.firstName) {
    clone.querySelector('.participant-first-name').value = participant.firstName;
  }
  if (participant.lastName) {
    clone.querySelector('.participant-last-name').value = participant.lastName;
  }

  clone.querySelector('.remove-participant-button').addEventListener('click', function () {
    this.closest('.participant-details').remove();
  });

  document.querySelector('#participant-list').appendChild(clone);
}

/**
 * Validates the current step of the form.
 * 
 * @function
 * @returns {boolean} True if valid, false otherwise
 */
function validateForm() {
  let isValid = true;

  // Validate required fields in current step
  const currentStep = document.querySelector('.new-race-step.active');
  const requiredInputs = currentStep.querySelectorAll('input[required]');

  for (const input of requiredInputs) {
    if (!input.value.trim()) {
      input.classList.add('invalid-input');
      isValid = false;

      input.addEventListener('input', function clearValidation() {
        this.classList.remove('invalid-input');
        this.removeEventListener('input', clearValidation);
      }, { once: true });
    }
  }

  return isValid;
}

/**
 * Advances to the next form step if validation passes.
 * 
 * @function
 */
function handleNextStep() {
  if (!validateForm()) return;

  const steps = document.querySelectorAll('.new-race-step');
  const currentIndex = Array.from(steps).findIndex(step => step.classList.contains('active'));

  if (currentIndex < steps.length - 1) {
    steps[currentIndex].classList.remove('active');
    steps[currentIndex + 1].classList.add('active');
    updateProgressTabs(currentIndex + 1);
  }
}

/**
 * Moves to the previous step in the form.
 * 
 * @function
 */
function handlePrevStep() {
  const steps = document.querySelectorAll('.new-race-step');
  const currentIndex = Array.from(steps).findIndex(step => step.classList.contains('active'));

  if (currentIndex > 0) {
    steps[currentIndex].classList.remove('active');
    steps[currentIndex - 1].classList.add('active');
    updateProgressTabs(currentIndex - 1);
  }
}

/**
 * Handles tab click and navigates to the corresponding step if valid.
 * 
 * @function
 * @param {Event} event - Click event on a tab
 */
function handleTabClick(event) {
  const tab = event.currentTarget;
  const stepIndex = parseInt(tab.dataset.step);

  if (!validateForm()) return;

  const steps = document.querySelectorAll('.new-race-step');

  for (const step of steps) {
    step.classList.remove('active');
  }

  steps[stepIndex].classList.add('active');
  updateProgressTabs(stepIndex);
}

/**
 * Updates progress bar/tab styles based on the active step.
 * 
 * @function
 * @param {number} activeIndex - The index of the active tab/step
 */
function updateProgressTabs(activeIndex) {
  for (const [index, tab] of document.querySelectorAll('.progress-tab').entries()) {
    tab.classList.toggle('active', index === activeIndex);
    tab.classList.toggle('completed', index < activeIndex);
  }
}

/**
 * Formats a timestamp into a string usable by a datetime-local input.
 * 
 * @function
 * @param {string} dateString - ISO date string or timestamp
 * @returns {string} Formatted datetime string
 */
function formatDateTimeForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16);
}

/**
 * Converts a duration in milliseconds into HH:MM format.
 * 
 * @function
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Time string in HH:MM format
 */
function setTimeBoxFromMs(ms) {
  const date = new Date(ms);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Generates a random race ID string.
 * 
 * @function
 * @returns {string} A unique identifier
 */
function generateRaceId() {
  return 'race-' + Math.random().toString(36).substr(2, 9);
}

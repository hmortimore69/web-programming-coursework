document.addEventListener('DOMContentLoaded', function () {
  const steps = document.querySelectorAll('.new-race-step');
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.previous-step');
  const submitButton = document.querySelector('#submit-button');
  const progressTabs = document.querySelectorAll('.progress-tab');

  let currentStep = 0;
  const formData = {};

  for (const tab of progressTabs) {
    tab.addEventListener('click', handleTabClick);
  }

  /**
   * Updates the visibility of steps based on the current step index.
   * Only the active step will be visible.
   */
  function updateSteps() {
    for (const [index, step] of steps.entries()) {
      step.classList.toggle('active', index === currentStep);
    }
    
    for (const [index, tab] of progressTabs.entries()) {
      tab.classList.toggle('active', index === currentStep);
      tab.classList.toggle('completed', index < currentStep);
    }
  }

  function handleTabClick(event) {
    const tab = event.currentTarget;
    const stepIndex = parseInt(tab.dataset.step);
    
    // Validate current step before allowing navigation
    if (currentStep !== stepIndex) {
      if (!validateStep(currentStep)) {
        return; // Stay on current step if validation fails
      }
    }
    
    currentStep = stepIndex;
    updateSteps();
  }

  /**
   * Validates that all input fields in the current step are filled.
   * Displays a requirement message if any field is empty.
   * @param {number} stepIndex - The index of the step being validated.
   * @returns {boolean} - Returns true if all inputs are filled, otherwise false.
   */
  function validateStep(stepIndex, silent = false) {
    const step = steps[stepIndex];
    const inputs = step.querySelectorAll('input');
    let isValid = true;
  
    for (const input of inputs) {
      if (!input.value.trim()) {
        if (!silent) {
          input.classList.add('invalid-input');
          input.addEventListener('input', function clearInvalid() {
            this.classList.remove('invalid-input');
            this.removeEventListener('input', clearInvalid);
            validateStep(stepIndex); // Revalidate when user types
          }, { once: true });
        }
        isValid = false;
      }
    }
  
    // Update tab status
    if (!silent) {
      progressTabs[stepIndex].classList.toggle('invalid', !isValid);
    }
  
    return isValid;
  }

  /**
   * Handles the next button click event.
   * Validates the current step before allowing the transition.
   * Saves the form data of the current step.
   */
  function handleNextButtonClick() {
    if (!validateStep(currentStep)) return;

    saveData(currentStep);
    currentStep++;
    updateSteps();
  }

  /**
   * Handles the previous button click event.
   * Moves back one step in the form.
   */
  function handlePrevButtonClick() {
    currentStep--;
    updateSteps();
  }

  /**
   * Handles the submit button click event.
   * Saves the last step's form data and submits to the server.
   */
  async function handleSubmitButtonClick() {
    // Validate all steps first
    let allValid = true;
    
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i, true)) {
        progressTabs[i].classList.add('invalid');
        allValid = false;
      }
    }
    
    if (!allValid) {
      alert('Please fix all invalid fields before submitting');
      return;
    }
    
    saveData(currentStep);
    
    try {
      const response = await fetch(`/api/new-race`, {
        method: "POST",
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

  /**
   * Saves the form data of the current step.
   * @param {number} stepIndex - The index of the step being processed.
   */
  function saveData(stepIndex) {
    const step = steps[stepIndex];

    // Save specific data based on the current step
    switch (stepIndex) {
      case 0: // Race details saving
        saveDetails(step, '#race-details', ['#race-name', '#race-start-date', '#race-location', '#race-duration'], 'raceDetails');
        break;
      case 1: // Checkpoint saving
        saveDetails(step, '.checkpoint-details', ['.checkpoint-name', '.checkpoint-order'], 'checkpoints');
        break;
      case 2: // Marshall saving
        saveDetails(step, '.marshall-details', ['.marshall-first-name', '.marshall-last-name'], 'marshalls');
        break;
      case 3: // Participant saving
        saveDetails(step, '.participant-details', ['.participant-first-name', '.participant-last-name'], 'participants');
        break;
      default:
        break;
    }
  }

  /**
   * Saves details of each form step (checkpoints, marshalls, and participants).
   * @param {HTMLElement} step - The step element containing details div.
   * @param {string} selector - The CSS selector for the details container.
   * @param {string[]} fields - An array containing the identifiers for the fields to save.
   * @param {string} key - The key name for where details will get stored.
   */
  function saveDetails(step, selector, fields, key) {
    const details = step.querySelectorAll(selector);
    formData[key] = key === 'raceDetails' ? {} : []; // if race details, use object, otherwise list of objects
  
    if (key === 'raceDetails') {
      for (const field of fields) {
        formData[key][field] = step.querySelector(field).value;
      }
    } else {
      for (const detail of details) {
        const data = {};
        for (const field of fields) {
          data[field] = detail.querySelector(field).value;
        }
        formData[key].push(data);
      }
    }
  }

  addEventListenersToButtons(nextButtons, handleNextButtonClick);
  addEventListenersToButtons(prevButtons, handlePrevButtonClick);
  submitButton.addEventListener('click', handleSubmitButtonClick);

  // Set the first step as active
  updateSteps();
});

/**
 * Adds event listeners to a group of buttons.
 * @param {NodeList} buttons - List of related buttons.
 * @param {Function} handler - Function to handle button clicks.
 */
function addEventListenersToButtons(buttons, handler) {
  for (const button of buttons) {
    button.addEventListener('click', handler);
  }
}

/**
 * Adds the templates to different steps of the forms: checkpoints, participants, and marshalls.
 * @param {HTMLElement} listId - ID of the display div.
 * @param {HTMLTemplateElement} templateId - ID of the template to use.
 * @param {HTMLElement} removeButtonClass - Class of the remove button.
 */
function addItem(listId, templateId, removeButtonClass) {
  const list = document.querySelector(listId);
  const template = document.querySelector(templateId);

  const itemClone = template.content.cloneNode(true);
  list.appendChild(itemClone);

  const newItem = list.lastElementChild;
  const removeButton = newItem.querySelector(removeButtonClass);

  removeButton.addEventListener('click', () => {
    newItem.remove();
  });
}

// Adds addItem for each form step that requires the similar templates.
document.querySelector('#add-checkpoint-button').addEventListener('click', () => {
  addItem('#checkpoint-list', '#new-checkpoint-template', '.remove-checkpoint-button');
});

document.querySelector('#add-marshall-button').addEventListener('click', () => {
  addItem('#marshall-list', '#new-marshall-template', '.remove-marshall-button');
});

document.querySelector('#add-participant-button').addEventListener('click', () => {
  addItem('#participant-list', '#new-participant-template', '.remove-participant-button');
});
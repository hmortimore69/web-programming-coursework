document.addEventListener('DOMContentLoaded', function () {
  const steps = document.querySelectorAll('.new-race-step');
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.prev-step');
  const submitButton = document.querySelector('#submit-button');

  let currentStep = 0;
  const formData = {};

  /**
   * Updates the visibility of steps based on the current step index.
   * Only the active step will be visible.
   */
  function updateSteps() {
    for (const [index, step] of steps.entries()) {
      step.classList.toggle('active', index === currentStep);
    }
  }

  /**
   * Validates that all input fields in the current step are filled.
   * Displays a requirement message if any field is empty.
   * @param {number} stepIndex - The index of the step being validated.
   * @returns {boolean} - Returns true if all inputs are filled, otherwise false.
   */
  function validateStep(stepIndex) {
    const inputs = steps[stepIndex].querySelectorAll('input');
    const requirementMessage = document.querySelector('.user-feedback-message');

    for (const input of inputs) {
      if (!input.value) {
        requirementMessage.hidden = false;
        return false;
      }
    }
    requirementMessage.hidden = true;
    return true;
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
    if (!validateStep(currentStep)) return;
    
    saveData(currentStep);

    console.log(formData);
    
    try {
      const response = await fetch(`/api/admin/new-race`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) throw new Error(`Response Status: ${response.status}`);
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
        saveDetails(step, '#race-details', ['#race-name', '#race-start-date', '#race-duration'], 'raceDetails');
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
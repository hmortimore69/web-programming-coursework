/**
 * Initializes the new race form when DOM is loaded.
 * @event DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', function() {
  const steps = document.querySelectorAll('.new-race-step');
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.previous-step');
  const submitButton = document.querySelector('#submit-button');
  const progressTabs = document.querySelectorAll('.progress-tab');

  // State variables
  let currentStep = 0;
  const formData = {};

  // Initialize event listeners
  for (const tab of progressTabs) {
    tab.addEventListener('click', handleTabClick);
  }

  addEventListenersToButtons(nextButtons, handleNextButtonClick);
  addEventListenersToButtons(prevButtons, handlePrevButtonClick);
  submitButton.addEventListener('click', handleSubmitButtonClick);

  // Set initial state
  updateSteps();

  /**
   * Updates UI to reflect current step in multi-step form.
   * Shows active step and updates progress tabs.
   * @function updateSteps
   * @returns {void}
   */
  function updateSteps() {
    // Update step visibility
    for (const [index, step] of steps.entries()) {
      step.classList.toggle('active', index === currentStep);
    }
    
    // Update progress tabs
    for (const [index, tab] of progressTabs.entries()) {
      tab.classList.toggle('active', index === currentStep);
      tab.classList.toggle('completed', index < currentStep);
    }
  }

  /**
   * Handles progress tab clicks for direct step navigation.
   * @function handleTabClick
   * @param {Event} event - The click event
   * @returns {void}
   */
  function handleTabClick(event) {
    const tab = event.currentTarget;
    const stepIndex = parseInt(tab.dataset.step);
    
    // Validate current step before allowing navigation
    if (currentStep !== stepIndex) {
      if (!validateStep(currentStep)) {
        return; // Stay on current step if validation fails
      }
    }

    // Save current step
    saveData(currentStep);
    
    currentStep = stepIndex;
    updateSteps();
  }

  /**
   * Validates all required inputs in the specified step.
   * @function validateStep
   * @param {number} stepIndex - The index of the step to validate
   * @param {boolean} [silent=false] - Whether to show visual validation errors
   * @returns {boolean} True if all inputs are valid, false otherwise
   */
  function validateStep(stepIndex, silent = false) {
    const step = steps[stepIndex];
    const inputs = step.querySelectorAll('input[required]');
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
   * Handles next button clicks with validation and saving.
   * @function handleNextButtonClick
   * @returns {void}
   */
  function handleNextButtonClick() {
    if (!validateStep(currentStep)) return;

    saveData(currentStep);

    currentStep++;
    updateSteps();
  }

  /**
   * Handles previous button clicks to navigate back a step.
   * @function handlePrevButtonClick
   * @returns {void}
   */
  function handlePrevButtonClick() {
    currentStep--;
    updateSteps();
  }

  /**
   * Handles form submission with validation.
   * @async
   * @function handleSubmitButtonClick
   * @returns {Promise<void>}
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
    
    if (!allValid) return;
    
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
   * Saves form data from the current step.
   * @function saveData
   * @param {number} stepIndex - The index of the step being saved
   * @returns {void}
   */
  function saveData(stepIndex) {
    const step = steps[stepIndex];

    // Initialize arrays if they don't exist
    if (stepIndex === 1 && !formData.checkpoints) formData.checkpoints = [];
    if (stepIndex === 2 && !formData.marshals) formData.marshals = [];
    if (stepIndex === 3 && !formData.participants) formData.participants = [];

    // Save specific data based on the current step
    switch (stepIndex) {
      case 0: // Race details
        saveDetails(step, '#race-details', ['#race-name', '#race-start-date', '#race-location', '#race-duration'], 'raceDetails');
        break;
      case 1: // Checkpoints
        saveDetails(step, '.checkpoint-details', ['.checkpoint-name', '.checkpoint-order'], 'checkpoints');
        break;
      case 2: // Marshals
        saveDetails(step, '.marshal-details', ['.marshal-first-name', '.marshal-last-name'], 'marshals');
        break;
      case 3: // Participants
        saveDetails(step, '.participant-details', ['.participant-first-name', '.participant-last-name'], 'participants');
        break;
      default:
        break;
    }
  }

  /**
   * Saves form details to the formData object.
   * @function saveDetails
   * @param {HTMLElement} step - The step element containing the details
   * @param {string} selector - CSS selector for the details container
   * @param {string[]} fields - Array of field selectors to save
   * @param {string} key - The key in formData to store the values
   * @returns {void}
   */
  function saveDetails(step, selector, fields, key) {
    const details = step.querySelectorAll(selector);
    formData[key] = key === 'raceDetails' ? {} : []; // if race details, use object, otherwise list of objects
  
    if (key === 'raceDetails') {
      for (const field of fields) {
        const fieldName = field.substring(1); // Remove # from selector
        formData[key][fieldName] = step.querySelector(field).value;
      }
    } else {
      for (const detail of details) {
        const data = {};
        for (const field of fields) {
          const fieldName = field.substring(1); // Remove . from selector
          data[fieldName] = detail.querySelector(field).value;
        }
        formData[key].push(data);
      }
    }
  }
});

/**
 * Adds event listeners to multiple buttons with the same handler.
 * @function addEventListenersToButtons
 * @param {NodeList} buttons - Collection of button elements
 * @param {Function} handler - Click handler function
 * @returns {void}
 */
function addEventListenersToButtons(buttons, handler) {
  for (const button of buttons) {
    button.addEventListener('click', handler);
  }
}

/**
 * Adds a new item to a form section using a template.
 * @function addItem
 * @param {string} listId - ID selector for the container element
 * @param {string} templateId - ID selector for the template element
 * @param {string} removeButtonClass - Class selector for the remove button
 * @returns {void}
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

// Initialize dynamic form elements
document.querySelector('#add-checkpoint-button').addEventListener('click', () => {
  addItem('#checkpoint-list', '#new-checkpoint-template', '.remove-checkpoint-button');
});

document.querySelector('#add-marshal-button').addEventListener('click', () => {
  addItem('#marshal-list', '#new-marshal-template', '.remove-marshal-button');
});

document.querySelector('#add-participant-button').addEventListener('click', () => {
  addItem('#participant-list', '#new-participant-template', '.remove-participant-button');
});
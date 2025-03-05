document.addEventListener('DOMContentLoaded', function () {
  const steps = document.querySelectorAll('.race-details-step');
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.prev-step');
  const submitBtn = document.querySelector('#submitBtn');

  let currentStep = 0;
  const formData = {};

  /**
   * Updates the visibility of steps based on the current step index.
   * Only the active step will be visible.
   */
  function updateSteps() {
    steps.forEach((step, index) => {
      step.classList.toggle('active', index === currentStep);
    });
  }

  /**
   * Handles the 'Next' button click event.
   * Validates the current step before allowing the transition.
   * Saves the form data of the current step.
   */
  function handleNextButtonClick() {
    if (validateStep(currentStep)) {
      saveData(currentStep);
      currentStep++;
      updateSteps();
    }
  }

  /**
   * Handles the 'Previous' button click event.
   * Moves back one step in the form.
   */
  function handlePrevButtonClick() {
    currentStep--;
    updateSteps();
  }

  /**
   * Handles the 'Submit' button click event.
   * Saves the last step's form data and submits to the server.
   */
  function handleSubmitButtonClick() {
    saveData(currentStep);
    console.log(formData);
  }

  /**
   * Validates that all input fields in the current step are filled.
   * Displays a requirement message if any field is empty.
   * @param {number} stepIndex - The index of the step being validated.
   * @returns {boolean} - Returns true if all inputs are filled, otherwise false.
   */
  function validateStep(stepIndex) {
    const inputs = steps[stepIndex].querySelectorAll('input');
    const requirementMessage = document.querySelector('.requirement-message');

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
   * Saves the form data of the current step.
   * @param {number} stepIndex - The index of the step being processed.
   */
  function saveData(stepIndex) {
    const inputs = steps[stepIndex].querySelectorAll('input');
    for (const input of inputs) {
      formData[input.id] = input.value;
    }
  }

  /**
   * Adds event listeners to a group of buttons.
   * @param {NodeList} buttons - List of buttons.
   * @param {Function} handler - Function to handle button clicks.
   */
  function addEventListenersToButtons(buttons, handler) {
    for (const button of buttons) {
      button.addEventListener('click', handler);
    }
  }

  addEventListenersToButtons(nextButtons, handleNextButtonClick);
  addEventListenersToButtons(prevButtons, handlePrevButtonClick);
  submitBtn.addEventListener('click', handleSubmitButtonClick);

  // Initialize the first step as active
  updateSteps();
});

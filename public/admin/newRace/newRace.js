document.querySelector('#page-continue').addEventListener('click', () => {
  const raceNameInput = document.querySelector('#race-name-input').value;
  const checkpointCheckbox = document.querySelector('#checkpoint-checkbox').checked;

  const raceName = raceNameInput || 'My new race';
  const usingCheckpoints = checkpointCheckbox || false;

  console.log('Race Name: ', raceName);
  console.log('Using Checkpoints: ', usingCheckpoints);
});

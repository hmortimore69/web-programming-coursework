document.addEventListener('DOMContentLoaded', () => {
  const liveTimerSection = document.getElementById('live-timer-section');
  const raceTimerElement = document.getElementById('race-timer');
  const liveIndicator = document.getElementById('live-indicator');
  
  let startTime;
  let timerInterval;
  
  function startTimer() {
      liveTimerSection.classList.remove('hidden');
      liveIndicator.textContent = '● LIVE';
      liveIndicator.style.color = 'red';
      
      startTime = Date.now();
      
      timerInterval = setInterval(() => {
          updateTimerDisplay();
      }, 1);
  }
  
  function updateTimerDisplay() {
      const elapsed = Date.now() - startTime;
      
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      const milliseconds = elapsed % 1000;
      
      raceTimerElement.textContent = 
          `${hours.toString().padStart(2, '0')}:` +
          `${minutes.toString().padStart(2, '0')}:` +
          `${seconds.toString().padStart(2, '0')}.` +
          `${milliseconds.toString().padStart(3, '0')}`;
  }
  
  startTimer();

});
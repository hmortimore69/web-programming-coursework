document.addEventListener("DOMContentLoaded", () => {
    const inputFields = document.querySelectorAll("input");

    for (input of inputFields) {
        input.value = "";
        input.checked = false;
    }
});

document.querySelector("#page-1-continue").addEventListener('click', (e) => {
    const raceNameInput = document.querySelector("#race-name-input").value;
    const checkpointCheckbox = document.querySelector("#checkpoint-checkbox").checked;

    const raceName = raceNameInput ? raceNameInput : "My Race";
    const usingCheckpoints = checkpointCheckbox ? checkpointCheckbox : false;

    console.log("Race Name: ", raceName);
    console.log("Using Checkpoints: ", usingCheckpoints);
});
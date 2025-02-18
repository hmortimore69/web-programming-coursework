document.addEventListener("DOMContentLoaded", () => {
    registerButtons();
});

function registerButtons() {
    const newRaceButton = document.querySelector("#new-race-button");
    const editRaceButton = document.querySelector("#edit-race-button");

    newRaceButton.addEventListener("click", newRace)
    editRaceButton.addEventListener("click", editRace)
};

function newRace(e) {
    
};

function editRace(e) {
    
};
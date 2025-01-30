CREATE TABLE IF NOT EXISTS races (
    race_id INTEGER PRIMARY KEY AUTOINCREMENT,
    started INTEGER NOT NULL,
    finished INTEGER
);

CREATE TABLE IF NOT EXISTS participants (
    participant_id INTEGER NOT NULL,
    race_id INTEGER NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    time_finished INTEGER,
    PRIMARY KEY (participant_id, race_id),
    FOREIGN KEY (race_id) REFERENCES races (race_id)
);

INSERT INTO races (started, finished) VALUES 
(1738152000, 1738173600),
(1739000000, 1739025000),
(1739000000, NULL);

INSERT INTO participants (participant_id, race_id, first_name, last_name, time_finished) VALUES
(2, 1, "John", "Doe", 1738170000),
(1, 1, "Jane", "Smith", 1738168000),
(33, 2, "Alice", "Johnson", 1739018000),
(24, 2, "Bob", "Brown", 1739020000),
(33, 3, "Alice", "Johnson", null),
(24, 3, "Bob", "Brown", null);
CREATE TABLE IF NOT EXISTS races (
    race_id INTEGER PRIMARY KEY AUTOINCREMENT,
    started INTEGER NOT NULL,
    finished INTEGER
);

CREATE TABLE IF NOT EXISTS participants (
    participant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS participants_races (
    participant_id INTEGER NOT NULL REFERENCES participants (participant_id),
    race_id INTEGER NOT NULL REFERENCES races (race_id),
    bib_number INTEGER NOT NULL,
    time_finished INTEGER,
    PRIMARY KEY (participant_id, race_id)
);

CREATE TABLE IF NOT EXISTS marshalls (
    marshall_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS marshalls_races (
    marshall_id INTEGER NOT NULL REFERENCES marshalls (marshall_id),
    race_id INTEGER NOT NULL REFERENCES races (race_id),
    PRIMARY KEY (marshall_id, race_id)
);

INSERT INTO races (started, finished) VALUES
(1674500000, 1674506000),
(1674600000, 1674608000),
(1674700000, NULL); 

INSERT INTO participants (first_name, last_name) VALUES
('John', 'Doe'),
('Jane', 'Smith'),
('Alex', 'Johnson'),
('Emily', 'Davis');

INSERT INTO participants_races (participant_id, race_id, bib_number, time_finished) VALUES
(1, 1, 101, 1674505500),
(2, 1, 102, 1674505900),
(3, 2, 103, 1674606500),
(4, 2, 104, 1674607500),
(1, 3, 105, NULL);

INSERT INTO marshalls (first_name, last_name) VALUES
('Chris', 'Brown'),
('Pat', 'Taylor'),
('Jordan', 'White');

INSERT INTO marshalls_races (marshall_id, race_id) VALUES
(1, 1),
(1, 2),
(2, 2),
(3, 3);

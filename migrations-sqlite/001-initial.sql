/* CREATE TABLES */
CREATE TABLE IF NOT EXISTS races (
    race_id INTEGER PRIMARY KEY AUTOINCREMENT,
    time_started INTEGER NOT NULL,
    time_finished INTEGER,
    participants_finished INTEGER DEFAULT 0
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
    attended BOOLEAN DEFAULT FALSE,
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

CREATE TABLE IF NOT EXISTS checkpoints (
    checkpoint_id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    checkpoint_name TEXT,
    checkpoint_order INTEGER NOT NULL,
    UNIQUE (checkpoint_order, race_id)
);

CREATE TABLE IF NOT EXISTS checkpoints_times(
    checkpoint_id INTEGER NOT NULL REFERENCES checkpoints (checkpoint_id),
    participant_id INTEGER NOT NULL REFERENCES participants (participant_id),
    time_finished INTEGER NOT NULL,
    PRIMARY KEY (checkpoint_id, participant_id)
);

CREATE TABLE IF NOT EXISTS marshalls_checkpoints(
    marshall_id INTEGER NOT NULL REFERENCES marshalls (marshall_id),
    checkpoint_id INTEGER NOT NULL REFERENCES checkpoint_id (checkpoint_id),
    PRIMARY KEY (marshall_id, checkpoint_id)
);

/* TRIGGERS */
-- Set finish time to 24 hours after race start time
CREATE TRIGGER IF NOT EXISTS set_race_finished_24hr
AFTER INSERT ON races
BEGIN
    UPDATE races
    SET time_finished = time_started + 86400
    WHERE race_id = NEW.race_id;
END;


/* SAMPLE INSERTS */
INSERT INTO races (time_started, time_finished) VALUES 
(1738452579, NULL);

INSERT INTO participants (first_name, last_name) VALUES 
('Grace', 'Anderson'),
('Hank', 'Thomas'),
('John', 'Doe'),
('Jane', 'Smith'),
('Emily', 'Taylor'),
('Michael', 'Brown'),
('Sarah', 'Johnson'),
('David', 'Lee'),
('Olivia', 'Wilson'),
('Daniel', 'Clark');

INSERT INTO participants_races (participant_id, race_id, bib_number, attended, time_finished) VALUES
(1, 1, 501, TRUE, 1738452579 + 1600),
(2, 1, 502, TRUE, 1738452579 + 2000),
(3, 1, 503, TRUE, 1738452579 + 2200),
(4, 1, 504, TRUE, 1738452579 + 2600),
(5, 1, 505, TRUE, 1738452579 + 2600),
(6, 1, 506, TRUE, 1738452579 + 3600),
(7, 1, 507, TRUE, 1738452579 + 4200),
(8, 1, 508, FALSE, NULL),
(9, 1, 509, FALSE, NULL),
(10, 1, 510, FALSE, NULL);

INSERT INTO marshalls (first_name, last_name) VALUES 
('Katie', 'Allen'),
('James', 'White'),
('Alice', 'Davis');

INSERT INTO marshalls_races (marshall_id, race_id) VALUES 
(1, 1),
(2, 1),
(3, 1),
(4, 1),
(5, 1);

INSERT INTO checkpoints (race_id, checkpoint_name, checkpoint_order) VALUES 
(1, 'Checkpoint 1', 1),
(1, 'Checkpoint 2', 2),
(1, 'Checkpoint 3', 3);


INSERT INTO checkpoints_times (checkpoint_id, participant_id, time_finished) VALUES
(1, 1, 1738452579 + 300),
(2, 1, 1738452579 + 600),
(3, 1, 1738452579 + 1200),
(1, 2, 1738452579 + 600),
(2, 2, 1738452579 + 900),
(3, 2, 1738452579 + 1800),
(1, 3, 1738452579 + 900),
(2, 3, 1738452579 + 1200),
(3, 3, 1738452579 + 1800),
(1, 4, 1738452579 + 1200),
(2, 4, 1738452579 + 1800),
(3, 4, 1738452579 + 2400),
(1, 5, 1738452579 + 1500),
(2, 5, 1738452579 + 1800),
(3, 5, 1738452579 + 2400),
(1, 6, 1738452579 + 1800),
(2, 6, 1738452579 + 2400),
(3, 6, 1738452579 + 3000),
(1, 7, 1738452579 + 1200);
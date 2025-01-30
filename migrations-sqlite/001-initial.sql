/* CREATE TABLES */
CREATE TABLE IF NOT EXISTS races (
    race_id INTEGER PRIMARY KEY AUTOINCREMENT,
    started INTEGER NOT NULL,
    finished INTEGER,
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
    SET finished = started + 86400 -- 24 hours in seconds
    WHERE race_id = NEW.race_id;
END;

-- When ALL participants finish the race, set the race finish time to the longest runner, otherwise it stays at 24 hours from start date.CREATE TRIGGER update_race_finished
CREATE TRIGGER update_race_finished_insert
AFTER INSERT
ON participants_races
FOR EACH ROW
BEGIN
    -- Update the races table if all participants have finished
    UPDATE races
    SET finished = (
        CASE 
            WHEN (SELECT COUNT(*) FROM participants_races pr
                  WHERE pr.race_id = NEW.race_id AND pr.time_finished IS NULL) = 0
            THEN (SELECT MAX(time_finished) FROM participants_races WHERE race_id = NEW.race_id)
            ELSE started + (24 * 60 * 60) -- Assuming started is stored in Unix timestamp format
        END
    )
    WHERE race_id = NEW.race_id;
    
    -- Update participants_finished count
    UPDATE races
    SET participants_finished = (SELECT COUNT(*) FROM participants_races WHERE race_id = NEW.race_id AND time_finished IS NOT NULL)
    WHERE race_id = NEW.race_id;
END;

CREATE TRIGGER update_race_finished_update
AFTER UPDATE OF time_finished
ON participants_races
FOR EACH ROW
BEGIN
    -- Update the races table if all participants have finished
    UPDATE races
    SET finished = (
        CASE 
            WHEN (SELECT COUNT(*) FROM participants_races pr
                  WHERE pr.race_id = NEW.race_id AND pr.time_finished IS NULL) = 0
            THEN (SELECT MAX(time_finished) FROM participants_races WHERE race_id = NEW.race_id)
            ELSE started + (24 * 60 * 60) -- Assuming started is stored in Unix timestamp format
        END
    )
    WHERE race_id = NEW.race_id;
    
    -- Update participants_finished count
    UPDATE races
    SET participants_finished = (SELECT COUNT(*) FROM participants_races WHERE race_id = NEW.race_id AND time_finished IS NOT NULL)
    WHERE race_id = NEW.race_id;
END;


/* SAMPLE INSERTS */
INSERT INTO races (race_id, started, finished) VALUES
(1, 1698239600, NULL),
(2, 1708243200, NULL),
(3, 1718246800, NULL),
(4, 1728250400, NULL),
(5, 1738254000, NULL);

INSERT INTO participants (participant_id, first_name, last_name) VALUES
(1, 'John', 'Doe'),
(2, 'Jane', 'Smith'),
(3, 'Alice', 'Johnson'),
(4, 'Bob', 'Brown'),
(5, 'Charlie', 'Davis'),
(6, 'Diana', 'Wilson'),
(7, 'Eve', 'Moore'),
(8, 'Frank', 'Taylor'),
(9, 'Grace', 'Anderson'),
(10, 'Hank', 'Thomas');

INSERT INTO participants_races (participant_id, race_id, bib_number, time_finished) VALUES
(1, 1, 101, 1698243200),
(2, 1, 102, 1698243300),
(3, 1, 103, 1698243400),
(4, 2, 201, 1708246750),
(5, 2, 202, 1708246850),
(6, 3, 301, 1718250200),
(7, 3, 302, 1718250300),
(8, 4, 401, 1728253700),
(9, 5, 501, 1738257200), 
(10, 5, 502, null); 

INSERT INTO marshalls (marshall_id, first_name, last_name) VALUES
(1, 'Emily', 'Clark'),
(2, 'George', 'Lewis'),
(3, 'Isabella', 'Walker'),
(4, 'Jack', 'Hall'),
(5, 'Katie', 'Allen');

INSERT INTO marshalls_races (marshall_id, race_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5);

INSERT INTO checkpoints (checkpoint_id, race_id, checkpoint_name, checkpoint_order) VALUES
(1, 1, 'Checkpoint 1', 1),
(2, 1, 'Checkpoint 2', 2),
(3, 2, 'Checkpoint 1', 1),
(4, 3, 'Checkpoint 1', 1),
(5, 3, 'Checkpoint 2', 2),
(6, 4, 'Checkpoint 1', 1);

INSERT INTO checkpoints_times (checkpoint_id, participant_id, time_finished) VALUES
(1, 1, 1698239600),
(2, 1, 1698239840),
(3, 4, 1708243360),
(4, 6, 1708243360),
(5, 6, 1718250100),
(6, 8, 1728250100);

INSERT INTO marshalls_checkpoints (marshall_id, checkpoint_id) VALUES
(1, 1),
(1, 2),
(2, 3),
(3, 4),
(3, 5),
(4, 6);
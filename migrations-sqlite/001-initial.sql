/* CREATE TABLES */
CREATE TABLE IF NOT EXISTS races (
    race_id INTEGER PRIMARY KEY AUTOINCREMENT,
    time_started INTEGER NOT NULL,
    time_finished INTEGER NOT NULL
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

/* SAMPLE INSERTS */
INSERT INTO races (time_started, time_finished) VALUES 
(1740355200, 1740355200 + 86400); -- 24 hours

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
(1, 1, 501, TRUE, 1740355200 + 1600),
(2, 1, 502, TRUE, 1740355200 + 2000),
(3, 1, 503, TRUE, 1740355200 + 2200),
(4, 1, 504, TRUE, 1740355200 + 2600),
(5, 1, 505, TRUE, 1740355200 + 2600),
(6, 1, 506, TRUE, 1740355200 + 3600),
(7, 1, 507, TRUE, 1740355200 + 4200),
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
(1, 1, 1740355200 + 300),
(2, 1, 1740355200 + 600),
(3, 1, 1740355200 + 1200),
(1, 2, 1740355200 + 600),
(2, 2, 1740355200 + 900),
(3, 2, 1740355200 + 1800),
(1, 3, 1740355200 + 900),
(2, 3, 1740355200 + 1200),
(3, 3, 1740355200 + 1800),
(1, 4, 1740355200 + 1200),
(2, 4, 1740355200 + 1800),
(3, 4, 1740355200 + 2400),
(1, 5, 1740355200 + 1500),
(2, 5, 1740355200 + 1800),
(3, 5, 1740355200 + 2400),
(1, 6, 1740355200 + 1800),
(2, 6, 1740355200 + 2400),
(3, 6, 1740355200 + 3000),
(1, 7, 1740355200 + 1200);

INSERT INTO participants (first_name, last_name) VALUES 
('Liam', 'Martinez'),
('Emma', 'Garcia'),
('Noah', 'Rodriguez'),
('Olivia', 'Wilson'),
('William', 'Anderson'),
('Ava', 'Thomas'),
('James', 'Hernandez'),
('Isabella', 'Moore'),
('Oliver', 'Martin'),
('Sophia', 'Jackson'),
('Benjamin', 'Thompson'),
('Mia', 'White'),
('Elijah', 'Lopez'),
('Charlotte', 'Lee'),
('Lucas', 'Gonzalez'),
('Amelia', 'Harris'),
('Mason', 'Clark'),
('Harper', 'Lewis'),
('Logan', 'Robinson'),
('Evelyn', 'Walker');

/* Insert their participation in race_id = 1 */
INSERT INTO participants_races (participant_id, race_id, bib_number, attended, time_finished) VALUES
(11, 1, 511, TRUE, 1740355200 + 1600),  -- Liam Martinez
(12, 1, 512, TRUE, 1740355200 + 2000),  -- Emma Garcia
(13, 1, 513, TRUE, 1740355200 + 2200),  -- Noah Rodriguez
(14, 1, 514, TRUE, 1740355200 + 2600),  -- Olivia Wilson
(15, 1, 515, TRUE, 1740355200 + 2600),  -- William Anderson
(16, 1, 516, TRUE, 1740355200 + 3600),  -- Ava Thomas
(17, 1, 517, TRUE, 1740355200 + 4200),  -- James Hernandez
(18, 1, 518, TRUE, 1740355200 + 4800),  -- Isabella Moore
(19, 1, 519, TRUE, 1740355200 + 5400),  -- Oliver Martin
(20, 1, 520, TRUE, 1740355200 + 6000),  -- Sophia Jackson
(21, 1, 521, TRUE, 1740355200 + 6600),  -- Benjamin Thompson
(22, 1, 522, TRUE, 1740355200 + 7200),  -- Mia White
(23, 1, 523, TRUE, 1740355200 + 7800),  -- Elijah Lopez
(24, 1, 524, TRUE, 1740355200 + 8400),  -- Charlotte Lee
(25, 1, 525, TRUE, 1740355200 + 9000),  -- Lucas Gonzalez
(26, 1, 526, TRUE, 1740355200 + 9600),  -- Amelia Harris
(27, 1, 527, TRUE, 1740355200 + 10200), -- Mason Clark
(28, 1, 528, TRUE, 1740355200 + 10800), -- Harper Lewis
(29, 1, 529, TRUE, 1740355200 + 11400), -- Logan Robinson
(30, 1, 530, TRUE, 1740355200 + 12000); -- Evelyn Walker

/* Insert checkpoint times for the new participants */
INSERT INTO checkpoints_times (checkpoint_id, participant_id, time_finished) VALUES
-- Liam Martinez (participant_id = 11)
(1, 11, 1740355200 + 300),
(2, 11, 1740355200 + 600),
(3, 11, 1740355200 + 1200),

-- Emma Garcia (participant_id = 12)
(1, 12, 1740355200 + 600),
(2, 12, 1740355200 + 900),
(3, 12, 1740355200 + 1800),

-- Noah Rodriguez (participant_id = 13)
(1, 13, 1740355200 + 900),
(2, 13, 1740355200 + 1200),
(3, 13, 1740355200 + 1800),

-- Olivia Wilson (participant_id = 14)
(1, 14, 1740355200 + 1200),
(2, 14, 1740355200 + 1800),
(3, 14, 1740355200 + 2400),

-- William Anderson (participant_id = 15)
(1, 15, 1740355200 + 1500),
(2, 15, 1740355200 + 1800),
(3, 15, 1740355200 + 2400),

-- Ava Thomas (participant_id = 16)
(1, 16, 1740355200 + 1800),
(2, 16, 1740355200 + 2400),
(3, 16, 1740355200 + 3000),

-- James Hernandez (participant_id = 17)
(1, 17, 1740355200 + 1200),
(2, 17, 1740355200 + 1800),
(3, 17, 1740355200 + 2400),

-- Isabella Moore (participant_id = 18)
(1, 18, 1740355200 + 1500),
(2, 18, 1740355200 + 2100),
(3, 18, 1740355200 + 2700),

-- Oliver Martin (participant_id = 19)
(1, 19, 1740355200 + 1800),
(2, 19, 1740355200 + 2400),
(3, 19, 1740355200 + 3000),

-- Sophia Jackson (participant_id = 20)
(1, 20, 1740355200 + 2100),
(2, 20, 1740355200 + 2700),
(3, 20, 1740355200 + 3300),

-- Benjamin Thompson (participant_id = 21)
(1, 21, 1740355200 + 2400),
(2, 21, 1740355200 + 3000),
(3, 21, 1740355200 + 3600),

-- Mia White (participant_id = 22)
(1, 22, 1740355200 + 2700),
(2, 22, 1740355200 + 3300),
(3, 22, 1740355200 + 3900),

-- Elijah Lopez (participant_id = 23)
(1, 23, 1740355200 + 3000),
(2, 23, 1740355200 + 3600),
(3, 23, 1740355200 + 4200),

-- Charlotte Lee (participant_id = 24)
(1, 24, 1740355200 + 3300),
(2, 24, 1740355200 + 3900),
(3, 24, 1740355200 + 4500),

-- Lucas Gonzalez (participant_id = 25)
(1, 25, 1740355200 + 3600),
(2, 25, 1740355200 + 4200),
(3, 25, 1740355200 + 4800),

-- Amelia Harris (participant_id = 26)
(1, 26, 1740355200 + 3900),
(2, 26, 1740355200 + 4500),
(3, 26, 1740355200 + 5100),

-- Mason Clark (participant_id = 27)
(1, 27, 1740355200 + 4200),
(2, 27, 1740355200 + 4800),
(3, 27, 1740355200 + 5400),

-- Harper Lewis (participant_id = 28)
(1, 28, 1740355200 + 4500),
(2, 28, 1740355200 + 5100),
(3, 28, 1740355200 + 5700),

-- Logan Robinson (participant_id = 29)
(1, 29, 1740355200 + 4800),
(2, 29, 1740355200 + 5400),
(3, 29, 1740355200 + 6000),

-- Evelyn Walker (participant_id = 30)
(1, 30, 1740355200 + 5100),
(2, 30, 1740355200 + 5700),
(3, 30, 1740355200 + 6300);
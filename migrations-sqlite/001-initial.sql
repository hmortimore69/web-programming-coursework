CREATE TABLE IF NOT EXISTS races (
    race_id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_name TEXT,
    time_started INTEGER NOT NULL,
    time_finished INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS participants (
    participant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL REFERENCES races (race_id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    bib_number INTEGER NOT NULL,
    attended BOOLEAN DEFAULT FALSE,
    time_finished INTEGER
);

CREATE TABLE IF NOT EXISTS marshalls (
    marshall_id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL REFERENCES races (race_id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL
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
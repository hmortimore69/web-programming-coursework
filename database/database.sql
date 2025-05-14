CREATE TABLE IF NOT EXISTS races (
    race_id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_name TEXT NOT NULL,
    race_location TEXT NOT NULL,
    scheduled_start_time INTEGER NOT NULL,
    scheduled_duration INTEGER NOT NULL,
    time_started INTEGER,
    time_finished INTEGER
);

CREATE TABLE IF NOT EXISTS participants (
    participant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL REFERENCES races (race_id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    bib_number INTEGER NOT NULL,
    time_finished INTEGER DEFAULT NULL,
    pending_times TEXT,
    has_conflict BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS marshals (
    marshal_id INTEGER PRIMARY KEY AUTOINCREMENT,
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

CREATE TABLE IF NOT EXISTS race_interests (
    interest_id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT,
    FOREIGN KEY (race_id) REFERENCES races (race_id)
);
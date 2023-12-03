DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS trades;
DROP TABLE IF EXISTS balances;
DROP TABLE IF EXISTS withdraws;
DROP TABLE IF EXISTS deposits;
DROP TABLE IF EXISTS investments;

CREATE TABLE user (
    u_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    ref INTEGER,
    commission FLOAT DEFAULT 0,
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trades (
    t_id INTEGER PRIMARY KEY AUTOINCREMENT,
    coin VARCHAR(15),
    amount FLOAT,
    type BOOLEAN,
    t_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    u_id INTEGER,
    FOREIGN KEY (u_id) REFERENCES user (u_id)
);

CREATE TABLE balances (
    b_id INTEGER PRIMARY KEY AUTOINCREMENT,
    coin VARCHAR(15),
    balance FLOAT,
    u_id INTEGER,
    FOREIGN KEY (u_id) REFERENCES user (u_id)
);

CREATE TABLE withdraws (
    w_id INTEGER PRIMARY KEY AUTOINCREMENT,
    w_amount FLOAT,
    w_address TEXT,
    w_coin VARCHAR(15),
    w_status BOOLEAN default 0,
    has_ref BOOLEAN default 0,
    u_id INTEGER,
    w_request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (u_id) REFERENCES user (u_id)
);

CREATE TABLE deposits (
    d_id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER,
    payment_status VARCHAR(30),
    pay_address TEXT,
    price_amount FLOAT,
    price_currency VARCHAR(5),
    pay_amount FLOAT,
    pay_currency VARCHAR(15),
    network VARCHAR(15),
    valid_until TEXT,
    created_at TEXT,
    added BOOLEAN not null default 0,
    u_id INTEGER,
    FOREIGN KEY (u_id) REFERENCES user (u_id)
);

CREATE TABLE investments (
    i_id INTEGER PRIMARY KEY AUTOINCREMENT,
    coin VARCHAR(15),
    coin_amount FLOAT,
    usd_amount FLOAT,
    plan INTEGER,
    i_status BOOLEAN default 0,
    u_id INTEGER,
    i_day TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (u_id) REFERENCES user (u_id)
);
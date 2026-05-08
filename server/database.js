const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const { loadBootstrapPayload } = require("./bootstrap-source");

const STATE_KEY = "smart_checkpoints_bootstrap";
const DEFAULT_DB_PATH = path.join(__dirname, "..", "storage", "ntg-smart-checkpoints.sqlite");

function createDatabase() {
  const databasePath = process.env.DB_PATH || DEFAULT_DB_PATH;
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  return database;
}

function ensureSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      state_key TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function ensureSeed(database) {
  const seedPayload = loadBootstrapPayload();
  const existing = database
    .prepare("SELECT state_key, payload FROM app_state WHERE state_key = ?")
    .get(STATE_KEY);

  if (!existing) {
    database
      .prepare("INSERT INTO app_state (state_key, payload) VALUES (?, ?)")
      .run(STATE_KEY, JSON.stringify(seedPayload));
    return;
  }

  const existingPayload = JSON.parse(existing.payload);
  const hasPulseCase = existingPayload.SHIPMENTS?.some((shipment) => shipment.id === "SHP-2026-00421");
  if (!hasPulseCase) {
    saveBootstrapState(database, seedPayload);
  }
}

function initializeDatabase(database) {
  ensureSchema(database);
  ensureSeed(database);
}

function getBootstrapState(database) {
  const row = database
    .prepare("SELECT payload FROM app_state WHERE state_key = ?")
    .get(STATE_KEY);

  if (!row) {
    const seedPayload = loadBootstrapPayload();
    saveBootstrapState(database, seedPayload);
    return seedPayload;
  }

  return JSON.parse(row.payload);
}

function saveBootstrapState(database, payload) {
  database
    .prepare(`
      INSERT INTO app_state (state_key, payload, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(state_key)
      DO UPDATE SET payload = excluded.payload, updated_at = CURRENT_TIMESTAMP
    `)
    .run(STATE_KEY, JSON.stringify(payload));
}

function resetBootstrapState(database) {
  const seedPayload = loadBootstrapPayload();
  saveBootstrapState(database, seedPayload);
  return seedPayload;
}

function getDatabaseHealth(database) {
  return database.prepare("SELECT datetime('now') AS server_time").get();
}

module.exports = {
  STATE_KEY,
  DEFAULT_DB_PATH,
  createDatabase,
  initializeDatabase,
  getBootstrapState,
  saveBootstrapState,
  resetBootstrapState,
  getDatabaseHealth,
};

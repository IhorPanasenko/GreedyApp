const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./lab2.db');

db.serialize(() => {
  console.log("Running database setup...");

  db.run(`CREATE TABLE IF NOT EXISTS Products (
    product_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    profit REAL NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Resources (
    resource_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    stock REAL NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Consumption (
    consumption_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT,
    resource_id TEXT,
    amount REAL NOT NULL,
    FOREIGN KEY(product_id) REFERENCES Products(product_id) ON DELETE CASCADE,
    FOREIGN KEY(resource_id) REFERENCES Resources(resource_id) ON DELETE CASCADE
  )`);

  console.log("Database tables created with TEXT keys.");
});

db.close();
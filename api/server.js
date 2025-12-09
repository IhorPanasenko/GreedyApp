const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3001;
const db = new sqlite3.Database('./lab2.db');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/data', (req, res) => {
  const data = {
    products: [],
    resources: [],
    consumption: {}
  };

  const p1 = db.all("SELECT * FROM Products", [], (err, rows) => { data.products = rows; });
  const p2 = db.all("SELECT * FROM Resources", [], (err, rows) => { data.resources = rows; });
  const p3 = db.all("SELECT * FROM Consumption", [], (err, rows) => {
    rows.forEach(row => {
      data.consumption[`${row.resource_id}_${row.product_id}`] = row.amount;
    });
  });

  Promise.all([p1, p2, p3]).then(() => {
    res.json(data);
  }).catch(err => res.status(500).json({ error: err.message }));
});

app.post('/api/save', (req, res) => {
  const { products, resources, consumption } = req.body;

  if (!products || !resources || !consumption) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const statements = [
    `DELETE FROM Consumption;`,
    `DELETE FROM Products;`,
    `DELETE FROM Resources;`
  ];

  db.serialize(() => {
    try {
      db.run("BEGIN TRANSACTION;");

      statements.forEach(stmt => db.run(stmt));

      const productStmt = db.prepare("INSERT INTO Products (product_id, name, profit) VALUES (?, ?, ?)");
      products.forEach(p => productStmt.run(p.product_id, p.name, p.profit));
      productStmt.finalize();

      const resourceStmt = db.prepare("INSERT INTO Resources (resource_id, name, stock) VALUES (?, ?, ?)");
      resources.forEach(r => resourceStmt.run(r.resource_id, r.name, r.stock));
      resourceStmt.finalize();

      const consumptionStmt = db.prepare("INSERT INTO Consumption (resource_id, product_id, amount) VALUES (?, ?, ?)");
      for (const key in consumption) {
        const [r_id, p_id] = key.split('_');
        consumptionStmt.run(r_id, p_id, consumption[key]);
      }
      consumptionStmt.finalize();

      db.run("COMMIT;");

      res.status(200).json({ message: 'Data saved successfully!' });

    } catch (err) {
      db.run("ROLLBACK;");
      res.status(500).json({ error: err.message });
    }
  });
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
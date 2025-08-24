import express from "express";
import pkg from "pg";
import cors from "cors";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to PostgreSQL on Render
const pool = new Pool({
  connectionString: "postgresql://cpu_usage_8s47_user:hFTCmknE19JGaDVpiM2q4pg1htMj9R9J@dpg-d2lp2ijuibrs73fggn30-a.oregon-postgres.render.com/cpu_usage_8s47",
  ssl: { rejectUnauthorized: false } // important for Render
});

// 🔎 Search for a person
app.get("/api/search", async (req, res) => {
  try {
    const { name } = req.query;
    const result = await pool.query(
      "SELECT * FROM people WHERE name ILIKE $1 LIMIT 1",
      [`%${name}%`]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "❌ Name not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➕ Add a person
app.post("/api/add", async (req, res) => {
  try {
    const {
      name, birthplace, birthdate, current_age,
      records, belongings, marital_status,
      children, wanted, image
    } = req.body;

    const result = await pool.query(
      `INSERT INTO people (name, birthplace, birthdate, current_age, records, belongings, marital_status, children, wanted, image) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [name, birthplace, birthdate, current_age, records, belongings, marital_status, children, wanted, image]
    );

    res.json({ message: "✅ Person added successfully", id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚀 Start server
app.listen(5000, () =>
  console.log("🚀 Server running on https://fbi-mrmd.onrender.com/")
);

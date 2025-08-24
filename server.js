import express from "express";
import pkg from "pg";
import cors from "cors";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// ✅ اتصال بقاعدة بيانات PostgreSQL على Render
const pool = new Pool({
  connectionString: "postgresql://cpu_usage_8s47_user:hFTCmknE19JGaDVpiM2q4pg1htMj9R9J@dpg-d2lp2ijuibrs73fggn30-a.oregon-postgres.render.com/cpu_usage_8s47",
  ssl: { rejectUnauthorized: false }  // مهم للاتصال مع Render
});

// 🔎 البحث عن شخص
app.get("/api/search", async (req, res) => {
  try {
    const { name } = req.query;
    const result = await pool.query(
      "SELECT * FROM people WHERE name ILIKE $1 LIMIT 1",
      [`%${name}%`]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "❌ الاسم غير صحيح" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➕ إضافة شخص
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

    res.json({ message: "✅ تم إضافة الشخص بنجاح", id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚀 تشغيل السيرفر
app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));

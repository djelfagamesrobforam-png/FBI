import express from "express";
import pkg from "pg";
import cors from "cors";
import bcrypt from "bcryptjs";


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



// ✅ عرض كل الأشخاص
app.get("/api/people", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM people ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ حذف شخص
app.delete("/api/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM people WHERE id=$1", [id]);
    res.json({ message: "❌ Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ تحديث شخص
// ✅ البحث عن شخص بالـ ID
app.get("/api/person/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM people WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "❌ Person not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ تحديث بيانات شخص
app.put("/api/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, birthplace, birthdate, current_age,
      records, belongings, marital_status,
      children, wanted, image
    } = req.body;

    const result = await pool.query(
      `UPDATE people 
       SET name=$1, birthplace=$2, birthdate=$3, current_age=$4, records=$5,
           belongings=$6, marital_status=$7, children=$8, wanted=$9, image=$10
       WHERE id=$11 RETURNING *`,
      [name, birthplace, birthdate, current_age, records, belongings, marital_status, children, wanted, image, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "❌ Person not found" });
    }

    res.json({ message: "✅ Person updated successfully", person: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) return res.json({ error: "Missing fields" });

  const hashed = await bcrypt.hash(password, 10);

  try {
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashed]);
    res.json({ message: "User registered successfully!" });
  } catch (err) {
    if (err.code === "23505") { // unique violation
      res.json({ error: "Username already exists" });
    } else {
      res.json({ error: err.message });
    }
  }
});

// ✅ تسجيل الدخول
app.post("/api/login", async (req, res) => {
  const { username, password, deviceInfo } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE username=$1", [username]);
  if (result.rows.length === 0) return res.json({ error: "User not found" });

  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password);

  if (match) {
    // إذا لم يُرسل deviceInfo، نملأه بالقيم الافتراضية
    const safeDeviceInfo = deviceInfo || {};
    const ip = safeDeviceInfo.ip || "Unknown";
    const userAgent = safeDeviceInfo.userAgent || "Unknown";
    const platform = safeDeviceInfo.platform || "Unknown";
    const language = safeDeviceInfo.language || "Unknown";

    // حفظ بيانات تسجيل الدخول
    await pool.query(
      `INSERT INTO user_logins (user_id, ip, user_agent, platform, language, login_time)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [user.id, ip, userAgent, platform, language]
    );

    res.json({ message: "Login successful", user: { id: user.id, username: user.username } });
  } else {
    res.json({ error: "Invalid password" });
  }
});


// 🚀 Start server
app.listen(5000, () =>
  console.log("🚀 Server running on https://fbi-mrmd.onrender.com/")
);







const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/rooms", async (req, res) => {
  try {

    const result = await pool.query("SELECT * FROM rooms");

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).send("Database error");
  }
});

app.listen(8080, () => {
  console.log("Server started on port 8080");
});
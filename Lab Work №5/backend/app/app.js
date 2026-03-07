const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/rooms", (req, res) => {
  res.json([
    { id: 1, name: "Standard room", price: 100 },
    { id: 2, name: "Deluxe room", price: 200 }
  ]);
});

module.exports = app;
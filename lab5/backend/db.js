const { Pool } = require("pg");

const pool = new Pool({
  host: "postgres",
  user: "postgres",
  password: "postgres",
  database: "hotel",
  port: 5432
});

module.exports = pool;
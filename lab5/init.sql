CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  name TEXT,
  price INT
);

INSERT INTO rooms (name, price) VALUES
('Standard room', 100),
('Deluxe room', 200);
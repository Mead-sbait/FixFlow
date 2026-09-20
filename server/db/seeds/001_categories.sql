INSERT INTO categories (name) VALUES
  ('Electrical'), ('Plumbing'), ('HVAC'), ('Furniture'), ('General Maintenance')
ON CONFLICT (name) DO NOTHING;


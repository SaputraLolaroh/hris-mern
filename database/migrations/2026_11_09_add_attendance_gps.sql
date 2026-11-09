-- Migration: store the GPS position and browser-reported accuracy for check-in.
-- Safe to run more than once on an existing PostgreSQL / Neon database.
ALTER TABLE attendances
  ADD COLUMN IF NOT EXISTS checkin_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS checkin_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS checkin_accuracy_meters DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_attendances_date_employee
  ON attendances (date DESC, employee_id);

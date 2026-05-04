-- Agrega columnas para el sistema de alertas por umbrales en locations
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS alerts_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_temp_threshold NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS max_temp_threshold NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS min_moisture_threshold NUMERIC(5,3),
  ADD COLUMN IF NOT EXISTS max_moisture_threshold NUMERIC(5,3),
  ADD COLUMN IF NOT EXISTS alert_emails TEXT,
  ADD COLUMN IF NOT EXISTS last_alert_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_alert_hash VARCHAR(255);

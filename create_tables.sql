-- SQL para crear las tablas manualmente en Supabase
-- Ejecutar este SQL en el SQL Editor de Supabase

-- Crear tabla de usuarios (si no existe)
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Crear tabla de ubicaciones
CREATE TABLE IF NOT EXISTS "Location" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    elevation DECIMAL(8,2),
    "soilType" VARCHAR(100),
    "landUse" VARCHAR(100),
    "clientName" VARCHAR(200) NOT NULL,
    "clientEmail" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Índices para mejorar rendimiento
    CONSTRAINT unique_user_coordinates UNIQUE ("userId", latitude, longitude)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_location_user_id ON "Location"("userId");
CREATE INDEX IF NOT EXISTS idx_location_coordinates ON "Location"(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_location_active ON "Location"("isActive");

-- Trigger para actualizar updatedAt automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_location_updated_at BEFORE UPDATE ON "Location"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
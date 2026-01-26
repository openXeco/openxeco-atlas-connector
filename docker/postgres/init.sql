-- Initialize PostgreSQL database for ATLAS Connector

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema if needed (optional, using public by default)
-- CREATE SCHEMA IF NOT EXISTS atlas;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE atlas_connector TO postgres;

-- ============================================================================
-- NEXORA Database Schema: Secure Email OTP Authentication
-- Target Engine: PostgreSQL 14+ / Supabase / Neon / Prisma
-- ============================================================================

-- Enable pgcrypto / uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(150),
    password_hash VARCHAR(255),
    phone VARCHAR(25),
    role VARCHAR(32) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'provider', 'admin')),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    avatar VARCHAR(512),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- ----------------------------------------------------------------------------
-- 2. OTPS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 3),
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    consumed_at TIMESTAMP WITH TIME ZONE,
    last_requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance, fast validation, and TTL cleanup
CREATE INDEX IF NOT EXISTS idx_otps_email ON otps (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps (expires_at);
CREATE INDEX IF NOT EXISTS idx_otps_lookup ON otps (LOWER(email), consumed, expires_at);
CREATE INDEX IF NOT EXISTS idx_otps_user_id ON otps (user_id);

-- ----------------------------------------------------------------------------
-- 3. AUTOMATIC CLEANUP FUNCTION & TRIGGER (OPTIONAL PG_CRON / SCHEDULER)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION purge_expired_otps()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM otps
    WHERE expires_at < (CURRENT_TIMESTAMP - INTERVAL '1 hour')
       OR (consumed = TRUE AND created_at < (CURRENT_TIMESTAMP - INTERVAL '1 day'));
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 4. PRISMA SCHEMA DEFINITION (EQUIVALENT)
-- ----------------------------------------------------------------------------
/*
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  passwordHash  String?   @map("password_hash")
  phone         String?
  role          String    @default("customer")
  isVerified    Boolean   @default(false) @map("is_verified")
  phoneVerified Boolean   @default(false) @map("phone_verified")
  avatar        String?
  isActive      Boolean   @default(true)  @map("is_active")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt      @map("updated_at")
  otps          Otp[]

  @@index([email])
  @@map("users")
}

model Otp {
  id              String    @id @default(uuid())
  userId          String?   @map("user_id")
  user            User?     @relation(fields: [userId], references: [id], onDelete: Cascade)
  email           String
  codeHash        String    @map("code_hash")
  expiresAt       DateTime  @map("expires_at")
  attempts        Int       @default(0)
  consumed        Boolean   @default(false)
  consumedAt      DateTime? @map("consumed_at")
  lastRequestedAt DateTime  @default(now()) @map("last_requested_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt      @map("updated_at")

  @@index([email])
  @@index([expiresAt])
  @@index([email, consumed, expiresAt])
  @@map("otps")
}
*/

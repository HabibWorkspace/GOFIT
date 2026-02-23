-- FitCore Database Schema for Supabase
-- Run this in Supabase SQL Editor to create all tables

-- Users table
CREATE TABLE IF NOT EXISTS "user" (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plain_password VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Member profiles table
CREATE TABLE IF NOT EXISTS member_profile (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    member_number INTEGER UNIQUE,
    full_name VARCHAR(120),
    date_of_birth DATE,
    gender VARCHAR(10),
    cnic VARCHAR(20),
    phone VARCHAR(20),
    address TEXT,
    emergency_contact VARCHAR(120),
    emergency_contact_phone VARCHAR(20),
    membership_start_date DATE,
    membership_end_date DATE,
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    freeze_date DATE,
    unfreeze_date DATE,
    trainer_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    profile_picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trainer profiles table
CREATE TABLE IF NOT EXISTS trainer_profile (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    specialization VARCHAR(120),
    certification VARCHAR(255),
    phone_number VARCHAR(20),
    email_address VARCHAR(120),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Packages table
CREATE TABLE IF NOT EXISTS package (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    duration_months INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transaction (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES member_profile(id) ON DELETE CASCADE,
    package_id INTEGER REFERENCES package(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurring_end_date DATE,
    trainer_fee DECIMAL(10, 2),
    package_price DECIMAL(10, 2),
    discount_amount DECIMAL(10, 2),
    discount_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(120) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_member_user_id ON member_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_member_trainer_id ON member_profile(trainer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_member_id ON transaction(member_id);
CREATE INDEX IF NOT EXISTS idx_transaction_date ON transaction(transaction_date);
CREATE INDEX IF NOT EXISTS idx_user_role ON "user"(role);

-- Enable Row Level Security (optional, for multi-tenant support)
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE package ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

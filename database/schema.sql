<<<<<<< HEAD
-- SponsoraCareer Database Schema

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('dreamer', 'sponsor')),
    first_name TEXT,
    last_name TEXT,
    location TEXT,
    phone TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dreamer profiles table
CREATE TABLE IF NOT EXISTS dreamer_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    full_name TEXT,
    location TEXT,
    bio TEXT,
    goal TEXT,
    expected_duration_min INTEGER,
    expected_duration_max INTEGER,
    weekly_need DECIMAL(10,2),
    min_total_funding DECIMAL(10,2),
    max_total_funding DECIMAL(10,2),
    skills TEXT,
    education TEXT,
    funding_types TEXT, -- JSON array as string
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Sponsor profiles table
CREATE TABLE IF NOT EXISTS sponsor_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    company_name TEXT,
    contact_name TEXT,
    location TEXT,
    bio TEXT,
    investment_range_min DECIMAL(10,2),
    investment_range_max DECIMAL(10,2),
    preferred_funding_types TEXT, -- JSON array as string
    industries TEXT, -- JSON array as string
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sponsor_id INTEGER NOT NULL,
    dreamer_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL, -- in months
    funding_type TEXT NOT NULL,
    interest_rate DECIMAL(5,2),
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sponsor_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (dreamer_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    offer_id INTEGER NOT NULL,
    sponsor_id INTEGER NOT NULL,
    dreamer_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL,
    funding_type TEXT NOT NULL,
    interest_rate DECIMAL(5,2),
    weekly_payment DECIMAL(10,2) NOT NULL,
    total_payments INTEGER NOT NULL,
    payments_received INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (offer_id) REFERENCES offers (id) ON DELETE CASCADE,
    FOREIGN KEY (sponsor_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (dreamer_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dreamer_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    progress INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dreamer_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    action_url TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    email_notifications TEXT, -- JSON array as string
    privacy_settings TEXT, -- JSON array as string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Insert demo data
INSERT OR IGNORE INTO users (id, email, password_hash, user_type) VALUES 
(1, 'dreamer@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'dreamer'),
(2, 'sponsor@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'sponsor');

INSERT OR IGNORE INTO dreamer_profiles (user_id, full_name, bio, goal, profile_completed) VALUES 
(1, 'Demo Dreamer', 'Aspiring web developer passionate about creating innovative solutions', 'Become a full-stack developer and launch my own tech startup', FALSE);

INSERT OR IGNORE INTO sponsor_profiles (user_id, company_name, contact_name, bio, profile_completed) VALUES 
(2, 'Tech Innovators Inc.', 'John Smith', 'We invest in talented individuals with promising tech careers', TRUE);

INSERT OR IGNORE INTO offers (sponsor_id, dreamer_id, amount, duration, funding_type, message) VALUES 
(2, 1, 15000.00, 6, 'loan', 'We love your web development goals and would like to support your journey.'),
(2, 1, 8000.00, 4, 'donation', 'Your dedication to learning is inspiring. This is a no-strings-attached donation.');

INSERT OR IGNORE INTO notifications (user_id, title, message, type, action_url) VALUES 
(1, 'New Sponsor Offer', 'Tech Innovators Inc. has made you an offer of $15,000', 'offer', 'offers'),
(1, 'Profile Incomplete', 'Complete your profile to attract more sponsors', 'reminder', 'profile'),
(1, 'Welcome to SponsoraCareer!', 'Get started by setting up your profile and goals', 'welcome', 'overview');
=======
-- SponsoraCareer Database Schema

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('dreamer', 'sponsor')),
    first_name TEXT,
    last_name TEXT,
    location TEXT,
    phone TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dreamer profiles table
CREATE TABLE IF NOT EXISTS dreamer_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    full_name TEXT,
    location TEXT,
    bio TEXT,
    goal TEXT,
    expected_duration_min INTEGER,
    expected_duration_max INTEGER,
    weekly_need DECIMAL(10,2),
    min_total_funding DECIMAL(10,2),
    max_total_funding DECIMAL(10,2),
    skills TEXT,
    education TEXT,
    funding_types TEXT, -- JSON array as string
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Sponsor profiles table
CREATE TABLE IF NOT EXISTS sponsor_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    company_name TEXT,
    contact_name TEXT,
    location TEXT,
    bio TEXT,
    investment_range_min DECIMAL(10,2),
    investment_range_max DECIMAL(10,2),
    preferred_funding_types TEXT, -- JSON array as string
    industries TEXT, -- JSON array as string
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sponsor_id INTEGER NOT NULL,
    dreamer_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL, -- in months
    funding_type TEXT NOT NULL,
    interest_rate DECIMAL(5,2),
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sponsor_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (dreamer_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    offer_id INTEGER NOT NULL,
    sponsor_id INTEGER NOT NULL,
    dreamer_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL,
    funding_type TEXT NOT NULL,
    interest_rate DECIMAL(5,2),
    weekly_payment DECIMAL(10,2) NOT NULL,
    total_payments INTEGER NOT NULL,
    payments_received INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (offer_id) REFERENCES offers (id) ON DELETE CASCADE,
    FOREIGN KEY (sponsor_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (dreamer_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dreamer_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    progress INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dreamer_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    action_url TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    email_notifications TEXT, -- JSON array as string
    privacy_settings TEXT, -- JSON array as string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Insert demo data
INSERT OR IGNORE INTO users (id, email, password_hash, user_type) VALUES 
(1, 'dreamer@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'dreamer'),
(2, 'sponsor@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'sponsor');

INSERT OR IGNORE INTO dreamer_profiles (user_id, full_name, bio, goal, profile_completed) VALUES 
(1, 'Demo Dreamer', 'Aspiring web developer passionate about creating innovative solutions', 'Become a full-stack developer and launch my own tech startup', FALSE);

INSERT OR IGNORE INTO sponsor_profiles (user_id, company_name, contact_name, bio, profile_completed) VALUES 
(2, 'Tech Innovators Inc.', 'John Smith', 'We invest in talented individuals with promising tech careers', TRUE);

INSERT OR IGNORE INTO offers (sponsor_id, dreamer_id, amount, duration, funding_type, message) VALUES 
(2, 1, 15000.00, 6, 'loan', 'We love your web development goals and would like to support your journey.'),
(2, 1, 8000.00, 4, 'donation', 'Your dedication to learning is inspiring. This is a no-strings-attached donation.');

INSERT OR IGNORE INTO notifications (user_id, title, message, type, action_url) VALUES 
(1, 'New Sponsor Offer', 'Tech Innovators Inc. has made you an offer of $15,000', 'offer', 'offers'),
(1, 'Profile Incomplete', 'Complete your profile to attract more sponsors', 'reminder', 'profile'),
(1, 'Welcome to SponsoraCareer!', 'Get started by setting up your profile and goals', 'welcome', 'overview');
>>>>>>> d20a65ec8c9bc5755ab2a2eaadf3e81b76a096bf

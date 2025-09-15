<<<<<<< HEAD
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        // Create database directory if it doesn't exist
        const dbDir = path.dirname(__filename);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Connect to SQLite database
        const dbPath = path.join(__dirname, 'sponsoracareer.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.createTables();
            }
        });
    }

    createTables() {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split schema by semicolons and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        statements.forEach((statement, index) => {
            this.db.run(statement, (err) => {
                if (err) {
                    console.error(`Error executing statement ${index + 1}:`, err.message);
                } else if (index === statements.length - 1) {
                    console.log('Database schema initialized successfully');
                }
            });
        });
    }

    // User operations
    async createUser(email, passwordHash, userType, additionalData = {}) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO users (email, password_hash, user_type, first_name, last_name, location, phone, verification_token) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
                email,
                passwordHash,
                userType,
                additionalData.firstName || null,
                additionalData.lastName || null,
                additionalData.location || null,
                additionalData.phone || null,
                additionalData.verificationToken || null
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, email, userType, ...additionalData });
                }
            });
        });
    }

    async getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE email = ?`;
            this.db.get(sql, [email], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async getUserById(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE id = ?`;
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Dreamer profile operations
    async createDreamerProfile(userId, profileData) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO dreamer_profiles 
                (user_id, full_name, location, bio, goal, expected_duration_min, expected_duration_max, 
                 weekly_need, min_total_funding, max_total_funding, skills, education, funding_types, profile_completed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
                userId,
                profileData.fullName || null,
                profileData.location || null,
                profileData.bio || null,
                profileData.goal || null,
                profileData.expectedDurationMin || null,
                profileData.expectedDurationMax || null,
                profileData.weeklyNeed || null,
                profileData.minTotalFunding || null,
                profileData.maxTotalFunding || null,
                profileData.skills || null,
                profileData.education || null,
                JSON.stringify(profileData.fundingTypes || []),
                profileData.profileCompleted || false
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, userId, ...profileData });
                }
            });
        });
    }

    async updateDreamerProfile(userId, profileData) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE dreamer_profiles SET
                full_name = ?, location = ?, bio = ?, goal = ?, expected_duration_min = ?, 
                expected_duration_max = ?, weekly_need = ?, min_total_funding = ?, 
                max_total_funding = ?, skills = ?, education = ?, funding_types = ?, 
                profile_completed = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `;
            const values = [
                profileData.fullName || null,
                profileData.location || null,
                profileData.bio || null,
                profileData.goal || null,
                profileData.expectedDurationMin || null,
                profileData.expectedDurationMax || null,
                profileData.weeklyNeed || null,
                profileData.minTotalFunding || null,
                profileData.maxTotalFunding || null,
                profileData.skills || null,
                profileData.education || null,
                JSON.stringify(profileData.fundingTypes || []),
                profileData.profileCompleted || false,
                userId
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ userId, ...profileData });
                }
            });
        });
    }

    async getDreamerProfile(userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM dreamer_profiles WHERE user_id = ?`;
            this.db.get(sql, [userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    if (row && row.funding_types) {
                        try {
                            row.funding_types = JSON.parse(row.funding_types);
                        } catch (e) {
                            row.funding_types = [];
                        }
                    }
                    resolve(row);
                }
            });
        });
    }

    // Offers operations
    async getOffersByDreamerId(dreamerId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT o.*, sp.company_name as sponsor_name 
                FROM offers o
                JOIN sponsor_profiles sp ON o.sponsor_id = sp.user_id
                WHERE o.dreamer_id = ?
                ORDER BY o.created_at DESC
            `;
            this.db.all(sql, [dreamerId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async updateOfferStatus(offerId, status) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE offers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            this.db.run(sql, [status, offerId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: offerId, status });
                }
            });
        });
    }

    // Notifications operations
    async getNotificationsByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`;
            this.db.all(sql, [userId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async markNotificationAsRead(notificationId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE notifications SET read = TRUE WHERE id = ?`;
            this.db.run(sql, [notificationId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: notificationId, read: true });
                }
            });
        });
    }

    async markAllNotificationsAsRead(userId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE notifications SET read = TRUE WHERE user_id = ?`;
            this.db.run(sql, [userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ userId, updated: this.changes });
                }
            });
        });
    }

    // Milestones operations
    async getMilestonesByDreamerId(dreamerId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM milestones WHERE dreamer_id = ? ORDER BY target_date ASC`;
            this.db.all(sql, [dreamerId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async createMilestone(dreamerId, milestoneData) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO milestones (dreamer_id, title, description, target_date, progress)
                VALUES (?, ?, ?, ?, ?)
            `;
            const values = [
                dreamerId,
                milestoneData.title,
                milestoneData.description || null,
                milestoneData.targetDate || null,
                milestoneData.progress || 0
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, dreamerId, ...milestoneData });
                }
            });
        });
    }

    async updateMilestone(milestoneId, milestoneData) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE milestones SET
                title = ?, description = ?, target_date = ?, completed = ?, progress = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            const values = [
                milestoneData.title,
                milestoneData.description || null,
                milestoneData.targetDate || null,
                milestoneData.completed || false,
                milestoneData.progress || 0,
                milestoneId
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: milestoneId, ...milestoneData });
                }
            });
        });
    }

    // User preferences operations
    async createUserPreferences(userId, preferences) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO user_preferences (user_id, email_notifications, privacy_settings)
                VALUES (?, ?, ?)
            `;
            const values = [
                userId,
                JSON.stringify(preferences.emailNotifications || []),
                JSON.stringify(preferences.privacySettings || [])
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, userId, ...preferences });
                }
            });
        });
    }

    async getUserPreferences(userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM user_preferences WHERE user_id = ?`;
            this.db.get(sql, [userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    if (row) {
                        try {
                            row.email_notifications = JSON.parse(row.email_notifications || '[]');
                            row.privacy_settings = JSON.parse(row.privacy_settings || '[]');
                        } catch (e) {
                            row.email_notifications = [];
                            row.privacy_settings = [];
                        }
                    }
                    resolve(row);
                }
            });
        });
    }

    async updateUserPreferences(userId, preferences) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE user_preferences SET
                email_notifications = ?, privacy_settings = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `;
            const values = [
                JSON.stringify(preferences.emailNotifications || []),
                JSON.stringify(preferences.privacySettings || []),
                userId
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ userId, ...preferences });
                }
            });
        });
    }

    // Email verification operations
    async verifyUserEmail(email, token) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE users SET email_verified = TRUE, verification_token = NULL, updated_at = CURRENT_TIMESTAMP
                WHERE email = ? AND verification_token = ?
            `;
            this.db.run(sql, [email, token], function(err) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    reject(new Error('Invalid verification token'));
                } else {
                    resolve({ email, verified: true });
                }
            });
        });
    }

    async updateVerificationToken(email, token) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE users SET verification_token = ?, updated_at = CURRENT_TIMESTAMP
                WHERE email = ?
            `;
            this.db.run(sql, [token, email], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ email, token });
                }
            });
        });
    }

    // Sponsor profile operations
    async createSponsorProfile(userId, profileData) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO sponsor_profiles 
                (user_id, company_name, contact_name, location, bio, investment_range_min, investment_range_max, 
                 preferred_funding_types, industries, profile_completed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
                userId,
                profileData.companyName || null,
                profileData.contactName || null,
                profileData.location || null,
                profileData.bio || null,
                profileData.investmentRangeMin || null,
                profileData.investmentRangeMax || null,
                JSON.stringify(profileData.preferredFundingTypes || []),
                JSON.stringify(profileData.industries || []),
                profileData.profileCompleted || false
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, userId, ...profileData });
                }
            });
        });
    }

    async updateSponsorProfile(userId, profileData) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE sponsor_profiles SET
                company_name = ?, contact_name = ?, location = ?, bio = ?, investment_range_min = ?, 
                investment_range_max = ?, preferred_funding_types = ?, industries = ?, 
                profile_completed = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `;
            const values = [
                profileData.companyName || null,
                profileData.contactName || null,
                profileData.location || null,
                profileData.bio || null,
                profileData.investmentRangeMin || null,
                profileData.investmentRangeMax || null,
                JSON.stringify(profileData.preferredFundingTypes || []),
                JSON.stringify(profileData.industries || []),
                profileData.profileCompleted || false,
                userId
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ userId, ...profileData });
                }
            });
        });
    }

    async getSponsorProfile(userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM sponsor_profiles WHERE user_id = ?`;
            this.db.get(sql, [userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    if (row) {
                        try {
                            row.preferred_funding_types = JSON.parse(row.preferred_funding_types || '[]');
                            row.industries = JSON.parse(row.industries || '[]');
                        } catch (e) {
                            row.preferred_funding_types = [];
                            row.industries = [];
                        }
                    }
                    resolve(row);
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = Database;
=======
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        // Create database directory if it doesn't exist
        const dbDir = path.dirname(__filename);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Connect to SQLite database
        const dbPath = path.join(__dirname, 'sponsoracareer.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.createTables();
            }
        });
    }

    createTables() {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split schema by semicolons and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        statements.forEach((statement, index) => {
            this.db.run(statement, (err) => {
                if (err) {
                    console.error(`Error executing statement ${index + 1}:`, err.message);
                } else if (index === statements.length - 1) {
                    console.log('Database schema initialized successfully');
                }
            });
        });
    }

    // User operations
    async createUser(email, passwordHash, userType, additionalData = {}) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO users (email, password_hash, user_type, first_name, last_name, location, phone, verification_token) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
                email,
                passwordHash,
                userType,
                additionalData.firstName || null,
                additionalData.lastName || null,
                additionalData.location || null,
                additionalData.phone || null,
                additionalData.verificationToken || null
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, email, userType, ...additionalData });
                }
            });
        });
    }

    async getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE email = ?`;
            this.db.get(sql, [email], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async getUserById(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE id = ?`;
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Dreamer profile operations
    async createDreamerProfile(userId, profileData) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO dreamer_profiles 
                (user_id, full_name, location, bio, goal, expected_duration_min, expected_duration_max, 
                 weekly_need, min_total_funding, max_total_funding, skills, education, funding_types, profile_completed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
                userId,
                profileData.fullName || null,
                profileData.location || null,
                profileData.bio || null,
                profileData.goal || null,
                profileData.expectedDurationMin || null,
                profileData.expectedDurationMax || null,
                profileData.weeklyNeed || null,
                profileData.minTotalFunding || null,
                profileData.maxTotalFunding || null,
                profileData.skills || null,
                profileData.education || null,
                JSON.stringify(profileData.fundingTypes || []),
                profileData.profileCompleted || false
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, userId, ...profileData });
                }
            });
        });
    }

    async updateDreamerProfile(userId, profileData) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE dreamer_profiles SET
                full_name = ?, location = ?, bio = ?, goal = ?, expected_duration_min = ?, 
                expected_duration_max = ?, weekly_need = ?, min_total_funding = ?, 
                max_total_funding = ?, skills = ?, education = ?, funding_types = ?, 
                profile_completed = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `;
            const values = [
                profileData.fullName || null,
                profileData.location || null,
                profileData.bio || null,
                profileData.goal || null,
                profileData.expectedDurationMin || null,
                profileData.expectedDurationMax || null,
                profileData.weeklyNeed || null,
                profileData.minTotalFunding || null,
                profileData.maxTotalFunding || null,
                profileData.skills || null,
                profileData.education || null,
                JSON.stringify(profileData.fundingTypes || []),
                profileData.profileCompleted || false,
                userId
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ userId, ...profileData });
                }
            });
        });
    }

    async getDreamerProfile(userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM dreamer_profiles WHERE user_id = ?`;
            this.db.get(sql, [userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    if (row && row.funding_types) {
                        try {
                            row.funding_types = JSON.parse(row.funding_types);
                        } catch (e) {
                            row.funding_types = [];
                        }
                    }
                    resolve(row);
                }
            });
        });
    }

    // Offers operations
    async getOffersByDreamerId(dreamerId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT o.*, sp.company_name as sponsor_name 
                FROM offers o
                JOIN sponsor_profiles sp ON o.sponsor_id = sp.user_id
                WHERE o.dreamer_id = ?
                ORDER BY o.created_at DESC
            `;
            this.db.all(sql, [dreamerId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async updateOfferStatus(offerId, status) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE offers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            this.db.run(sql, [status, offerId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: offerId, status });
                }
            });
        });
    }

    // Notifications operations
    async getNotificationsByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`;
            this.db.all(sql, [userId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async markNotificationAsRead(notificationId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE notifications SET read = TRUE WHERE id = ?`;
            this.db.run(sql, [notificationId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: notificationId, read: true });
                }
            });
        });
    }

    async markAllNotificationsAsRead(userId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE notifications SET read = TRUE WHERE user_id = ?`;
            this.db.run(sql, [userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ userId, updated: this.changes });
                }
            });
        });
    }

    // Milestones operations
    async getMilestonesByDreamerId(dreamerId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM milestones WHERE dreamer_id = ? ORDER BY target_date ASC`;
            this.db.all(sql, [dreamerId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async createMilestone(dreamerId, milestoneData) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO milestones (dreamer_id, title, description, target_date, progress)
                VALUES (?, ?, ?, ?, ?)
            `;
            const values = [
                dreamerId,
                milestoneData.title,
                milestoneData.description || null,
                milestoneData.targetDate || null,
                milestoneData.progress || 0
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, dreamerId, ...milestoneData });
                }
            });
        });
    }

    async updateMilestone(milestoneId, milestoneData) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE milestones SET
                title = ?, description = ?, target_date = ?, completed = ?, progress = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            const values = [
                milestoneData.title,
                milestoneData.description || null,
                milestoneData.targetDate || null,
                milestoneData.completed || false,
                milestoneData.progress || 0,
                milestoneId
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: milestoneId, ...milestoneData });
                }
            });
        });
    }

    // User preferences operations
    async createUserPreferences(userId, preferences) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO user_preferences (user_id, email_notifications, privacy_settings)
                VALUES (?, ?, ?)
            `;
            const values = [
                userId,
                JSON.stringify(preferences.emailNotifications || []),
                JSON.stringify(preferences.privacySettings || [])
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, userId, ...preferences });
                }
            });
        });
    }

    async getUserPreferences(userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM user_preferences WHERE user_id = ?`;
            this.db.get(sql, [userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    if (row) {
                        try {
                            row.email_notifications = JSON.parse(row.email_notifications || '[]');
                            row.privacy_settings = JSON.parse(row.privacy_settings || '[]');
                        } catch (e) {
                            row.email_notifications = [];
                            row.privacy_settings = [];
                        }
                    }
                    resolve(row);
                }
            });
        });
    }

    async updateUserPreferences(userId, preferences) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE user_preferences SET
                email_notifications = ?, privacy_settings = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `;
            const values = [
                JSON.stringify(preferences.emailNotifications || []),
                JSON.stringify(preferences.privacySettings || []),
                userId
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ userId, ...preferences });
                }
            });
        });
    }

    // Email verification operations
    async verifyUserEmail(email, token) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE users SET email_verified = TRUE, verification_token = NULL, updated_at = CURRENT_TIMESTAMP
                WHERE email = ? AND verification_token = ?
            `;
            this.db.run(sql, [email, token], function(err) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    reject(new Error('Invalid verification token'));
                } else {
                    resolve({ email, verified: true });
                }
            });
        });
    }

    async updateVerificationToken(email, token) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE users SET verification_token = ?, updated_at = CURRENT_TIMESTAMP
                WHERE email = ?
            `;
            this.db.run(sql, [token, email], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ email, token });
                }
            });
        });
    }

    // Sponsor profile operations
    async createSponsorProfile(userId, profileData) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO sponsor_profiles 
                (user_id, company_name, contact_name, location, bio, investment_range_min, investment_range_max, 
                 preferred_funding_types, industries, profile_completed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
                userId,
                profileData.companyName || null,
                profileData.contactName || null,
                profileData.location || null,
                profileData.bio || null,
                profileData.investmentRangeMin || null,
                profileData.investmentRangeMax || null,
                JSON.stringify(profileData.preferredFundingTypes || []),
                JSON.stringify(profileData.industries || []),
                profileData.profileCompleted || false
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, userId, ...profileData });
                }
            });
        });
    }

    async updateSponsorProfile(userId, profileData) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE sponsor_profiles SET
                company_name = ?, contact_name = ?, location = ?, bio = ?, investment_range_min = ?, 
                investment_range_max = ?, preferred_funding_types = ?, industries = ?, 
                profile_completed = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `;
            const values = [
                profileData.companyName || null,
                profileData.contactName || null,
                profileData.location || null,
                profileData.bio || null,
                profileData.investmentRangeMin || null,
                profileData.investmentRangeMax || null,
                JSON.stringify(profileData.preferredFundingTypes || []),
                JSON.stringify(profileData.industries || []),
                profileData.profileCompleted || false,
                userId
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ userId, ...profileData });
                }
            });
        });
    }

    async getSponsorProfile(userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM sponsor_profiles WHERE user_id = ?`;
            this.db.get(sql, [userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    if (row) {
                        try {
                            row.preferred_funding_types = JSON.parse(row.preferred_funding_types || '[]');
                            row.industries = JSON.parse(row.industries || '[]');
                        } catch (e) {
                            row.preferred_funding_types = [];
                            row.industries = [];
                        }
                    }
                    resolve(row);
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = Database;
>>>>>>> d20a65ec8c9bc5755ab2a2eaadf3e81b76a096bf

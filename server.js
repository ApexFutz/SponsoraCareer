const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const Database = require('./database/database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Initialize database
const db = new Database();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// JWT middleware for protected routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { 
            email, 
            password, 
            userType, 
            firstName, 
            lastName, 
            location, 
            phone, 
            profileData, 
            preferences 
        } = req.body;

        // Validate input
        if (!email || !password || !userType) {
            return res.status(400).json({ error: 'Email, password, and user type are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        if (!['dreamer', 'sponsor'].includes(userType)) {
            return res.status(400).json({ error: 'User type must be either "dreamer" or "sponsor"' });
        }

        // Check if user already exists
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = generateVerificationToken();

        // Create user with additional data
        const additionalData = {
            firstName,
            lastName,
            location,
            phone,
            verificationToken
        };

        const user = await db.createUser(email, passwordHash, userType, additionalData);

        // Create profile if provided
        if (profileData) {
            try {
                if (userType === 'dreamer') {
                    await db.createDreamerProfile(user.id, profileData);
                } else if (userType === 'sponsor') {
                    await db.createSponsorProfile(user.id, profileData);
                }
            } catch (profileError) {
                console.warn('Profile creation failed:', profileError);
                // Don't fail registration if profile creation fails
            }
        }

        // Create user preferences if provided
        if (preferences) {
            try {
                await db.createUserPreferences(user.id, preferences);
            } catch (prefError) {
                console.warn('Preferences creation failed:', prefError);
                // Don't fail registration if preferences creation fails
            }
        }

        // Send verification email (simulated)
        await sendVerificationEmail(email, verificationToken);

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, userType: user.userType },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            user: { 
                id: user.id, 
                email: user.email, 
                userType: user.userType,
                firstName: user.firstName,
                lastName: user.lastName,
                emailVerified: false
            },
            token,
            verificationSent: true
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get user from database
        const user = await db.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, userType: user.user_type },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            user: { id: user.id, email: user.email, userType: user.user_type },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Profile Routes
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userType = req.user.userType;

        if (userType === 'dreamer') {
            const profile = await db.getDreamerProfile(userId);
            res.json({ profile: profile || {} });
        } else {
            // For sponsors, you would implement getSponsorProfile
            res.json({ profile: {} });
        }
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userType = req.user.userType;
        const profileData = req.body;

        if (userType === 'dreamer') {
            // Check if profile exists
            const existingProfile = await db.getDreamerProfile(userId);
            
            let profile;
            if (existingProfile) {
                profile = await db.updateDreamerProfile(userId, profileData);
            } else {
                profile = await db.createDreamerProfile(userId, profileData);
            }

            res.json({
                message: 'Profile saved successfully',
                profile
            });
        } else {
            res.status(400).json({ error: 'Profile management not implemented for sponsors yet' });
        }
    } catch (error) {
        console.error('Save profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Offers Routes
app.get('/api/offers', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userType = req.user.userType;

        if (userType === 'dreamer') {
            const offers = await db.getOffersByDreamerId(userId);
            res.json({ offers });
        } else {
            res.json({ offers: [] }); // Implement sponsor offers later
        }
    } catch (error) {
        console.error('Get offers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/offers/:id/status', authenticateToken, async (req, res) => {
    try {
        const offerId = req.params.id;
        const { status } = req.body;

        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await db.updateOfferStatus(offerId, status);
        res.json({
            message: `Offer ${status} successfully`,
            offer: result
        });
    } catch (error) {
        console.error('Update offer status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Notifications Routes
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await db.getNotificationsByUserId(userId);
        res.json({ notifications });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const result = await db.markNotificationAsRead(notificationId);
        res.json({
            message: 'Notification marked as read',
            notification: result
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/notifications/mark-all-read', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.markAllNotificationsAsRead(userId);
        res.json({
            message: 'All notifications marked as read',
            result
        });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Milestones Routes
app.get('/api/milestones', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userType = req.user.userType;

        if (userType === 'dreamer') {
            const milestones = await db.getMilestonesByDreamerId(userId);
            res.json({ milestones });
        } else {
            res.json({ milestones: [] });
        }
    } catch (error) {
        console.error('Get milestones error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/milestones', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userType = req.user.userType;
        const milestoneData = req.body;

        if (userType !== 'dreamer') {
            return res.status(403).json({ error: 'Only dreamers can create milestones' });
        }

        const milestone = await db.createMilestone(userId, milestoneData);
        res.status(201).json({
            message: 'Milestone created successfully',
            milestone
        });
    } catch (error) {
        console.error('Create milestone error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/milestones/:id', authenticateToken, async (req, res) => {
    try {
        const milestoneId = req.params.id;
        const milestoneData = req.body;

        const milestone = await db.updateMilestone(milestoneId, milestoneData);
        res.json({
            message: 'Milestone updated successfully',
            milestone
        });
    } catch (error) {
        console.error('Update milestone error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Email verification routes
app.get('/api/auth/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { email } = req.query;

        if (!email || !token) {
            return res.status(400).json({ error: 'Email and token are required' });
        }

        const result = await db.verifyUserEmail(email, token);
        res.json({
            message: 'Email verified successfully',
            result
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(400).json({ error: error.message || 'Invalid verification token' });
    }
});

app.post('/api/auth/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        await db.updateVerificationToken(email, verificationToken);

        // Send verification email
        await sendVerificationEmail(email, verificationToken);

        res.json({
            message: 'Verification email sent successfully'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User preferences routes
app.get('/api/preferences', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = await db.getUserPreferences(userId);
        res.json({ preferences: preferences || {} });
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/preferences', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = req.body;

        // Check if preferences exist
        const existingPreferences = await db.getUserPreferences(userId);
        
        let result;
        if (existingPreferences) {
            result = await db.updateUserPreferences(userId, preferences);
        } else {
            result = await db.createUserPreferences(userId, preferences);
        }

        res.json({
            message: 'Preferences saved successfully',
            preferences: result
        });
    } catch (error) {
        console.error('Save preferences error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 SponsoraCareer server running on http://localhost:${PORT}`);
    console.log(`📊 Database: SQLite`);
    console.log(`🔐 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    db.close();
    process.exit(0);
});

// Helper functions
function generateVerificationToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
}

async function sendVerificationEmail(email, token) {
    // In a real application, this would send an actual email
    // For demo purposes, we'll just log it and simulate the process
    
    console.log(`📧 Verification email sent to: ${email}`);
    console.log(`🔗 Verification link: http://localhost:${PORT}/api/auth/verify/${token}?email=${encodeURIComponent(email)}`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return { success: true, email, token };
}

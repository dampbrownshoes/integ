/**
 * Main server file for integration service
 * Handles mobile onboarding flow
 */

const express = require('express');
const AuthHandler = require('./auth-handler');

const app = express();
const authHandler = new AuthHandler();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Mobile onboarding endpoint
app.post('/api/mobile/onboard', authHandler.authenticateRequest.bind(authHandler), (req, res) => {
    const { userId, deviceInfo } = req.body;
    
    // Simulate onboarding process
    res.json({
        success: true,
        userId: req.user.userId,
        message: 'Mobile onboarding completed successfully',
        tokenType: req.user.isLegacy ? 'legacy' : 'new',
        timestamp: new Date().toISOString()
    });
});

// Token generation endpoint for testing
app.post('/api/auth/token', (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    
    const token = authHandler.generateToken(userId);
    res.json({ token });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Integration service running on port ${PORT}`);
    });
}

module.exports = app;
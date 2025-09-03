const express = require('express');
const AuthHandler = require('./auth-handler');

const app = express();
const authHandler = new AuthHandler();

app.use(express.json());

// Mobile onboarding endpoint
app.post('/api/mobile/onboard', (req, res) => {
  try {
    const { userId, deviceId } = req.body;
    
    if (!userId || !deviceId) {
      return res.status(400).json({ error: 'Missing userId or deviceId' });
    }

    const authHeaders = authHandler.generateAuthHeaders(userId, deviceId);
    
    res.json({
      success: true,
      authHeaders,
      message: 'Mobile onboarding successful'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Protected endpoint that validates tokens
app.get('/api/mobile/profile', (req, res) => {
  try {
    const userData = authHandler.validateRequest(req.headers);
    
    res.json({
      success: true,
      user: userData,
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    // This is where 400 errors occur with legacy tokens
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mobile onboarding service running on port ${PORT}`);
});

module.exports = app;
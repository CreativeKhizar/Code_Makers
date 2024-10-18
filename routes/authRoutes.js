const express = require('express');
const dbService = require('../services/dbService');
const router = express.Router();

// Registration Route
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        await dbService.registerUser(name, email, password);
        res.json({ success: true, message: 'Registration successful!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Registration failed.' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await dbService.loginUser(email, password);
        if (user) {
            res.json({ success: true, message: 'Login successful!' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Login failed.' });
    }
});

module.exports = router;

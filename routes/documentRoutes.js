const express = require('express');
const router = express.Router();
const pool = require('../config/internshipDbConfig'); // Adjust the path as needed

// GET route to fetch all domains with approval and internship_id
router.get('/domains', async (req, res) => {
    try {
        const email=req.query.email;
        const [domains] = await pool.execute(
            'SELECT domain, internship_id, approval FROM internship_applications WHERE email = ?', 
            [email]  // Pass the email as a parameter
          );
        res.json(domains);
    } catch (error) {
        console.error('Error fetching domains:', error);
        res.status(500).json({ message: 'There was an error fetching domains.' });
    }
});

module.exports = router;

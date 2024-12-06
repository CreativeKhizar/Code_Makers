const express = require('express');
const router = express.Router();
const db = require('../config/dbConfig');  // Your MySQL connection pool

// Route to fetch data by id and get the current date
router.get('/fetchData/:id', async (req, res) => {
    //console.log("Hello");
    const id = req.params.id;  // Retrieve the id from the request parameter
    //console.log(id);

    // Query the database to fetch data based on id
    const query = 'SELECT * FROM internship_applications WHERE internship_id = ?';

    try {
        // Use the promise-based db.query for async/await
        const [results] = await db.execute(query, [id]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Data not found for the provided ID' });
        }

        // Get the current date (or fetch a date from the database if needed)
        const currentDate = new Date().toISOString();  // ISO format date

        // Send response with data and current date
        res.json({
            data: results[0],  // Assuming the query returns only one result
            date: currentDate
        });
    } catch (err) {
        console.error('Database error: ', err);
        return res.status(500).json({ message: 'Error fetching data from the database' });
    }
});

module.exports = router;

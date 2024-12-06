const pool = require('../config/dbConfig');

// Register User Function
async function registerUser(name, email, password) {
    const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    await pool.execute(query, [name, email, password]);
}

// Login User Function
async function loginUser(email, password) {
    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    const [rows] = await pool.execute(query, [email, password]);
    return rows[0];
}

async function deleteApplication(id) {
    await db.query('DELETE FROM internship_applications WHERE internship_id = ?', [id]);
}

module.exports = { registerUser, loginUser, deleteApplication };

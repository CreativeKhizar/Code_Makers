const mysql = require('mysql2/promise');

const internshipPool = mysql.createPool({
    host: 'localhost',
    user: 'root',      // Change to your MySQL username
    password: 'admin123',   // Change to your MySQL password
    database: 'auth_system'
});

module.exports = internshipPool;

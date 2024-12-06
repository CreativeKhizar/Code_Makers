const mysql = require('mysql2/promise');

// Create MySQL Pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'auth_system'
});

module.exports = pool;

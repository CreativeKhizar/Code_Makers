const internshipPool = require('../config/internshipDbConfig');

// Function to insert internship application
async function submitApplication(data) {
    const query = `
        INSERT INTO internship_applications 
        (name, rollnumber, collegename, phonenumber, email, domain, start_date, end_date, approval) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, false)
    `;
    const { name, rollnumber, collegename, phonenumber, email, domain, start_date, end_date } = data;
    await internshipPool.execute(query, [name, rollnumber, collegename, phonenumber, email, domain, start_date, end_date]);
}

module.exports = { submitApplication };

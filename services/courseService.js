const db = require('../config/dbConfig'); // Make sure this points to your database configuration

// Fetch all courses
async function getAllCourses() {
    const [results] = await db.query('SELECT course_name FROM courses');
    return results.map(row => row.course_name);
}

async function appendCourse(course){
    const query='Insert into courses values(?)';
    const [result]=await db.execute(query,[course]);
    return results;
}
async function deleteCourse(courseId) {
    const query = 'DELETE FROM courses WHERE course_name = ?';
    console.log(courseId);
    const [result] = await db.execute(query, [courseId]);
    return result.affectedRows > 0; // Returns true if a row was deleted
}

module.exports = {
    appendCourse,
    getAllCourses,
    deleteCourse
};

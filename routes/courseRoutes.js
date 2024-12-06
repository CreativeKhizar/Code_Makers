const express = require('express');
const router = express.Router();
const courseService = require('../services/courseService');

// Route to fetch all courses
router.get('/courses', async (req, res) => {
    try {
        const courses = await courseService.getAllCourses();
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});
router.get('/courses/:id', async (req, res) => {
    const courseId = req.params.id;
    try {
        const result = await courseService.deleteCourse(courseId);
        if (result) {
            res.status(200).json({ message: 'Course deleted successfully' });
        } else {
            res.status(404).json({ error: 'Course not found' });
        }
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ error: 'Failed to delete course' });
    }
});
module.exports = router;

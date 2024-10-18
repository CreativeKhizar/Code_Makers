const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const internshipRoutes = require('./routes/internshipRoutes'); // Keep this route
const documentRoutes = require('./routes/documentRoutes'); // New route
const adminRoutes = require('./routes/adminRoutes');
const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve home.html at the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', authRoutes); // Authentication routes
app.use('/api', internshipRoutes); // Internship routes
app.use('/api', documentRoutes); // Document routes
app.use('/admin', adminRoutes); // Admin panel routes

// Serve the certificates and QR codes
app.use('/approval', express.static(path.join(__dirname, 'public/approval'))); // Serve approval pages
app.use('/qr_codes', express.static(path.join(__dirname, 'public/qr_codes'))); // Serve QR code images

// Server
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

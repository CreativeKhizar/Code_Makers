const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const documentRoutes = require('./routes/documentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const courseRoutes = require('./routes/courseRoutes'); // New course route
const pageRoutes=require('./routes/pageRoutes');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve home.html at the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', authRoutes);
app.use('/api', internshipRoutes);
app.use('/api', documentRoutes);
app.use('/api', courseRoutes); // Course routes
app.use('/admin', adminRoutes);
app.use('/pages',pageRoutes);
// Serve the certificates and QR codes
app.use('/approval', express.static(path.join(__dirname, 'public/approval')));
app.use('/qr_codes', express.static(path.join(__dirname, 'public/qr_codes')));

// Server
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/treezam';

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
  console.log(`Database: ${mongoose.connection.name}`);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('Please check your MONGODB_URI in .env file');
  process.exit(1);
});

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trees', require('./routes/trees'));
app.use('/api/challenges', require('./routes/challenges'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'TreeZam API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

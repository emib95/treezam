const express = require('express');
const authenticate = require('../middleware/auth');
const User = require('../models/User');
const TreeIdentification = require('../models/TreeIdentification');

const router = express.Router();

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('treesIdentified', 'species scientificName identifiedAt location');

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const trees = await TreeIdentification.find({ userId: req.user._id });

    // Calculate additional stats
    const uniqueSpecies = new Set(trees.map(t => t.species));
    const speciesByLocation = {};
    const speciesByDate = {};

    trees.forEach(tree => {
      const city = tree.city || 'Unknown';
      if (!speciesByLocation[city]) {
        speciesByLocation[city] = new Set();
      }
      speciesByLocation[city].add(tree.species);

      const date = tree.identifiedAt.toISOString().split('T')[0];
      if (!speciesByDate[date]) {
        speciesByDate[date] = new Set();
      }
      speciesByDate[date].add(tree.species);
    });

    const stats = {
      totalTreesIdentified: user.totalTreesIdentified,
      uniqueSpeciesCount: user.uniqueSpeciesCount,
      experience: user.experience,
      level: user.level,
      achievements: user.achievements,
      speciesByLocation: Object.keys(speciesByLocation).map(city => ({
        city,
        count: speciesByLocation[city].size,
      })),
      recentActivity: trees
        .sort((a, b) => b.identifiedAt - a.identifiedAt)
        .slice(0, 10)
        .map(t => ({
          species: t.species,
          date: t.identifiedAt,
          location: t.city,
        })),
    };

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/me', authenticate, async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findById(req.user._id);

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      user.username = username;
    }

    await user.save();
    res.json({ user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

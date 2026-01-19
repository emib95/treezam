const express = require('express');
const authenticate = require('../middleware/auth');
const User = require('../models/User');
const TreeIdentification = require('../models/TreeIdentification');

const router = express.Router();

// Get global leaderboard
router.get('/global', authenticate, async (req, res) => {
  try {
    const { type = 'totalTrees' } = req.query;

    let sortField = 'totalTreesIdentified';
    if (type === 'uniqueSpecies') {
      sortField = 'uniqueSpeciesCount';
    } else if (type === 'experience') {
      sortField = 'experience';
    }

    const users = await User.find()
      .select('username totalTreesIdentified uniqueSpeciesCount experience level')
      .sort({ [sortField]: -1 })
      .limit(100);

    // Add rank
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      totalTreesIdentified: user.totalTreesIdentified,
      uniqueSpeciesCount: user.uniqueSpeciesCount,
      experience: user.experience,
      level: user.level,
    }));

    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get location-based leaderboard
router.get('/location', authenticate, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location coordinates required' });
    }

    // Find trees in the area
    const treesInArea = await TreeIdentification.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(radius),
        },
      },
    });

    // Aggregate by user
    const userStats = {};
    treesInArea.forEach(tree => {
      const userId = tree.userId.toString();
      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          count: 0,
          uniqueSpecies: new Set(),
        };
      }
      userStats[userId].count++;
      userStats[userId].uniqueSpecies.add(tree.species);
    });

    // Get user details and sort
    // Bug 4 Fix: Add null check for deleted users
    const leaderboard = await Promise.all(
      Object.values(userStats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 50)
        .map(async (stat, index) => {
          const user = await User.findById(stat.userId)
            .select('username level experience');
          
          // Bug 4 Fix: Skip if user is deleted
          if (!user) {
            return null;
          }
          
          return {
            rank: index + 1,
            username: user.username,
            treesInArea: stat.count,
            uniqueSpeciesInArea: stat.uniqueSpecies.size,
            level: user.level,
            experience: user.experience,
          };
        })
    );

    // Filter out null entries (deleted users)
    const filteredLeaderboard = leaderboard.filter(entry => entry !== null);

    res.json({ leaderboard: filteredLeaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's rank
router.get('/my-rank', authenticate, async (req, res) => {
  try {
    const { type = 'totalTrees' } = req.query;

    let sortField = 'totalTreesIdentified';
    if (type === 'uniqueSpecies') {
      sortField = 'uniqueSpeciesCount';
    } else if (type === 'experience') {
      sortField = 'experience';
    }

    const userValue = req.user[sortField];
    const rank = await User.countDocuments({
      [sortField]: { $gt: userValue },
    }) + 1;

    const totalUsers = await User.countDocuments();

    res.json({
      rank,
      totalUsers,
      value: userValue,
      type,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

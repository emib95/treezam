const express = require('express');
const authenticate = require('../middleware/auth');
const Challenge = require('../models/Challenge');
const TreeIdentification = require('../models/TreeIdentification');
const User = require('../models/User');

const router = express.Router();

// Helper function to calculate challenge progress (shared with trees.js)
async function calculateChallengeProgress(challenge, userId, userTrees) {
  let progress = 0;

  if (challenge.type === 'location') {
    // Bug 2 Fix: Count all trees in location, not unique species
    const trees = await TreeIdentification.find({
      userId: userId,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: challenge.location.coordinates,
          },
          $maxDistance: challenge.location.radius || 5000,
        },
      },
    });
    progress = trees.length; // Count all trees, not unique species
  } else if (challenge.type === 'daily') {
    // Count unique species in a day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const trees = await TreeIdentification.find({
      userId: userId,
      identifiedAt: { $gte: today },
    });
    const uniqueSpecies = new Set(trees.map(t => t.species));
    progress = uniqueSpecies.size;
  } else if (challenge.type === 'species_count') {
    // Count unique species total
    const uniqueSpecies = new Set(userTrees.map(t => t.species));
    progress = uniqueSpecies.size;
  } else if (challenge.type === 'streak') {
    // Bug 1 Fix: Handle streak challenge type
    // Count consecutive days with at least one tree identification
    const trees = await TreeIdentification.find({ userId: userId })
      .sort({ identifiedAt: -1 });
    
    if (trees.length === 0) {
      progress = 0;
    } else {
      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      // Check if there's activity today
      const todayTrees = trees.filter(t => {
        const treeDate = new Date(t.identifiedAt);
        treeDate.setHours(0, 0, 0, 0);
        return treeDate.getTime() === currentDate.getTime();
      });
      
      if (todayTrees.length > 0) {
        streak = 1;
        let checkDate = new Date(currentDate);
        checkDate.setDate(checkDate.getDate() - 1);
        
        // Count backwards for consecutive days
        for (let i = 1; i < 365; i++) {
          const dayTrees = trees.filter(t => {
            const treeDate = new Date(t.identifiedAt);
            treeDate.setHours(0, 0, 0, 0);
            return treeDate.getTime() === checkDate.getTime();
          });
          
          if (dayTrees.length > 0) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
      progress = streak;
    }
  }

  return progress;
}

// Get all active challenges
router.get('/', authenticate, async (req, res) => {
  try {
    const challenges = await Challenge.find({ isActive: true })
      .populate('participants.userId', 'username')
      .sort({ createdAt: -1 });

    // Add user's progress to each challenge
    const challengesWithProgress = challenges.map(challenge => {
      const userParticipant = challenge.participants.find(
        p => p.userId._id.toString() === req.user._id.toString()
      );
      return {
        ...challenge.toObject(),
        userProgress: userParticipant || { progress: 0, completed: false },
      };
    });

    res.json({ challenges: challengesWithProgress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join a challenge
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Check if user already joined
    const existingParticipant = challenge.participants.find(
      p => p.userId.toString() === req.user._id.toString()
    );

    if (existingParticipant) {
      return res.status(400).json({ error: 'Already joined this challenge' });
    }

    challenge.participants.push({
      userId: req.user._id,
      progress: 0,
      completed: false,
    });

    await challenge.save();
    res.json({ message: 'Successfully joined challenge', challenge });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update challenge progress (called after tree identification)
router.post('/:id/update-progress', authenticate, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const participant = challenge.participants.find(
      p => p.userId.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res.status(400).json({ error: 'Not a participant in this challenge' });
    }

    // Get user's trees for progress calculation
    const userTrees = await TreeIdentification.find({ userId: req.user._id });

    // Calculate progress using the shared helper function
    const progress = await calculateChallengeProgress(challenge, req.user._id, userTrees);

    participant.progress = progress;

    // For streak challenges, update last activity date
    if (challenge.type === 'streak') {
      participant.lastActivityDate = new Date();
    }

    // Check if challenge is completed
    if (progress >= challenge.targetValue && !participant.completed) {
      participant.completed = true;
      participant.completedAt = new Date();

      // Award rewards
      const user = await User.findById(req.user._id);
      user.experience += challenge.reward.experience || 0;
      if (challenge.reward.achievement) {
        user.achievements.push(challenge.reward.achievement);
      }
      await user.save();
    }

    await challenge.save();
    res.json({ progress, completed: participant.completed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create challenge (admin only - for now, anyone can create)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      targetValue,
      location,
      startDate,
      endDate,
      reward,
    } = req.body;

    const challenge = new Challenge({
      name,
      description,
      type,
      targetValue,
      location,
      startDate,
      endDate,
      reward: reward || { experience: 100 },
    });

    await challenge.save();
    res.status(201).json({ challenge });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

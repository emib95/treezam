const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticate = require('../middleware/auth');
const TreeIdentification = require('../models/TreeIdentification');
const User = require('../models/User');
const Challenge = require('../models/Challenge');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/trees';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'tree-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

// AI Model Integration - This is a placeholder
// In production, you would integrate with a real AI service like:
// - Google Cloud Vision API
// - AWS Rekognition
// - Custom trained model (TensorFlow, PyTorch)
// - PlantNet API
// - iNaturalist API
async function identifyTree(imagePath) {
  // TODO: Replace with actual AI model integration
  // For now, return a mock response
  const mockSpecies = [
    { species: 'Oak', scientificName: 'Quercus robur', confidence: 0.95 },
    { species: 'Maple', scientificName: 'Acer saccharum', confidence: 0.92 },
    { species: 'Pine', scientificName: 'Pinus sylvestris', confidence: 0.88 },
    { species: 'Birch', scientificName: 'Betula pendula', confidence: 0.85 },
    { species: 'Elm', scientificName: 'Ulmus americana', confidence: 0.82 },
  ];
  
  const random = mockSpecies[Math.floor(Math.random() * mockSpecies.length)];
  
  // In production, you would:
  // 1. Send image to AI service
  // 2. Get classification results
  // 3. Return species information
  
  return random;
}

// Helper function to calculate challenge progress
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

// Upload and identify tree
router.post('/identify', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { latitude, longitude, address, city, country } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location coordinates are required' });
    }

    // Identify tree using AI
    const identification = await identifyTree(req.file.path);

    // Create tree identification record
    const treeId = new TreeIdentification({
      userId: req.user._id,
      imageUrl: `/uploads/trees/${req.file.filename}`,
      species: identification.species,
      scientificName: identification.scientificName,
      confidence: identification.confidence,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      address,
      city,
      country,
    });

    await treeId.save();

    // Update user stats
    const user = await User.findById(req.user._id);
    user.treesIdentified.push(treeId._id);
    user.totalTreesIdentified += 1;

    // Check for unique species
    const userTrees = await TreeIdentification.find({ userId: user._id });
    const uniqueSpecies = new Set(userTrees.map(t => t.species));
    user.uniqueSpeciesCount = uniqueSpecies.size;

    // Add experience points
    user.experience += 10;
    await user.save();

    // Update challenge progress for all active challenges
    try {
      const challenges = await Challenge.find({
        isActive: true,
        'participants.userId': req.user._id,
      });

      for (const challenge of challenges) {
        const participant = challenge.participants.find(
          p => p.userId.toString() === req.user._id.toString()
        );

        if (!participant || participant.completed) continue;

        // Use the helper function for consistent progress calculation
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
          user.experience += challenge.reward.experience || 0;
          if (challenge.reward.achievement) {
            user.achievements.push(challenge.reward.achievement);
          }
          await user.save();
        }

        await challenge.save();
      }
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      // Don't fail the request if challenge update fails
    }

    res.status(201).json({
      success: true,
      tree: treeId,
      userStats: {
        totalTreesIdentified: user.totalTreesIdentified,
        uniqueSpeciesCount: user.uniqueSpeciesCount,
        experience: user.experience,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's tree identifications
router.get('/my-trees', authenticate, async (req, res) => {
  try {
    const trees = await TreeIdentification.find({ userId: req.user._id })
      .sort({ identifiedAt: -1 })
      .limit(100);

    res.json({ trees });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tree by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const tree = await TreeIdentification.findById(req.params.id);
    if (!tree) {
      return res.status(404).json({ error: 'Tree not found' });
    }
    res.json({ tree });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

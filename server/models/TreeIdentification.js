const mongoose = require('mongoose');

const treeIdentificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  species: {
    type: String,
    required: true,
  },
  scientificName: {
    type: String,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  country: {
    type: String,
  },
  identifiedAt: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
  },
});

// Create geospatial index for location queries
treeIdentificationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('TreeIdentification', treeIdentificationSchema);

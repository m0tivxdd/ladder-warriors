// server/models/Pack.js
const mongoose = require('mongoose');

const PackSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  guarantees: {
    type: String
  },
  rarityWeights: {
    common: Number,
    uncommon: Number,
    rare: Number,
    epic: Number,
    legendary: Number
  }
});

// Create default packs
const createDefaultPacks = async () => {
  const packs = [
    {
      type: 'bronze',
      price: 100,
      description: 'Bronze pack with 3 random players',
      guarantees: 'At least 1 uncommon or better',
      rarityWeights: {
        common: 75,
        uncommon: 20,
        rare: 4,
        epic: 1,
        legendary: 0
      }
    },
    {
      type: 'silver',
      price: 250,
      description: 'Silver pack with 3 random players',
      guarantees: 'At least 1 rare or better',
      rarityWeights: {
        common: 50,
        uncommon: 35,
        rare: 12,
        epic: 2.5,
        legendary: 0.5
      }
    },
    {
      type: 'gold',
      price: 500,
      description: 'Gold pack with 3 random players',
      guarantees: 'At least 1 epic or better',
      rarityWeights: {
        common: 25,
        uncommon: 40,
        rare: 25,
        epic: 8,
        legendary: 2
      }
    },
    {
      type: 'platinum',
      price: 1000,
      description: 'Platinum pack with 3 random players',
      guarantees: 'Guaranteed 1 legendary',
      rarityWeights: {
        common: 10,
        uncommon: 30,
        rare: 35,
        epic: 20,
        legendary: 5
      }
    },
    {
      type: 'diamond',
      price: 2000,
      description: 'Diamond pack with 3 top players',
      guarantees: 'Guaranteed 3 epic or better, with at least 1 legendary',
      rarityWeights: {
        common: 0,
        uncommon: 0,
        rare: 20,
        epic: 60,
        legendary: 20
      }
    }
  ];

  const Pack = mongoose.model('Pack', PackSchema);
  const count = await Pack.countDocuments();
  
  if (count === 0) {
    await Pack.insertMany(packs);
    console.log('Default packs created');
  }
};

module.exports = {
  Pack: mongoose.model('Pack', PackSchema),
  createDefaultPacks
};
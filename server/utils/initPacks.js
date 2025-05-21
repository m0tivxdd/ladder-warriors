const mongoose = require('mongoose');
const { Pack } = require('../models/Pack');
require('dotenv').config();

const initializePacks = async () => {
  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ladder-warriors');
      console.log('MongoDB connected for pack initialization');
    }

    // Define default packs
    const defaultPacks = [
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

    // Check if packs exist
    const existingPacks = await Pack.countDocuments();
    console.log(`Found ${existingPacks} existing packs`);

    if (existingPacks === 0) {
      // Insert packs if none exist
      await Pack.insertMany(defaultPacks);
      console.log('Default packs created');
    } else {
      console.log('Packs already exist, skipping initialization');
    }
  } catch (error) {
    console.error('Error initializing packs:', error);
  }
};

// Run the function if this file is executed directly
if (require.main === module) {
  initializePacks()
    .then(() => {
      console.log('Pack initialization complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('Pack initialization failed:', error);
      process.exit(1);
    });
} else {
  // Export for use in other files
  module.exports = initializePacks;
}
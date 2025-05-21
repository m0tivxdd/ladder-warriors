const mongoose = require('mongoose');
const { processPlayerData } = require('./processCSV');
const initializePacks = require('./initPacks');
await initializePacks();
console.log('Packs initialized');

require('dotenv').config();


// Import models
const Player = require('../models/Player');

const initDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ladder-warriors', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB connected');
    
    // Process player data from CSV
    const players = await processPlayerData();
    
    // Check if players collection is empty
    const existingPlayers = await Player.countDocuments();
    
    if (existingPlayers === 0) {
      // Insert players into database
      await Player.insertMany(players);
      console.log(`Inserted ${players.length} players into database`);
    } else {
      console.log('Players already exist in database, skipping import');
    }
    
    console.log('Database initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
 
};

initDatabase();
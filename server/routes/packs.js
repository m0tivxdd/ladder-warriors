// server/routes/packs.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Player = require('../models/Player');
const { Pack } = require('../models/Pack');

// Get user's packs
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Count packs by type
    const packsCount = user.packs.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // Get all pack types for information
    const packTypes = await Pack.find().select('type price description guarantees');
    
    const packs = packTypes.map(pack => ({
      ...pack.toObject(),
      owned: packsCount[pack.type] || 0
    }));
    
    res.json(packs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Open a pack
router.post('/open', auth, async (req, res) => {
  try {
    const { packType } = req.body;
    
    // Check if user has the pack
    const user = await User.findById(req.user._id);
    
    if (!user.packs.includes(packType)) {
      return res.status(400).json({ message: 'Pack not owned' });
    }
    
    // Get pack details
    const pack = await Pack.findOne({ type: packType });
    
    if (!pack) {
      return res.status(404).json({ message: 'Pack type not found' });
    }
    
    // Get players by rarity and weights
    const players = [];
    
    // Special handling for guaranteed cards
    if (packType === 'platinum' || packType === 'diamond') {
      // Guaranteed legendary
      const legendary = await Player.find({ rarity: 'legendary' });
      const randomLegendary = legendary[Math.floor(Math.random() * legendary.length)];
      players.push(randomLegendary);
    }
    
    if (packType === 'gold') {
      // Guaranteed epic or better
      const epicOrBetter = await Player.find({ 
        rarity: { $in: ['epic', 'legendary'] } 
      });
      const randomEpic = epicOrBetter[Math.floor(Math.random() * epicOrBetter.length)];
      players.push(randomEpic);
    }
    
    if (packType === 'silver') {
      // Guaranteed rare or better
      const rareOrBetter = await Player.find({ 
        rarity: { $in: ['rare', 'epic', 'legendary'] } 
      });
      const randomRare = rareOrBetter[Math.floor(Math.random() * rareOrBetter.length)];
      players.push(randomRare);
    }
    
    if (packType === 'bronze') {
      // Guaranteed uncommon or better
      const uncommonOrBetter = await Player.find({ 
        rarity: { $in: ['uncommon', 'rare', 'epic', 'legendary'] } 
      });
      const randomUncommon = uncommonOrBetter[Math.floor(Math.random() * uncommonOrBetter.length)];
      players.push(randomUncommon);
    }
    
    // Fill remaining slots with random players based on weights
    while (players.length < 3) {
      // Calculate total weight for this pack
      let totalWeight = 0;
      for (const rarity in pack.rarityWeights) {
        totalWeight += pack.rarityWeights[rarity];
      }
      
      // Get a random number between 0 and totalWeight
      const random = Math.random() * totalWeight;
      
      // Determine which rarity was selected
      let cumulativeWeight = 0;
      let selectedRarity = 'common'; // Default
      
      for (const rarity in pack.rarityWeights) {
        cumulativeWeight += pack.rarityWeights[rarity];
        if (random <= cumulativeWeight) {
          selectedRarity = rarity;
          break;
        }
      }
      
      // Get random player of selected rarity
      const rarityPlayers = await Player.find({ rarity: selectedRarity });
      
      if (rarityPlayers.length > 0) {
        const randomPlayer = rarityPlayers[Math.floor(Math.random() * rarityPlayers.length)];
        
        // Avoid duplicates in the same pack
        if (!players.some(p => p._id.toString() === randomPlayer._id.toString())) {
          players.push(randomPlayer);
        }
      }
    }
    
    // Add players to user's collection
    for (const player of players) {
      // Check if user already has this player
      const existingCard = user.collection.find(
        card => card.player.toString() === player._id.toString()
      );
      
      if (existingCard) {
        // Increment quantity
        existingCard.quantity += 1;
      } else {
        // Add new player to collection
        user.collection.push({
          player: player._id,
          quantity: 1
        });
      }
    }
    
    // Remove the pack from user's inventory
    const packIndex = user.packs.indexOf(packType);
    if (packIndex !== -1) {
      user.packs.splice(packIndex, 1);
    }
    
    // Save user with updated collection
    await user.save();
    
    // Return players with full details
    const playerDetails = await Promise.all(
      players.map(async (player) => {
        return {
          ...player.toObject(),
          _id: player._id
        };
      })
    );
    
    res.json({
      message: 'Pack opened successfully',
      players: playerDetails
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
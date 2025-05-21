const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Player = require('../models/Player');

// Get user's collection
router.get('/', auth, async (req, res) => {
  try {
    // Find user and populate player details in collection
    const user = await User.findById(req.user._id)
      .select('collection')
      .populate({
        path: 'collection.player',
        model: 'Player'
      });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Format collection for response
    const collection = user.collection.map(item => ({
      id: item._id,
      player: item.player,
      quantity: item.quantity,
      isListed: item.isListed
    }));
    
    res.json(collection);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's collection stats
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('collection')
      .populate({
        path: 'collection.player',
        model: 'Player'
      });
    
    // Count total cards
    const totalCards = user.collection.reduce(
      (total, item) => total + item.quantity, 0
    );
    
    // Count cards by rarity
    const rarityCount = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    };
    
    user.collection.forEach(item => {
      if (item.player && item.player.rarity) {
        rarityCount[item.player.rarity] += item.quantity;
      }
    });
    
    // Count unique players
    const uniquePlayers = user.collection.length;
    
    // Calculate collection value
    const collectionValue = user.collection.reduce(
      (total, item) => {
        if (item.player && item.player.value) {
          return total + (item.player.value * item.quantity);
        }
        return total;
      }, 0
    );
    
    // Get players by position
    const positionCount = {
      Top: 0,
      Jungle: 0,
      Mid: 0,
      ADC: 0,
      Support: 0
    };
    
    user.collection.forEach(item => {
      if (item.player && item.player.position) {
        positionCount[item.player.position] += item.quantity;
      }
    });
    
    res.json({
      totalCards,
      uniquePlayers,
      rarityCount,
      positionCount,
      collectionValue
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific card details
router.get('/card/:cardId', auth, async (req, res) => {
  try {
    const { cardId } = req.params;
    
    // Find the specific card in user's collection
    const user = await User.findById(req.user._id);
    
    const card = user.collection.id(cardId);
    
    if (!card) {
      return res.status(404).json({ message: 'Card not found in collection' });
    }
    
    // Get full player details
    const player = await Player.findById(card.player);
    
    if (!player) {
      return res.status(404).json({ message: 'Player details not found' });
    }
    
    res.json({
      card: {
        id: card._id,
        quantity: card.quantity,
        isListed: card.isListed
      },
      player
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
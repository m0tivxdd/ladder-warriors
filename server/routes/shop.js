// server/routes/shop.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Pack } = require('../models/Pack');
const User = require('../models/User');

// Get all packs
router.get('/packs', async (req, res) => {
  try {
    const packs = await Pack.find();
    res.json(packs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Buy a pack
router.post('/packs/buy', auth, async (req, res) => {
  try {
    const { packType } = req.body;
    
    // Find pack
    const pack = await Pack.findOne({ type: packType });
    
    if (!pack) {
      return res.status(404).json({ message: 'Pack not found' });
    }
    
    // Check if user has enough currency
    if (req.user.currency < pack.price) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }
    
    // Update user currency and add pack
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: { currency: -pack.price },
        $push: { packs: pack.type }
      }
    );
    
    res.json({
      message: `Successfully purchased ${pack.type} pack`,
      packType: pack.type
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
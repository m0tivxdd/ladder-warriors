// server/routes/market.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Player = require('../models/Player');
const Market = require('../models/Market');
const mongoose = require('mongoose');

// Get all market listings
router.get('/', async (req, res) => {
  try {
    // Get market listings with player and seller details
    const listings = await Market.find({ active: true })
      .populate('player')
      .populate('seller', 'username')
      .sort({ listedAt: -1 });
    
    res.json(listings);
  } catch (error) {
    console.error('Error getting market listings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's active listings
router.get('/my-listings', auth, async (req, res) => {
  try {
    const listings = await Market.find({ 
      seller: req.user._id,
      active: true
    })
    .populate('player')
    .sort({ listedAt: -1 });
    
    res.json(listings);
  } catch (error) {
    console.error('Error getting user listings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new listing
router.post('/list', auth, async (req, res) => {
  try {
    const { playerId, price } = req.body;
    
    // Validate inputs
    if (!playerId || !price || price <= 0) {
      return res.status(400).json({ message: 'Invalid listing details' });
    }
    
    // Check if player exists in user's collection
    const user = await User.findById(req.user._id);
    const playerInCollection = user.collection.find(
      item => item.player.toString() === playerId && item.quantity > 0 && !item.isListed
    );
    
    if (!playerInCollection) {
      return res.status(400).json({ message: 'Player not in collection or already listed' });
    }
    
    // Create market listing
    const listing = new Market({
      seller: req.user._id,
      player: playerId,
      price
    });
    
    await listing.save();
    
    // Mark player as listed in user's collection
    playerInCollection.isListed = true;
    await user.save();
    
    // Return listing with player details
    const populatedListing = await Market.findById(listing._id)
      .populate('player')
      .populate('seller', 'username');
    
    res.status(201).json({
      message: 'Listing created successfully',
      listing: populatedListing
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel a listing
router.post('/cancel/:listingId', auth, async (req, res) => {
  try {
    const { listingId } = req.params;
    
    // Check if listing exists and belongs to user
    const listing = await Market.findOne({
      _id: listingId,
      seller: req.user._id,
      active: true
    });
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    
    // Mark listing as inactive
    listing.active = false;
    await listing.save();
    
    // Mark player as not listed in user's collection
    const user = await User.findById(req.user._id);
    const playerInCollection = user.collection.find(
      item => item.player.toString() === listing.player.toString() && item.isListed
    );
    
    if (playerInCollection) {
      playerInCollection.isListed = false;
      await user.save();
    }
    
    res.json({ message: 'Listing cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling listing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Buy a card from market - FIXED VERSION
router.post('/buy/:listingId', auth, async (req, res) => {
  // Start without a transaction first to simplify
  try {
    const { listingId } = req.params;
    console.log('Processing buy request for listing:', listingId);
    
    // Check if listing exists and is active
    const listing = await Market.findOne({
      _id: listingId,
      active: true
    });
    
    if (!listing) {
      console.log('Listing not found or not active');
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if buyer is not the seller
    if (listing.seller.toString() === req.user._id.toString()) {
      console.log('Buyer is the seller');
      return res.status(400).json({ message: 'Cannot buy your own listing' });
    }
    
    // Get buyer and check funds
    const buyer = await User.findById(req.user._id);
    console.log('Buyer currency:', buyer.currency, 'Listing price:', listing.price);
    
    if (buyer.currency < listing.price) {
      console.log('Insufficient funds');
      return res.status(400).json({ message: 'Insufficient funds' });
    }
    
    // Get seller
    const seller = await User.findById(listing.seller);
    if (!seller) {
      console.log('Seller not found');
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    // 1. Update buyer's currency
    buyer.currency -= listing.price;
    
    // 2. Add player to buyer's collection
    const existingCardInBuyerCollection = buyer.collection.find(
      card => card.player && card.player.toString() === listing.player.toString()
    );
    
    if (existingCardInBuyerCollection) {
      // Increment quantity if buyer already has this card
      existingCardInBuyerCollection.quantity += 1;
    } else {
      // Add new card to collection
      buyer.collection.push({
        player: listing.player,
        quantity: 1,
        isListed: false
      });
    }
    
    // 3. Update seller's currency
    seller.currency += listing.price;
    
    // 4. Update seller's collection
    const sellerCardIndex = seller.collection.findIndex(
      card => card.player && card.player.toString() === listing.player.toString() && card.isListed
    );
    
    if (sellerCardIndex !== -1) {
      if (seller.collection[sellerCardIndex].quantity > 1) {
        // Decrease quantity if seller has multiple
        seller.collection[sellerCardIndex].quantity -= 1;
        seller.collection[sellerCardIndex].isListed = false;
      } else {
        // Remove card if it's the last one
        seller.collection.splice(sellerCardIndex, 1);
      }
    }
    
    // 5. Mark listing as inactive
    listing.active = false;
    
    // 6. Save all changes
    await Promise.all([
      buyer.save(),
      seller.save(),
      listing.save()
    ]);
    
    console.log('Transaction completed successfully');
    
    res.json({
      message: 'Card purchased successfully',
      newBalance: buyer.currency
    });
  } catch (error) {
    console.error('Error in buy process:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

module.exports = router;
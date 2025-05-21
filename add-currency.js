// addCurrency.js
const mongoose = require('mongoose');
require('dotenv').config();

// Usage validation
if (process.argv.length < 4) {
  console.log('Usage: node addCurrency.js <username> <amount>');
  process.exit(1);
}

// Get username and amount from command line arguments
const username = process.argv[2];
const amount = parseInt(process.argv[3]);

// Validate amount
if (isNaN(amount)) {
  console.log('Error: Amount must be a number');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ladder-warriors', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB connected');
  updateCurrency();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Update user currency
async function updateCurrency() {
  try {
    // Get User model
    const User = require('./server/models/User');
    
    // Find user
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log(`User "${username}" not found`);
      mongoose.disconnect();
      return;
    }
    
    // Get current currency
    const oldCurrency = user.currency || 0;
    
    // Update currency
    user.currency = oldCurrency + amount;
    await user.save();
    
    console.log(`Currency updated successfully for user "${username}"`);
    console.log(`Old balance: ${oldCurrency}`);
    console.log(`New balance: ${user.currency}`);
    console.log(`Added: ${amount}`);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error updating currency:', error);
    mongoose.disconnect();
  }
}
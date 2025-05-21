const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  riotId: {
    type: String,
    required: true,
    unique: true
  },
  leaguePoints: {
    type: Number,
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    required: true
  },
  position: {
    type: String,
    enum: ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
    required: true
  },
  attributes: {
    mechanics: Number,
    gamesense: Number,
    teamfighting: Number,
    laning: Number,
    versatility: Number
  },
  value: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Player', PlayerSchema);
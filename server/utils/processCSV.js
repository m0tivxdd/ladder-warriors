const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

// Function to process the CSV and generate player data
const processPlayerData = () => {
  return new Promise((resolve, reject) => {
    const players = [];
    fs.createReadStream(path.join(__dirname, '../data/clean_riot_ids_lp.csv'))
      .pipe(csvParser())
      .on('data', (data) => {
        // Calculate rarity based on leaguePoints
        let rarity;
        const lp = parseInt(data.leaguePoints);
        
        if (lp >= 1800) {
          rarity = 'legendary';
        } else if (lp >= 1600) {
          rarity = 'epic';
        } else if (lp >= 1400) {
          rarity = 'rare';
        } else if (lp >= 1200) {
          rarity = 'uncommon';
        } else {
          rarity = 'common';
        }
        
        // Generate a random position (for card flavor)
        const positions = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
        const position = positions[Math.floor(Math.random() * positions.length)];
        
        // Generate random attributes based on LP
        const baseStats = Math.floor(lp / 200) * 10;
        
        const player = {
          riotId: data.riotId,
          leaguePoints: lp,
          rarity,
          position,
          attributes: {
            mechanics: baseStats + Math.floor(Math.random() * 20),
            gamesense: baseStats + Math.floor(Math.random() * 20),
            teamfighting: baseStats + Math.floor(Math.random() * 20),
            laning: baseStats + Math.floor(Math.random() * 20),
            versatility: baseStats + Math.floor(Math.random() * 20)
          },
          // Calculate value based on rarity
          value: Math.floor(lp / 10)
        };
        
        players.push(player);
      })
      .on('end', () => {
        // Sort players by LP descending
        players.sort((a, b) => b.leaguePoints - a.leaguePoints);
        
        // Write the processed data to a JSON file
        fs.writeFileSync(
          path.join(__dirname, '../data/players.json'),
          JSON.stringify(players, null, 2)
        );
        
        console.log(`Processed ${players.length} players`);
        resolve(players);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

module.exports = { processPlayerData };
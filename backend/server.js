const express = require('express');
const axios = require('axios');
const app = express();
const port = 5000;

// API key for the baseball stats service
const API_KEY = 'your_api_key';  // Replace this with your real API key

// Endpoint to get player stats by name
app.get('/api/player-stats', async (req, res) => {
  const { firstName, lastName } = req.query;

  try {
    // Step 1: Look up the player's ID by their name
    const playerSearchResponse = await axios.get(`https://api.sportsdata.io/v3/mlb/scores/json/Players?key=${API_KEY}`);
    const players = playerSearchResponse.data;
    const player = players.find(p => p.FirstName.toLowerCase() === firstName.toLowerCase() && p.LastName.toLowerCase() === lastName.toLowerCase());

    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    const playerId = player.PlayerID;

    // Step 2: Fetch player stats using the player ID
    const playerStatsResponse = await axios.get(`https://api.sportsdata.io/v3/mlb/stats/json/PlayerSeasonStatsByPlayerID/2023?playerid=${playerId}&key=${API_KEY}`);
    const playerStats = playerStatsResponse.data;

    res.json(playerStats);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ message: 'Error fetching player stats' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

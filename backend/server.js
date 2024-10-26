const express = require('express');
const { exec } = require('child_process');
const app = express();
const port = 5000;

app.get('/api/player-stats', (req, res) => {
  const { firstName, lastName } = req.query;

  // Use child_process to run the Python script with the player's name as arguments
  exec(`py fetch_player_stats.py ${firstName} ${lastName}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error.message}`);
      return res.status(500).json({ error: 'Error fetching player stats' });
    }
    if (stderr) {
      console.error(`Error: ${stderr}`);
      return res.status(500).json({ error: 'Error fetching player stats' });
    }

    // Send back the Python script's output (which will be in JSON format)
    try {
      const stats = JSON.parse(stdout);
      res.json(stats);
    } catch (parseError) {
      res.status(500).json({ error: 'Error parsing player stats' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

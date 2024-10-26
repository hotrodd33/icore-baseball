import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPlayerStats = async () => {
    setLoading(true);
    setError('');
    setStats(null);
    try {
      const response = await axios.get('http://localhost:5000/api/player-stats', {
        params: { firstName, lastName },
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Player not found or error fetching data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Search for Player Stats</h1>
      <div>
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <button onClick={fetchPlayerStats}>Search</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {stats && (
        <div>
          <h2>{firstName} {lastName} Stats</h2>
          <pre>{JSON.stringify(stats, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;

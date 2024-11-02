import React, { useState } from 'react';
import axios from 'axios';
import './App.css';  // Make sure to import your CSS

function App() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [year, setYear] = useState('');
    const [playerType, setPlayerType] = useState('');
    const [results, setResults] = useState(null);
    const [distinctEvents, setDistinctEvents] = useState([]);  // Initialize as an empty array
    const [diceRoll, setDiceRoll] = useState(null);
    const [simulatedCount, setSimulatedCount] = useState('');
    const [simulatedEvent, setSimulatedEvent] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/get_stats', {
                first_name: firstName,
                last_name: lastName,
                year: year,
                player_type: playerType
            });
            console.log("Response data:", response.data);  // Debugging output
            setResults(response.data);
            setDistinctEvents(response.data.distinct_events || []);  // Use empty array if undefined
            setError('');  // Clear any previous errors
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.response?.data?.error || 'An error occurred');
            setResults(null);  // Clear previous results
            setDistinctEvents([]);  // Clear distinct events if there's an error
        }
    };

    const handleRollDice = async () => {
        try {
            const response = await axios.post('http://localhost:5000/api/roll_dice');
            const roll = response.data.roll;
            setDiceRoll(roll);

            const countResults = results?.count_frequencies || [];  // Use empty array if undefined
            const matchingCount = countResults.find(
                (result) => roll >= result.range_start && roll <= result.range_end
            );

            if (matchingCount) {
                setSimulatedCount(`${matchingCount.balls}-${matchingCount.strikes}`);

                const eventResults = [...(results.event_ranges?.lefty || []), ...(results.event_ranges?.righty || [])];
                const matchingEvent = eventResults.find(
                    (event) => event.balls === matchingCount.balls && event.strikes === matchingCount.strikes &&
                        roll >= event.range_start && roll <= event.range_end
                );

                setSimulatedEvent(matchingEvent ? matchingEvent.event : 'No event matched.');
            } else {
                setSimulatedCount('No count matched.');
                setSimulatedEvent('No event matched.');
            }
        } catch (err) {
            console.error('Error rolling dice:', err);
        }
    };

    const renderCountTable = (data) => {
        if (!data || data.length === 0) {
            return <p>No count data available.</p>;
        }

        return (
            <table>
                <thead>
                <tr>
                    <th>Balls</th>
                    <th>Strikes</th>
                    <th>Count</th>
                    <th>Percentage</th>
                    <th>Range Start</th>
                    <th>Range End</th>
                </tr>
                </thead>
                <tbody>
                {data.map((result, index) => (
                    <tr key={index}>
                        <td>{result.balls}</td>
                        <td>{result.strikes}</td>
                        <td>{result.count}</td>
                        <td>{result.percentage.toFixed(2)}%</td>
                        <td>{result.range_start}</td>
                        <td>{result.range_end}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        );
    };

    const renderEventTable = (data, title) => {
        if (!data || data.length === 0) {
            return <p>No event data available.</p>;
        }

        return (
            <div>
                <h3>{title}</h3>
                <table>
                    <thead>
                    <tr>
                        <th>Balls</th>
                        <th>Strikes</th>
                        <th>Event</th>
                        <th>Percentage</th>
                        <th>Range Start</th>
                        <th>Range End</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.map((result, index) => (
                        <tr key={index}>
                            <td>{result.balls}</td>
                            <td>{result.strikes}</td>
                            <td>{result.event}</td>
                            <td>{result.percentage.toFixed(2)}%</td>
                            <td>{result.range_start}</td>
                            <td>{result.range_end}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="App">
            <h1>Player Stats by Count (vs Lefty/Righty)</h1>
            <form onSubmit={handleSubmit}>
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
                <input
                    type="text"
                    placeholder="Year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                />
                <select value={playerType} onChange={(e) => setPlayerType(e.target.value)}>
                    <option value="">Select Player Type</option>
                    <option value="batter">Batter</option>
                    <option value="pitcher">Pitcher</option>
                </select>
                <button type="submit">Get Stats</button>
            </form>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {distinctEvents.length > 0 && (
                <div>
                    <h2>Distinct Events</h2>
                    <ul>
                        {distinctEvents.map((event, index) => (
                            <li key={index}>{event}</li>
                        ))}
                    </ul>
                </div>
            )}

            {results && (
                <div>
                    <h2>Count Frequencies</h2>
                    {renderCountTable(results.count_frequencies)}

                    <h2>Matchup Results vs Left-Handed</h2>
                    {renderEventTable(results.event_ranges?.lefty || [], "Left-Handed Events")}

                    <h2>Matchup Results vs Right-Handed</h2>
                    {renderEventTable(results.event_ranges?.righty || [], "Right-Handed Events")}

                    <button onClick={handleRollDice}>Roll Dice</button>
                    {diceRoll && <p>Dice Roll: {diceRoll}</p>}
                    {simulatedCount && <p>Simulated Count: {simulatedCount}</p>}
                    {simulatedEvent && <p>Simulated Event: {simulatedEvent}</p>}
                </div>
            )}
        </div>
    );
}

export default App;

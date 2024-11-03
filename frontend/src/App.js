import React, { useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import SimulationPage from './SimulationPage';
import './App.css';

const ALL_EVENTS = [
    "field_out_fly_ball", "field_out_popup", "field_out_line_drive", "field_out_ground_ball",
    "single", "double", "triple", "home_run", "walk", "hit_by_pitch",
    "strikeout"
];

const COUNT_ORDER = [
    "(0-2)", "(1-2)", "(0-1)", "(0-0)", "(1-1)", "(2-2)",
    "(3-2)", "(2-1)", "(1-0)", "(2-0)", "(3-1)", "(3-0)"
];

const transformData = (data) => {
    const transformed = {};
    data.forEach((item) => {
        const count = `(${item.balls}-${item.strikes})`;
        const event = item.event;
        if (!transformed[count]) {
            transformed[count] = {};
        }
        transformed[count][event] = {
            range_start: item.range_start ?? null,
            range_end: item.range_end ?? null
        };
    });
    return transformed;
};

const EventRangeTable = ({ data, title, highlightedCount, highlightedEvent }) => {
    const transformedData = transformData(data);
    const counts = COUNT_ORDER.filter(count => transformedData[count]);
    return (
        <div>
            <h3>{title}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Event</th>
                        {counts.map((count) => (
                            <th key={count}>{count}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {ALL_EVENTS.map((event) => (
                        <tr key={event} className={highlightedEvent === event ? "highlighted" : ""}>
                            <td>{event}</td>
                            {counts.map((count) => (
                                <td key={`${event}-${count}`} className={highlightedCount === count ? "highlighted" : ""}>
                                    {transformedData[count][event] &&
                                     transformedData[count][event].range_start !== null &&
                                     transformedData[count][event].range_end !== null
                                        ? `${transformedData[count][event].range_start}-${transformedData[count][event].range_end}`
                                        : ""}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const CountFrequencyTable = ({ data, highlightedCount }) => {
    if (!data || data.length === 0) {
        return <p>No count data available.</p>;
    }
    return (
        <div>
            <h3>Count Frequencies</h3>
            <table>
                <thead>
                    <tr>
                        <th>Balls</th>
                        <th>Strikes</th>
                        <th>Count</th>
                        <th>Decimal Value</th>
                        <th>Range Start</th>
                        <th>Range End</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((result, index) => {
                        const count = `(${result.balls}-${result.strikes})`;
                        return (
                            <tr key={index} className={highlightedCount === count ? "highlighted" : ""}>
                                <td>{result.balls}</td>
                                <td>{result.strikes}</td>
                                <td>{result.count}</td>
                                <td>{(result.percentage / 100).toFixed(3)}</td>
                                <td>{result.range_start}</td>
                                <td>{result.range_end}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

function HomePage() {
    const [firstRandom, setFirstRandom] = useState(null);
    const [secondRandom, setSecondRandom] = useState(null);
    const [highlightedCount, setHighlightedCount] = useState(null);
    const [highlightedEvent, setHighlightedEvent] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [year, setYear] = useState('');
    const [playerType, setPlayerType] = useState('');
    const [results, setResults] = useState(null);
    const [distinctEvents, setDistinctEvents] = useState([]);
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
            setResults(response.data);
            setDistinctEvents(response.data.distinct_events || []);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
            setResults(null);
            setDistinctEvents([]);
        }
    };

    const generateRandomNumbers = () => {
        const random1 = Math.floor(Math.random() * 1000);
        const random2 = Math.floor(Math.random() * 1000);
        setFirstRandom(random1);
        setSecondRandom(random2);

        if (results) {
            const matchedCount = results.count_frequencies.find(count =>
                random1 >= count.range_start && random1 <= count.range_end
            );

            if (matchedCount) {
                const countLabel = `(${matchedCount.balls}-${matchedCount.strikes})`;
                setHighlightedCount(countLabel);

                const matchingEvent = [...results.event_ranges?.lefty || [], ...results.event_ranges?.righty || []].find(event =>
                    event.balls === matchedCount.balls &&
                    event.strikes === matchedCount.strikes &&
                    random2 >= event.range_start && random2 <= event.range_end
                );
                
                setHighlightedEvent(matchingEvent ? matchingEvent.event : null);
            }
        }
    };

    return (
        <div>
            <h1>Player Stats by Count (vs Lefty/Righty)</h1>
            <button onClick={generateRandomNumbers}>Generate Random Numbers</button>
            <div>
                <p>First Random Number: {firstRandom}</p>
                <p>Second Random Number: {secondRandom}</p>
            </div>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                <input type="text" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
                <select value={playerType} onChange={(e) => setPlayerType(e.target.value)}>
                    <option value="">Select Player Type</option>
                    <option value="batter">Batter</option>
                    <option value="pitcher">Pitcher</option>
                </select>
                <button type="submit">Get Stats</button>
            </form>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {results && (
                <div>
                    <CountFrequencyTable data={results.count_frequencies} highlightedCount={highlightedCount} />
                    <EventRangeTable data={results.event_ranges?.lefty || []} title="Matchup Results vs Left-Handed" highlightedCount={highlightedCount} highlightedEvent={highlightedEvent} />
                    <EventRangeTable data={results.event_ranges?.righty || []} title="Matchup Results vs Right-Handed" highlightedCount={highlightedCount} highlightedEvent={highlightedEvent} />
                </div>
            )}
        </div>
    );
}

function App() {
    return (
        <Router>
            <div className="App">
                <nav>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/simulation">Simulation</Link></li>
                    </ul>
                </nav>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/simulation" element={<SimulationPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;

import React, { useState } from 'react';
import axios from 'axios';
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

// Simulate 1,000 rolls and tally results by lefty and righty matchups
const simulateResults = (countFrequencies, eventRanges) => {
    const results = { lefty: {}, righty: {} };

    for (let i = 0; i < 664; i++) {
        const random1 = Math.floor(Math.random() * 1000);
        const random2 = Math.floor(Math.random() * 1000);

        const matchedCount = countFrequencies.find(count =>
            random1 >= count.range_start && random1 <= count.range_end
        );

        if (matchedCount) {
            const countLabel = `(${matchedCount.balls}-${matchedCount.strikes})`;

            const isLeftyEvent = eventRanges.lefty.some(event =>
                event.balls === matchedCount.balls && event.strikes === matchedCount.strikes
            );

            const target = isLeftyEvent ? results.lefty : results.righty;
            if (!target[countLabel]) {
                target[countLabel] = {};
            }

            const matchingEvent = (isLeftyEvent ? eventRanges.lefty : eventRanges.righty).find(event =>
                event.balls === matchedCount.balls &&
                event.strikes === matchedCount.strikes &&
                random2 >= event.range_start && random2 <= event.range_end
            );

            if (matchingEvent) {
                if (!target[countLabel][matchingEvent.event]) {
                    target[countLabel][matchingEvent.event] = 0;
                }
                target[countLabel][matchingEvent.event] += 1;
            }
        }
    }

    return results;
};

const calculateStatistics = (simulationData) => {
    let hits = 0;
    let atBats = 0;
    let walks = 0;
    let hitByPitch = 0;
    let totalBases = 0;

    Object.keys(simulationData).forEach(count => {
        const events = simulationData[count];
        hits += (events.single || 0) + (events.double || 0) + (events.triple || 0) + (events.home_run || 0);
        atBats += (events.single || 0) + (events.double || 0) + (events.triple || 0) + (events.home_run || 0) +
                  (events.strikeout || 0) + (events.field_out_fly_ball || 0) + (events.field_out_popup || 0) +
                  (events.field_out_line_drive || 0) + (events.field_out_ground_ball || 0);
        walks += (events.walk || 0);
        hitByPitch += (events.hit_by_pitch || 0);
        totalBases += (events.single || 0) * 1 + (events.double || 0) * 2 +
                      (events.triple || 0) * 3 + (events.home_run || 0) * 4;
    });

    const avg = atBats ? (hits / atBats).toFixed(3) : "0.000";
    const obp = (atBats + walks + hitByPitch) ? ((hits + walks + hitByPitch) / (atBats + walks + hitByPitch)).toFixed(3) : "0.000";
    const slg = atBats ? (totalBases / atBats).toFixed(3) : "0.000";
    const ops = (parseFloat(obp) + parseFloat(slg)).toFixed(3);

    return { avg, obp, slg, ops };
};

const SimulationResultTable = ({ data, title }) => {
    const totalEventCounts = ALL_EVENTS.reduce((totals, event) => {
        totals[event] = 0;
        COUNT_ORDER.forEach(count => {
            if (data[count] && data[count][event]) {
                totals[event] += data[count][event];
            }
        });
        return totals;
    }, {});

    const stats = calculateStatistics(data);

    return (
        <div>
            <h3>{title}</h3>
            <p>AVG: {stats.avg} | OBP: {stats.obp} | SLG: {stats.slg} | OPS: {stats.ops}</p>
            <table>
                <thead>
                    <tr>
                        <th>Event</th>
                        <th>Total</th>
                        {COUNT_ORDER.map((count) => (
                            <th key={count}>{count}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {ALL_EVENTS.map((event) => (
                        <tr key={event}>
                            <td>{event}</td>
                            <td>{totalEventCounts[event]}</td>
                            {COUNT_ORDER.map((count) => (
                                <td key={`${event}-${count}`}>
                                    {data[count] && data[count][event] ? data[count][event] : ""}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const SimulationPage = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [year, setYear] = useState('');
    const [playerType, setPlayerType] = useState('');
    const [results, setResults] = useState(null);
    const [simulationSummary, setSimulationSummary] = useState(null);
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
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
            setResults(null);
        }
    };

    const runSimulation = () => {
        if (!results) return;

        const summary = simulateResults(results.count_frequencies, results.event_ranges);
        setSimulationSummary(summary);
    };

    return (
        <div className="App">
            <h1>Simulation Page</h1>
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

            {results && (
                <div>
                    <button onClick={runSimulation}>Run Simulation (1,000 times)</button>
                    {simulationSummary && (
                        <div>
                            <h2>Simulation Results</h2>
                            <SimulationResultTable data={simulationSummary.lefty} title="Left-Handed Matchup Results" />
                            <SimulationResultTable data={simulationSummary.righty} title="Right-Handed Matchup Results" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SimulationPage;

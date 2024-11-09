import React, { useState } from "react";
import axios from "axios";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import SimulationPage from "./SimulationPage";
import "./App.css";
import RollResults from "./components/RollResults";
import CardPreferenceTable from "./components/CardPreferenceTable";
import cardPreferences from "./card_preference.json";
import EventRangeTable from './components/EventRangeTable';

const ALL_EVENTS = ["field_error", "sac_fly", "field_out_fly_ball", "field_out_popup", "field_out_line_drive", "field_out_ground_ball", "grounded_into_double_play", "double_play", "force_out", "fielders_choice_out", "fielders_choice", "catcher_interf", "sac_bunt", "single", "double", "triple", "home_run", "intent_walk", "walk", "hit_by_pitch", "strikeout", "strikeout_double_play", "truncated_pa"];

const COUNT_ORDER = ["(0-2)", "(1-2)", "(2-2)", "(3-2)", "(0-1)", "(1-1)", "(2-1)", "(3-1)", "(0-0)", "(1-0)", "(2-0)", "(3-0)"];
const EVENT_ALIASES = {
    field_error: "E",
    sac_fly: "SF",
    field_out_fly_ball: "FO",
    field_out_popup: "PO",
    field_out_line_drive: "LO",
    field_out_ground_ball: "GO",
    grounded_into_double_play: "GDP",
    double_play: "DP",
    force_out: "FO",
    fielders_choice_out: "FC",
    fielders_choice: "FC",
    catcher_interf: "CI",
    sac_bunt: "SAC",
    single: "1B",
    double: "2B",
    triple: "3B",
    home_run: "HR",
    intent_walk: "IBB",
    walk: "BB",
    hit_by_pitch: "HBP",
    strikeout: "K",
    strikeout_double_play: "KDP",
    truncated_pa: "TP",
};

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
            range_end: item.range_end ?? null,
        };
    });
    return transformed;
};

const CountFrequenciesTable = ({ data, highlightedCount }) => (
    <table>
        <thead>
            <tr>
                <th>Count</th>
                <th>Range Start</th>
            </tr>
        </thead>
        <tbody>
            {data.map((item, index) => (
                <tr key={index} className={highlightedCount === item.count_label ? "highlighted-row" : ""}>
                    <td>{item.count_label}</td>
                    <td>
                        {item.range_start} - {item.range_end}
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

function HomePage() {
    const [firstRandom, setFirstRandom] = useState(null);
    const [secondRandom, setSecondRandom] = useState(null);
    const [thirdRandom, setThirdRandom] = useState(null);
    const [highlightedCount, setHighlightedCount] = useState(null);
    const [highlightedEventsLefty, setHighlightedEventsLefty] = useState([]);
    const [highlightedEventsRighty, setHighlightedEventsRighty] = useState([]);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [year, setYear] = useState("");
    const [playerType, setPlayerType] = useState("");
    const [results, setResults] = useState(null);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:5000/api/get_stats", {
                first_name: firstName,
                last_name: lastName,
                year: year,
                player_type: playerType,
            });
            setResults(response.data);
            setError("");
        } catch (err) {
            setError(err.response?.data?.error || "An error occurred");
            setResults(null);
        }
    };

    const generateRandomNumbers = () => {
        const random1 = Math.floor(Math.random() * 1000);
        const random2 = Math.floor(Math.random() * 100);
        const random3 = Math.floor(Math.random() * 1000);
        setFirstRandom(random1);
        setSecondRandom(random2);
        setThirdRandom(random3);

        if (results && results.count_frequencies) {
            const matchedCount = results.count_frequencies.find((count) => random1 >= count.range_start && random1 <= count.range_end);
            if (matchedCount) {
                const countLabel = matchedCount.count_label;
                setHighlightedCount(countLabel);

                // Find matching events for lefty and righty independently
                const leftyEvents = results.event_ranges?.lefty || [];
                const rightyEvents = results.event_ranges?.righty || [];

                const matchingLeftyEvents = leftyEvents.filter((event) => event.count_label === countLabel && random3 >= event.range_start && random3 <= event.range_end).map((event) => event.event);

                const matchingRightyEvents = rightyEvents.filter((event) => event.count_label === countLabel && random3 >= event.range_start && random3 <= event.range_end).map((event) => event.event);

                setHighlightedEventsLefty(matchingLeftyEvents);
                setHighlightedEventsRighty(matchingRightyEvents);
            }
        }
    };

    return (
        <div className='page-container'>
            <div className='header-container'>
                <div className='player-lookup-container'>
                    <h2>Player Card Lookup</h2>
                    <form onSubmit={handleSubmit}>
                        <input type='text' placeholder='First Name' value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        <input type='text' placeholder='Last Name' value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        <input type='text' placeholder='Year' value={year} onChange={(e) => setYear(e.target.value)} />
                        <label>
                            <input type='radio' value='batter' checked={playerType === "batter"} onChange={(e) => setPlayerType(e.target.value)} />
                            Batter
                        </label>
                        <label>
                            <input type='radio' value='pitcher' checked={playerType === "pitcher"} onChange={(e) => setPlayerType(e.target.value)} />
                            Pitcher
                        </label>
                        <button type='submit'>Get Stats</button>
                    </form>
                </div>

                <div className='dice-roll-container'>
                    <button onClick={generateRandomNumbers}>Roll Dice</button>
                    <div>
                        <h2>Pitch Count Roll</h2>
                        <div className='roll-result'>
                            <RollResults roll={firstRandom} />
                        </div>
                    </div>
                    <div>
                        <h2>Player Card Roll</h2>
                        <div className='roll-result'>
                            <RollResults roll={secondRandom} />
                        </div>
                    </div>
                    <div>
                        <h2>Play Result Roll</h2>
                        <div className='roll-result'>
                            <RollResults roll={thirdRandom} />
                        </div>
                    </div>
                </div>
            </div>
            {error && <p style={{ color: "red" }}>{error}</p>}

            {results && (
                <div className='results-container'>
                    <div className='event-range-container'>
                        <div className='event-range-tables'>
                            <div className='count-result'>
                                <CountFrequenciesTable data={results.count_frequencies} highlightedRowRange={firstRandom} />
                                <CardPreferenceTable cardPreferences={cardPreferences} />
                            </div>
                            <EventRangeTable data={results.event_ranges?.lefty || []} title={`${firstName} ${lastName} vs LH`} highlightedCount={highlightedCount} highlightedEvents={highlightedEventsLefty} highlightedRoll={thirdRandom} />
                            <EventRangeTable data={results.event_ranges?.righty || []} title={`${firstName} ${lastName} vs RH`} highlightedCount={highlightedCount} highlightedEvents={highlightedEventsRighty} highlightedRoll={thirdRandom} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function App() {
    return (
        <Router>
            <div>
                <nav className='header-navigation main-navigation'>
                    <ul>
                        <li>
                            <Link to='/'>Home</Link>
                        </li>
                        <li>
                            <Link to='/simulation'>Simulation</Link>
                        </li>
                    </ul>
                </nav>
                <Routes>
                    <Route path='/' element={<HomePage />} />
                    <Route path='/simulation' element={<SimulationPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import SimulationPage from "./SimulationPage";
import "./App.css";
import cardPreferences from "./card_preference.json";
import testData from "./Test_Data.json";
import { Loader2 } from "lucide-react";
import EventRangeTable from "./components/EventRangeTable";
import RollResults from "./components/RollResults";
import CardPreferenceTable from "./components/CardPreferenceTable";
import CountFrequenciesTable from "./components/CountFrequenciesTable";
import RollResultsModal from "./components/RollResultsModal";

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

function HomePage() {
    const [firstRandom, setFirstRandom] = useState(null);
    const [secondRandom, setSecondRandom] = useState(null);
    const [thirdRandom, setThirdRandom] = useState(null);
    const [highlightedCount, setHighlightedCount] = useState(null);
    const [highlightedEventsLefty, setHighlightedEventsLefty] = useState([]);
    const [highlightedEventsRighty, setHighlightedEventsRighty] = useState([]);
    const [isRolling, setIsRolling] = useState(false);

    // Separate state for batter and pitcher
    const [batterFirstName, setBatterFirstName] = useState("");
    const [batterLastName, setBatterLastName] = useState("");
    const [batterYear, setBatterYear] = useState("");
    const [pitcherFirstName, setPitcherFirstName] = useState("");
    const [pitcherLastName, setPitcherLastName] = useState("");
    const [pitcherYear, setPitcherYear] = useState("");

    // Separate results state
    const [batterResults, setBatterResults] = useState(null);
    const [pitcherResults, setPitcherResults] = useState(null);
    const [error, setError] = useState("");

    const [currentBatterIndex, setCurrentBatterIndex] = useState(0);
    const [currentPitcherIndex, setCurrentPitcherIndex] = useState(0);
    const [activeCard, setActiveCard] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rollResultsData, setRollResultsData] = useState(null);

    useEffect(() => {
        if (testData.batters.length > 0) {
            const batter = testData.batters[currentBatterIndex];
            setBatterFirstName(batter.firstName);
            setBatterLastName(batter.lastName);
            setBatterYear(batter.year);
        }

        if (testData.pitchers.length > 0) {
            const pitcher = testData.pitchers[currentPitcherIndex];
            setPitcherFirstName(pitcher.firstName);
            setPitcherLastName(pitcher.lastName);
            setPitcherYear(pitcher.year);
        }
    }, [currentBatterIndex, currentPitcherIndex]);

    // Navigation functions
    const nextBatter = () => {
        if (currentBatterIndex < testData.batters.length - 1) {
            setCurrentBatterIndex(currentBatterIndex + 1);
        }
    };

    const prevBatter = () => {
        if (currentBatterIndex > 0) {
            setCurrentBatterIndex(currentBatterIndex - 1);
        }
    };

    const nextPitcher = () => {
        if (currentPitcherIndex < testData.pitchers.length - 1) {
            setCurrentPitcherIndex(currentPitcherIndex + 1);
        }
    };

    const prevPitcher = () => {
        if (currentPitcherIndex > 0) {
            setCurrentPitcherIndex(currentPitcherIndex - 1);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await axios.post("http://localhost:5000/api/get_both_stats", {
                batter: {
                    first_name: batterFirstName,
                    last_name: batterLastName,
                    year: batterYear,
                },
                pitcher: {
                    first_name: pitcherFirstName,
                    last_name: pitcherLastName,
                    year: pitcherYear,
                },
            });

            if (response.data.batter) {
                if (response.data.batter.error) {
                    setError(`Batter Error: ${response.data.batter.error}`);
                } else {
                    setBatterResults(response.data.batter);
                }
            }

            if (response.data.pitcher) {
                if (response.data.pitcher.error) {
                    setError((prev) => (prev ? `${prev}, Pitcher Error: ${response.data.pitcher.error}` : `Pitcher Error: ${response.data.pitcher.error}`));
                } else {
                    setPitcherResults(response.data.pitcher);
                }
            }
        } catch (err) {
            setError(err.response?.data?.error || "An error occurred");
            setBatterResults(null);
            setPitcherResults(null);
        } finally {
            setIsLoading(false);
        }
    };

    const generateRandomNumbers = () => {
        setIsRolling(true);

        const finalRandom1 = Math.floor(Math.random() * 1000);
        const finalRandom2 = Math.floor(Math.random() * 100);
        const finalRandom3 = Math.floor(Math.random() * 1000);

        let counter = 0;
        const totalSteps = 20;

        const rollInterval = setInterval(() => {
            counter++;

            const tempRandom1 = Math.floor(Math.random() * 1000);
            const tempRandom2 = Math.floor(Math.random() * 100);
            const tempRandom3 = Math.floor(Math.random() * 1000);

            setFirstRandom(tempRandom1);
            setSecondRandom(tempRandom2);
            setThirdRandom(tempRandom3);

            if (counter >= totalSteps) {
                clearInterval(rollInterval);
                setIsRolling(false);

                setFirstRandom(finalRandom1);
                setSecondRandom(finalRandom2);
                setThirdRandom(finalRandom3);

                // Process results and show modal
                if (pitcherResults?.count_frequencies) {
                    const matchedCount = pitcherResults.count_frequencies.find((count) => finalRandom1 >= count.range_start && finalRandom1 <= count.range_end);

                    if (matchedCount) {
                        const countLabel = matchedCount.count_label;
                        setHighlightedCount(countLabel);

                        // Determine active card
                        const preference = cardPreferences[countLabel];
                        const activeCard = finalRandom2 < preference.pitcher ? "pitcher" : "batter";

                        // Find matching events
                        let leftResult = null;
                        let rightResult = null;

                        const results = activeCard === "pitcher" ? pitcherResults : batterResults;
                        if (results?.event_ranges) {
                            const leftyEvents = results.event_ranges?.lefty || [];
                            const rightyEvents = results.event_ranges?.righty || [];

                            const matchingLeftyEvents = leftyEvents.filter((event) => event.count_label === countLabel && finalRandom3 >= event.range_start && finalRandom3 <= event.range_end).map((event) => event.event);

                            const matchingRightyEvents = rightyEvents.filter((event) => event.count_label === countLabel && finalRandom3 >= event.range_start && finalRandom3 <= event.range_end).map((event) => event.event);

                            setHighlightedEventsLefty(matchingLeftyEvents);
                            setHighlightedEventsRighty(matchingRightyEvents);

                            leftResult = matchingLeftyEvents[0];
                            rightResult = matchingRightyEvents[0];
                        }

                        // Set modal data
                        setRollResultsData({
                            count: countLabel,
                            activeCard,
                            batterName: `${batterFirstName} ${batterLastName}`,
                            pitcherName: `${pitcherFirstName} ${pitcherLastName}`,
                            leftHandedEvent: leftResult,
                            rightHandedEvent: rightResult,
                            rollResults: {
                                first: finalRandom1,
                                second: finalRandom2,
                                third: finalRandom3,
                            },
                        });

                        // Show modal after a short delay
                        console.log('Opening modal with data:', rollResultsData);
                        setTimeout(() => setIsModalOpen(true), 500);
                    }
                }
            }
        }, 100);
    };

    const determineActiveCard = (rollValue, countLabel) => {
        if (!cardPreferences || !countLabel) return null;

        const preference = cardPreferences[countLabel];
        if (!preference) return null;

        return rollValue < preference.pitcher ? "pitcher" : "batter";
    };

    return (
        <div className='page-container'>
            {isLoading && (
                <div className='loading-overlay'>
                    <div className='spinner-container'>
                        <Loader2 className='spinner' />
                        <div className='loading-text'>Gathering Player Data...</div>
                    </div>
                </div>
            )}
            <div className='page-container'>
                <div className='header-container'>
                    <div className='player-lookup-container'>
                        <form onSubmit={handleSubmit} className='dual-form'>
                            <div className='form-section batter-form'>
                                <h2>Batter Lookup</h2>
                                <div className='pagination-controls'>
                                    <button type='button' onClick={prevBatter} disabled={currentBatterIndex === 0} className='pagination-button'>
                                        ←
                                    </button>
                                    <span className='pagination-info'>
                                        {currentBatterIndex + 1} / {testData.batters.length}
                                    </span>
                                    <button type='button' onClick={nextBatter} disabled={currentBatterIndex === testData.batters.length - 1} className='pagination-button'>
                                        →
                                    </button>
                                </div>
                                <input type='text' placeholder='First Name' value={batterFirstName} onChange={(e) => setBatterFirstName(e.target.value)} />
                                <input type='text' placeholder='Last Name' value={batterLastName} onChange={(e) => setBatterLastName(e.target.value)} />
                                <input type='text' placeholder='Year' value={batterYear} onChange={(e) => setBatterYear(e.target.value)} />
                            </div>

                            <div className='form-section pitcher-form'>
                                <h2>Pitcher Lookup</h2>
                                <div className='pagination-controls'>
                                    <button type='button' onClick={prevPitcher} disabled={currentPitcherIndex === 0} className='pagination-button'>
                                        ←
                                    </button>
                                    <span className='pagination-info'>
                                        {currentPitcherIndex + 1} / {testData.pitchers.length}
                                    </span>
                                    <button type='button' onClick={nextPitcher} disabled={currentPitcherIndex === testData.pitchers.length - 1} className='pagination-button'>
                                        →
                                    </button>
                                </div>
                                <input type='text' placeholder='First Name' value={pitcherFirstName} onChange={(e) => setPitcherFirstName(e.target.value)} />
                                <input type='text' placeholder='Last Name' value={pitcherLastName} onChange={(e) => setPitcherLastName(e.target.value)} />
                                <input type='text' placeholder='Year' value={pitcherYear} onChange={(e) => setPitcherYear(e.target.value)} />
                            </div>

                            <button type='submit'>Get Stats</button>
                        </form>
                    </div>

                    <div className='dice-roll-container'>
                        <button onClick={generateRandomNumbers} disabled={isRolling} className={isRolling ? "rolling" : ""}>
                            {isRolling ? "Rolling..." : "Roll Dice"}
                        </button>
                        <div>
                            <h2>Pitch Count Roll</h2>
                            <div className='roll-result'>
                                <RollResults roll={firstRandom} isRolling={isRolling} />
                            </div>
                        </div>
                        <div>
                            <h2>Player Card Roll</h2>
                            <div className='roll-result'>
                                <RollResults roll={secondRandom} isRolling={isRolling} />
                            </div>
                        </div>
                        <div>
                            <h2>Play Result Roll</h2>
                            <div className='roll-result'>
                                <RollResults roll={thirdRandom} isRolling={isRolling} />
                            </div>
                        </div>
                    </div>
                </div>
                {error && <p style={{ color: "red" }}>{error}</p>}

                {/* Inside your render/return in HomePage */}
                <div className='results-container'>
                    {(batterResults || pitcherResults) && (
                        <div className='event-range-container'>
                            <div className='event-range-tables'>
                                <div className='count-result'>
                                    <CountFrequenciesTable data={pitcherResults?.count_frequencies || []} highlightedCount={highlightedCount} randomRoll={firstRandom} />
                                    <CardPreferenceTable cardPreferences={cardPreferences} randomRoll={secondRandom} highlightedCount={highlightedCount} />
                                </div>

                                <div className={`result-tables-container ${activeCard === "pitcher" ? "pitcher-active" : "batter-active"}`}>
                                    {/* Pitcher Results */}
                                    <div className={`player-results pitcher-results ${activeCard === "pitcher" ? "active-card" : "inactive-card"}`}>
                                        <h2>
                                            Pitcher: {pitcherFirstName} {pitcherLastName}
                                        </h2>
                                        <EventRangeTable data={pitcherResults?.event_ranges?.righty || []} title={`vs RH Batters`} highlightedCount={highlightedCount} highlightedEvents={highlightedEventsRighty} highlightedRoll={thirdRandom} />
                                        <EventRangeTable data={pitcherResults?.event_ranges?.lefty || []} title={`vs LH Batters`} highlightedCount={highlightedCount} highlightedEvents={highlightedEventsLefty} highlightedRoll={thirdRandom} />
                                    </div>

                                    {/* Batter Results */}
                                    <div className={`player-results batter-results ${activeCard === "batter" ? "active-card" : "inactive-card"}`}>
                                        <h2>
                                            Batter: {batterFirstName} {batterLastName}
                                        </h2>
                                        <EventRangeTable data={batterResults?.event_ranges?.righty || []} title={`vs RH Pitchers`} highlightedCount={highlightedCount} highlightedEvents={highlightedEventsRighty} highlightedRoll={thirdRandom} />
                                        <EventRangeTable data={batterResults?.event_ranges?.lefty || []} title={`vs LH Pitchers`} highlightedCount={highlightedCount} highlightedEvents={highlightedEventsLefty} highlightedRoll={thirdRandom} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <RollResultsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} {...rollResultsData} />
            </div>
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

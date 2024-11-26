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
import RollDice from "./components/RollDice";

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
        setBatterResults(null);
        setPitcherResults(null);

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

            const { batter, pitcher } = response.data;

            // Process Batter Response
            if (batter) {
                if (batter.error) {
                    setError((prev) => (prev ? `${prev}\nBatter Error: ${batter.error}` : `Batter Error: ${batter.error}`));
                } else {
                    setBatterResults(batter);
                }
            }

            // Process Pitcher Response
            if (pitcher) {
                if (pitcher.error) {
                    setError((prev) => (prev ? `${prev}\nPitcher Error: ${pitcher.error}` : `Pitcher Error: ${pitcher.error}`));
                } else {
                    setPitcherResults(pitcher);
                }
            }
        } catch (err) {
            setError(err.response?.data?.error || "An error occurred while fetching data.");
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
                        console.log("Opening modal with data:", rollResultsData);
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
                            <div className='count-result-container'>
                                <div className='card-preference'>
                                    <CardPreferenceTable cardPreferences={cardPreferences} randomRoll={secondRandom} highlightedCount={highlightedCount} />
                                </div>
                            </div>

                            <div className={`result-tables-container ${activeCard === "pitcher" ? "pitcher-active" : "batter-active"}`}>
                                {/* Pitcher Results */}
                                <div className={`player-results pitcher-results ${activeCard === "pitcher" ? "active-card" : "inactive-card"}`}>
                                    <h2>
                                        {pitcherFirstName} {pitcherLastName}
                                    </h2>
                                    <CountFrequenciesTable data={pitcherResults?.count_frequencies || []} highlightedCount={highlightedCount} randomRoll={firstRandom} />
                                    <EventRangeTable data={pitcherResults?.event_ranges || []} title={`Pitching Card`} highlightedCount={highlightedCount} highlightedEvents={highlightedEventsRighty} highlightedRoll={thirdRandom} />
                                </div>

                                {/* Batter Results */}
                                <div className={`player-results batter-results ${activeCard === "batter" ? "active-card" : "inactive-card"}`}>
                                    <h2>
                                        {batterFirstName} {batterLastName}
                                    </h2>
                                    <EventRangeTable data={batterResults?.event_ranges || []} title={`Batting Card`} highlightedCount={highlightedCount} highlightedEvents={highlightedEventsRighty} highlightedRoll={thirdRandom} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <RollResultsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} {...rollResultsData} />
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

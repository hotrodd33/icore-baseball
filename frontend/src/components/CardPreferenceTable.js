import React from "react";

const CardPreferenceTable = ({ cardPreferences, randomRoll, highlightedCount }) => {
    return (
        <table>
            <thead>
                <tr>
                    <th>Count</th>
                    <th>Pitcher</th>
                    <th>Batter</th>
                </tr>
            </thead>
            <tbody>
                {Object.keys(cardPreferences).map((count) => {
                    const pitcherRange = cardPreferences[count].pitcher;
                    const isCountMatched = count === highlightedCount;
                    const isPitcherHighlighted = isCountMatched && randomRoll <= pitcherRange - 1;
                    const isBatterHighlighted = isCountMatched && randomRoll >= pitcherRange;

                    return (
                        <tr key={count} className={isCountMatched ? "highlighted-event" : ""}>
                            <td>{count}</td>
                            <td className={isPitcherHighlighted ? "highlighted-cell" : ""}>00 - {pitcherRange - 1}</td>
                            <td className={isBatterHighlighted ? "highlighted-cell" : ""}>{pitcherRange} - 99</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default CardPreferenceTable;

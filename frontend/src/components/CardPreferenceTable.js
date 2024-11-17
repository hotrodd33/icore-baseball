import React from "react";

const CardPreferenceTable = ({ cardPreferences, randomRoll, highlightedCount }) => {
    const counts = Object.keys(cardPreferences);

    return (
        <table>
            <thead>
                <tr>
                    <th>Player Card</th>
                    {counts.map((count) => (
                        <th key={count} className={count === highlightedCount ? "highlighted-event" : ""}>
                            {count}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Pitcher</td>
                    {counts.map((count) => {
                        const pitcherRange = cardPreferences[count].pitcher;
                        const isCountMatched = count === highlightedCount;
                        const isPitcherHighlighted = isCountMatched && randomRoll <= pitcherRange - 1;

                        return (
                            <td
                                key={`${count}-pitcher`}
                                className={isPitcherHighlighted ? "highlighted-cell" : ""}
                            >
                                0 - {pitcherRange - 1}
                            </td>
                        );
                    })}
                </tr>
                <tr>
                    <td>Batter</td>
                    {counts.map((count) => {
                        const pitcherRange = cardPreferences[count].pitcher;
                        const isCountMatched = count === highlightedCount;
                        const isBatterHighlighted = isCountMatched && randomRoll >= pitcherRange;

                        return (
                            <td
                                key={`${count}-batter`}
                                className={isBatterHighlighted ? "highlighted-cell" : ""}
                            >
                                {pitcherRange} - 99
                            </td>
                        );
                    })}
                </tr>
            </tbody>
        </table>
    );
};

export default CardPreferenceTable;

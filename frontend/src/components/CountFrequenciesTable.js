import React from "react";

const COUNT_ORDER = ["(0-2)", "(1-2)", "(2-2)", "(3-2)", "(0-1)", "(1-1)", "(2-1)", "(3-1)", "(0-0)", "(1-0)", "(2-0)", "(3-0)"];

const CountFrequenciesTable = ({ data, highlightedCount, randomRoll }) => {
    // Sort the data according to the predefined count order
    const sortedData = [...data].sort((a, b) => {
        return COUNT_ORDER.indexOf(a.count_label) - COUNT_ORDER.indexOf(b.count_label);
    });

    const calculatePercentage = (rangeStart, rangeEnd) => {
        const rangeSize = rangeEnd - rangeStart + 1;
        const percentage = (rangeSize / 1000) * 100;
        return percentage.toFixed(1);
    };

    return (
        <table>
            <thead>
                <tr>
                    <th>Pitch Count</th>
                    {COUNT_ORDER.map((count) => (
                        <th key={count} className={count === highlightedCount ? "highlighted-column" : ""}>
                            {count}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Range</td>
                    {sortedData.map((item, index) => {
                        const isHighlighted = randomRoll >= item.range_start && randomRoll <= item.range_end;
                        return (
                            <td key={`range-${index}`} className={isHighlighted ? "highlighted-cell" : ""}>
                                {item.range_start} - {item.range_end}
                            </td>
                        );
                    })}
                </tr>
                <tr>
                    <td>% Chance</td>
                    {sortedData.map((item, index) => {
                        const isHighlighted = randomRoll >= item.range_start && randomRoll <= item.range_end;
                        const percentage = calculatePercentage(item.range_start, item.range_end);
                        return (
                            <td key={`percent-${index}`} className={isHighlighted ? "highlighted-cell" : ""}>
                                <div className='fill-bar-container'>
                                    <div
                                        className='fill-bar'
                                        style={{
                                            width: `${percentage}%`,
                                        }}
                                    />

                                <span className='range-text'>{percentage}%</span>
                                </div>
                            </td>
                        );
                    })}
                </tr>
            </tbody>
        </table>
    );
};

export default CountFrequenciesTable;

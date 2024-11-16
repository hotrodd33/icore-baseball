import React from "react";

const CountFrequenciesTable = ({ data, highlightedCount, randomRoll }) => {
  const calculatePercentage = (rangeStart, rangeEnd) => {
      const rangeSize = rangeEnd - rangeStart + 1;
      const percentage = (rangeSize / 1000) * 100;
      return percentage.toFixed(1);
  };

  return (
      <table>
          <thead>
              <tr>
                  <th>Count</th>
                  <th>Range</th>
                  <th>%</th>
              </tr>
          </thead>
          <tbody>
              {data.map((item, index) => {
                  const isHighlighted = randomRoll >= item.range_start && randomRoll <= item.range_end;
                  const percentage = calculatePercentage(item.range_start, item.range_end);

                  return (
                      <tr key={index} className={isHighlighted ? "highlighted-event" : ""}>
                          <td>{item.count_label}</td>
                          <td>
                              {item.range_start} - {item.range_end}
                          </td>
                          <td className='percentage-cell'>{percentage}%</td>
                      </tr>
                  );
              })}
          </tbody>
      </table>
  );
};

export default CountFrequenciesTable;
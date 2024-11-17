import React from 'react';

const DiceSVG = ({ value, color }) => {
  const dieColor = color || '#ff4d4d'; // Default to red if no color is provided

  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Draw a polygon to simulate the 10 sides of the die */}
      <polygon
        points="50,5 85,25 95,60 75,90 50,95 25,90 5,60 15,25"
        fill={dieColor}
        stroke="black"
        strokeWidth="2"
      />

      {/* Add lines to represent the segments or facets of the die */}
      <line x1="50" y1="5" x2="50" y2="95" stroke="black" strokeWidth="1" />
      <line x1="25" y1="90" x2="85" y2="25" stroke="black" strokeWidth="1" />
      <line x1="15" y1="25" x2="75" y2="90" stroke="black" strokeWidth="1" />

      {/* Display the value in the center of the die */}
      <text
        x="50%"
        y="55%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="20"
        fill="white"
        fontWeight="bold"
      >
        {value}
      </text>
    </svg>
  );
};

export default DiceSVG;

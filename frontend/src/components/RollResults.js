import React from 'react';
import './RollResults.css';

const RollResults = ({ roll, isRolling }) => {
  const rollStr = roll?.toString().padStart(3, '0') || '000';

  return (
    <div className={`roll-results ${isRolling ? 'rolling' : ''}`}>
      <div className="roll-digit red">{rollStr[0]}</div>
      <div className="roll-digit white">{rollStr[1]}</div>
      <div className="roll-digit blue">{rollStr[2]}</div>
    </div>
  );
};

export default RollResults;

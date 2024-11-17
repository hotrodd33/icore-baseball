import React, { useState } from 'react';
import DiceSVG from './DiceSVG';


const DiceRoller = () => {
  const [firstRandom, setFirstRandom] = useState(0);
  const [secondRandom, setSecondRandom] = useState(0);
  const [thirdRandom, setThirdRandom] = useState(0);

  const rollDice = () => {
    setFirstRandom(Math.floor(Math.random() * 10));
    setSecondRandom(Math.floor(Math.random() * 10));
    setThirdRandom(Math.floor(Math.random() * 10));
  };

  return (
    <div className="dice-roll-container">
      <button onClick={rollDice} className="roll-button">
        Roll Dice
      </button>
      <div className="dice-display">
        <DiceSVG value={firstRandom} color="#ff4d4d" />
        <DiceSVG value={secondRandom} color="#4da6ff" />
        <DiceSVG value={thirdRandom} color="#ffffff" />
      </div>
    </div>
  );
};

export default DiceRoller;

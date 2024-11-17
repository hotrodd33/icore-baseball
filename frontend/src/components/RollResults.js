// RollResults.js
import React from "react";
import "./RollResults.css";

const RollResults = ({ roll, isRolling }) => {
    const rollStr = roll?.toString().padStart(3, "0") || "000";

    return (
        <div className={`roll-results ${isRolling ? "rolling" : ""}`}>
            <div className='roll-digit red'>
                {rollStr[0]}
                <div class='side-line'></div>
                <div class='side-line'></div>
                <div class='side-line'></div>
            </div>
            <div className='roll-digit white'>
                {rollStr[1]}
                <div class='side-line'></div>
                <div class='side-line'></div>
                <div class='side-line'></div>
            </div>
            <div className='roll-digit blue'>
                {rollStr[2]}
                <div class='side-line'></div>
                <div class='side-line'></div>
                <div class='side-line'></div>
            </div>
        </div>
    );
};

export default RollResults;

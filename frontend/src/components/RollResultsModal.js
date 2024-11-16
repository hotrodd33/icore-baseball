import React from 'react';
import './RollResultsModal.css';

const RollResultsModal = ({ 
    isOpen, 
    onClose, 
    count, 
    activeCard, 
    batterName,
    pitcherName,
    leftHandedEvent,
    rightHandedEvent,
    rollResults
}) => {
    if (!isOpen) return null;

    return (
        <>
            <div className="baseball-modal-backdrop" onClick={onClose}>
                <div className="baseball-card-wrapper">
                    <div className={`baseball-card ${activeCard}-card`} onClick={e => e.stopPropagation()}>
                        <div className="card-header">
                            <button onClick={onClose} className="close-button">✕</button>
                            <div className="player-name">
                                {activeCard === 'pitcher' ? pitcherName : batterName}
                            </div>
                            <div className="at-bat-label">At-Bat Result</div>
                        </div>

                        <div className="card-content">
                            <div className="card-section">
                                <div className="section-title">Count</div>
                                <div className="count-display">{count}</div>
                            </div>

                            <div className="card-section">
                                <div className="section-title">Event Results</div>
                                <div className="event-grid">
                                    <div className="event-box">
                                        <div className="handedness-label">vs LH</div>
                                        <div className="event-result">{leftHandedEvent || 'No Event'}</div>
                                    </div>
                                    <div className="event-box">
                                        <div className="handedness-label">vs RH</div>
                                        <div className="event-result">{rightHandedEvent || 'No Event'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="card-section">
                                <div className="section-title">Roll Details</div>
                                <div className="rolls-grid">
                                    <div className="roll-box">
                                        <div className="roll-label">Count</div>
                                        <div className="roll-value">{rollResults?.first}</div>
                                    </div>
                                    <div className="roll-box">
                                        <div className="roll-label">Card</div>
                                        <div className="roll-value">{rollResults?.second}</div>
                                    </div>
                                    <div className="roll-box">
                                        <div className="roll-label">Event</div>
                                        <div className="roll-value">{rollResults?.third}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RollResultsModal;
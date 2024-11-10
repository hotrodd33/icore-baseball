import React from "react";

const RollResultsModal = ({ isOpen, onClose, count, activeCard, batterName, pitcherName, leftHandedEvent, rightHandedEvent, rollResults }) => {
    // Add console.log to debug
    console.log("Modal props:", { isOpen, count, activeCard, batterName, pitcherName });

    if (!isOpen) return null;

    return (
        <div className='results-modal'>
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' onClick={onClose}>
                <div className='bg-white rounded-lg p-6 max-w-2xl w-full m-4' onClick={(e) => e.stopPropagation()}>
                    <div className='roll-results-content'>
                        <div className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-bold'>Roll Results</h2>
                            <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
                                ✕
                            </button>
                        </div>

                        <div className='result-section count-section'>
                            <h3 className='text-lg font-bold mb-2'>Count</h3>
                            <div className='text-2xl text-green-700'>{count}</div>
                        </div>

                        <div className='result-section card-section'>
                            <h3 className='text-lg font-bold mb-2'>Active Card</h3>
                            <div className={`text-2xl ${activeCard === "pitcher" ? "text-red-600" : "text-green-700"}`}>{activeCard === "pitcher" ? pitcherName : batterName}</div>
                        </div>

                        <div className='result-section event-section'>
                            <h3 className='text-lg font-bold mb-2'>Event Results</h3>
                            <div className='grid grid-cols-2 gap-4'>
                                <div className='event-result'>
                                    <h4 className='font-semibold mb-1'>vs LH</h4>
                                    <div className='text-xl'>{leftHandedEvent || "No Event"}</div>
                                </div>
                                <div className='event-result'>
                                    <h4 className='font-semibold mb-1'>vs RH</h4>
                                    <div className='text-xl'>{rightHandedEvent || "No Event"}</div>
                                </div>
                            </div>
                        </div>

                        <div className='result-section rolls-section'>
                            <h3 className='text-lg font-bold mb-2'>Roll Details</h3>
                            <div className='grid grid-cols-3 gap-4'>
                                <div>
                                    <div className='text-sm font-medium'>Count Roll</div>
                                    <div className='text-xl'>{rollResults?.first}</div>
                                </div>
                                <div>
                                    <div className='text-sm font-medium'>Card Roll</div>
                                    <div className='text-xl'>{rollResults?.second}</div>
                                </div>
                                <div>
                                    <div className='text-sm font-medium'>Event Roll</div>
                                    <div className='text-xl'>{rollResults?.third}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RollResultsModal;

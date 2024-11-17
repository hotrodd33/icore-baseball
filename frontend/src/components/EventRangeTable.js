import React from "react";

const COUNT_ORDER = ["(0-2)", "(1-2)", "(2-2)", "(3-2)", "(0-1)", "(1-1)", "(2-1)", "(3-1)", "(0-0)", "(1-0)", "(2-0)", "(3-0)"];

const ALL_EVENTS = ["field_error", "field_out_fly_ball", "field_out_popup", "field_out_line_drive", "field_out_ground_ball", "double_play_combined", "single", "double", "triple", "home_run", "walk", "hit_by_pitch", "strikeout"];

const EVENT_ALIASES = {
    field_error: "Error?",
    field_out_fly_ball: "Flyball",
    field_out_popup: "Popup",
    field_out_line_drive: "Liner",
    field_out_ground_ball: "Groundball",
    double_play_combined: "Hard GB",
    single: "Single",
    double: "Double",
    triple: "Triple",
    home_run: "Home Run",
    walk: "Walk",
    hit_by_pitch: "Hit by Pitch",
    strikeout: "Strikeout",
};

const transformData = (data = []) => {
    if (!Array.isArray(data)) return {};

    const transformed = {};
    data.forEach((item) => {
        if (!item) return;

        const count = `(${item.balls}-${item.strikes})`;
        const event = item.event;

        if (!transformed[count]) {
            transformed[count] = {};
        }
        transformed[count][event] = {
            range_start: item.range_start ?? null,
            range_end: item.range_end ?? null,
            chances: item.chances ?? null,
            chance_bar_width: item.chance_bar_width ?? null,
        };
    });
    return transformed;
};

const EventRangeTable = ({ data = [], title = "", highlightedCount, highlightedEvents = [], highlightedRoll }) => {
    const transformedData = transformData(data);
    const counts = COUNT_ORDER.filter((count) => transformedData[count]);

    // Function to check if an event is in the highlighted range
    const isInHighlightedRange = (eventData) => {
        return eventData && highlightedRoll >= eventData.range_start && highlightedRoll <= eventData.range_end;
    };

    return (
        <div>
            <h3>{title}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Play Result</th>
                        {counts.map((count) => (
                            <th key={count} className={`${count.includes("-2") ? "pitcher-advantage" : count.includes("-1") ? "neutral-advantage" : count.includes("-0") ? "batter-advantage" : ""}`}>
                                {count}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {ALL_EVENTS.map((event) => {
                        const isEventHighlighted = highlightedEvents.includes(event);

                        return (
                            <tr key={event}>
                                <td className={isEventHighlighted ? "highlighted-event" : ""}>{EVENT_ALIASES[event] || event}</td>
                                {counts.map((count) => {
                                    const eventData = transformedData[count]?.[event];
                                    const isColumnHighlighted = highlightedCount === count;
                                    const isInRange = isInHighlightedRange(eventData, event);
                                    const isFullMatch = isEventHighlighted && isColumnHighlighted && isInRange;
                                    const fillPercentage = eventData?.chance_bar_width ?? 0;

                                    let className = "";
                                    if (isFullMatch) {
                                        className = "highlighted-cell";
                                    } else if (isEventHighlighted) {
                                        className = "highlighted-event";
                                    } else if (isColumnHighlighted) {
                                        className = "highlighted-column";
                                    }

                                    return (
                                        <td key={`${event}-${count}`} className={className}>
                                            <div className='fill-bar-container'>
                                                <div className='fill-bar' style={{ width: `${fillPercentage}%` }}></div>
                                                {eventData && eventData.range_start !== null && eventData.range_end !== null && <span className='range-text'>{`${eventData.range_start} - ${eventData.range_end}`}</span>}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default EventRangeTable;

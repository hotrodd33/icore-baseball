import React from 'react';

const COUNT_ORDER = [
    "(0-2)", "(1-2)", "(2-2)", "(3-2)", "(0-1)", "(1-1)", "(2-1)", "(3-1)", 
    "(0-0)", "(1-0)", "(2-0)", "(3-0)"
];

const ALL_EVENTS = [
    "field_error", "sac_fly", "field_out_fly_ball", "field_out_popup", 
    "field_out_line_drive", "field_out_ground_ball", "double_play_combined", 
    "force_out", "fielders_choice_out", "fielders_choice", 
    "catcher_interf", "sac_bunt", "single", "double", "triple", "home_run", 
    "intent_walk", "walk", "hit_by_pitch", "strikeout", "strikeout_double_play", 
    "truncated_pa"
];

const EVENT_ALIASES = {
    field_error: "E",
    sac_fly: "SF",
    field_out_fly_ball: "FO",
    field_out_popup: "PO",
    field_out_line_drive: "LO",
    field_out_ground_ball: "GO",
    grounded_into_double_play: "GDP",
    double_play: "DP",
    double_play_combined: "DP", // Alias for the combined events
    force_out: "FO",
    fielders_choice_out: "FC",
    fielders_choice: "FC",
    catcher_interf: "CI",
    sac_bunt: "SAC",
    single: "1B",
    double: "2B",
    triple: "3B",
    home_run: "HR",
    intent_walk: "IBB",
    walk: "BB",
    hit_by_pitch: "HBP",
    strikeout: "K",
    strikeout_double_play: "KDP",
    truncated_pa: "TP"
};

const EVENT_GROUPS = {
    double_play_combined: ["grounded_into_double_play", "double_play"]
};

const transformData = (data = []) => {
    if (!Array.isArray(data)) return {};
    
    const transformed = {};
    data.forEach((item) => {
        if (!item) return;
        
        const count = `(${item.balls}-${item.strikes})`;
        let event = item.event;

        // Check if the event belongs to a grouped event category
        for (const [group, events] of Object.entries(EVENT_GROUPS)) {
            if (events.includes(event)) {
                event = group; // Map the event to its group
                break;
            }
        }

        if (!transformed[count]) {
            transformed[count] = {};
        }

        if (!transformed[count][event]) {
            transformed[count][event] = {
                range_start: item.range_start ?? null,
                range_end: item.range_end ?? null,
                count: item.count ?? 0
            };
        } else {
            // Combine the ranges and counts for grouped events
            transformed[count][event].count += item.count;
            transformed[count][event].range_start = Math.min(transformed[count][event].range_start, item.range_start);
            transformed[count][event].range_end = Math.max(transformed[count][event].range_end, item.range_end);
        }
    });
    return transformed;
};

const EventRangeTable = ({ 
    data = [], 
    title = '', 
    highlightedCount, 
    highlightedEvents = [], 
    highlightedRoll 
}) => {
    const transformedData = transformData(data);
    const counts = COUNT_ORDER.filter((count) => transformedData[count]);

    // Function to check if an event is in the highlighted range
    const isInHighlightedRange = (eventData) => {
        return eventData &&
            highlightedRoll >= eventData.range_start &&
            highlightedRoll <= eventData.range_end;
    };

    return (
        <div>
            <h3>{title}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Event</th>
                        {counts.map((count) => (
                            <th 
                                key={count} 
                                className={highlightedCount === count ? "highlighted-column" : ""}
                            >
                                {count}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {ALL_EVENTS.map((event) => {
                        // Check if this event is highlighted in any count
                        const isEventHighlighted = highlightedEvents.includes(event);
                        
                        return (
                            <tr key={event}>
                                <td className={isEventHighlighted ? "highlighted-event" : ""}>
                                    {EVENT_ALIASES[event] || event}
                                </td>
                                {counts.map((count) => {
                                    const eventData = transformedData[count]?.[event];
                                    const isColumnHighlighted = highlightedCount === count;
                                    const isInRange = isInHighlightedRange(eventData);
                                    const isFullMatch = isEventHighlighted && isColumnHighlighted && isInRange;

                                    let className = '';
                                    if (isFullMatch) {
                                        className = 'highlighted-cell';
                                    } else if (isEventHighlighted) {
                                        className = 'highlighted-event';
                                    } else if (isColumnHighlighted) {
                                        className = 'highlighted-column';
                                    }

                                    return (
                                        <td
                                            key={`${event}-${count}`}
                                            className={className}
                                        >
                                            {eventData && eventData.range_start !== null && eventData.range_end !== null
                                                ? `${eventData.range_start} - ${eventData.range_end} (${eventData.count})`
                                                : ""}
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

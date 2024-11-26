import React from "react";
import "./EventRangeTable.css";

const BALL_COUNTS = ["0", "1", "2", "3"];

const EVENT_ALIASES = {
    strikeout: "K",
    field_error: "E",
    field_out_fly_ball: "FB",
    field_out_popup: "P",
    field_out_line_drive: "L",
    field_out_ground_ball: "GB",
    double_play_combined: "HGB",
    single: "1B",
    double: "2B",
    triple: "3B",
    home_run: "HR",
    walk: "BB",
    hit_by_pitch: "HP",
};

const transformDataByStrikes = (data = [], strikes) => {
    if (!Array.isArray(data)) return [];

    // Filter data based on number of strikes
    const filteredData = data.filter((item) => item.strikes === strikes);
    console.log(`Data filtered for ${strikes} strikes:`, filteredData);
    return filteredData;
};

const EventRangeTable = ({ data = [], handedness = "left", strikes }) => {
    console.log("Data passed to EventRangeTable:", data, "Handedness:", handedness);

    // Transform data based on handedness
    const transformedData = data.reduce((acc, item) => {
        const count = `(${item.balls}-${item.strikes})`;
        const event = item.event;

        if (!acc[count]) {
            acc[count] = {};
        }
        acc[count][event] = {
            range_start: item.range_start ?? null,
            range_end: item.range_end ?? null,
            chances: item.chances ?? null,
            chance_bar_width: item.chance_bar_width ?? null,
        };
        return acc;
    }, {});

    console.log("Transformed Data for EventRangeTable:", transformedData);

    return (
        <table className='event-table'>
            <thead>
                <tr>
                    {BALL_COUNTS.map((balls) => (
                        <th key={balls}>{`Balls: ${balls}`}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Object.keys(EVENT_ALIASES).map((event) => (
                    <tr key={event}>
                        {BALL_COUNTS.map((balls) => {
                            const count = `(${balls}-${strikes})`;
                            const eventData = transformedData[count]?.[event];

                            return (
                                <td key={`${event}-${balls}`}>
                                    {eventData ? (
                                        <div className='fill-bar-container'>
                                            <div className='fill-bar' style={{ width: `${eventData.chance_bar_width ?? 0}%` }}></div>
                                            <span className='range-text'>{`${eventData.range_start} - ${eventData.range_end}`}</span>
                                        </div>
                                    ) : (
                                        <div className='no-data'>-</div>
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const EventRangeTableGroup = ({ data = {} }) => {
    const { lefty = [], righty = [] } = data || {};

    // Transform data by handedness and strikes
    const filteredData = {
        2: {
            left: transformDataByStrikes(lefty, 2),
            right: transformDataByStrikes(righty, 2),
        },
        1: {
            left: transformDataByStrikes(lefty, 1),
            right: transformDataByStrikes(righty, 1),
        },
        0: {
            left: transformDataByStrikes(lefty, 0),
            right: transformDataByStrikes(righty, 0),
        },
    };

    return (
        <div className='event-table-group'>
            {Object.keys(filteredData).map((strikes) => (
                <div className='strike-group' key={strikes}>
                    <h3>{strikes === "2" ? "Two-Strike Count" : strikes === "1" ? "One-Strike Count" : "Zero-Strike Count"}</h3>
                    <div className='tables-container'>
                        <EventRangeTable data={filteredData[strikes].left} handedness='left' strikes={parseInt(strikes)} />
                        <table className='event-table results-column'>
                            <thead>
                                <tr>
                                    <th>Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(EVENT_ALIASES).map((alias) => (
                                    <tr>
                                        <td key={alias} className='result-name'>
                                            {alias}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <EventRangeTable data={filteredData[strikes].right} handedness='right' strikes={parseInt(strikes)} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default EventRangeTableGroup;

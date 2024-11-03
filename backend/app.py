from flask import Flask, request, jsonify, make_response
import pandas as pd
from io import StringIO
from flask_cors import CORS
from pybaseball import playerid_lookup, statcast_pitcher, statcast_batter
import random

app = Flask(__name__)
CORS(app)


# Define all events that should appear for each count
ALL_EVENTS = [
    "field_out_fly_ball", "field_out_popup", "field_out_line_drive", "field_out_ground_ball",
    "single", "double", "triple", "home_run", "walk", "hit_by_pitch",
    "strikeout"
]

def get_stats():
    data = request.json
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    year = data.get('year')
    player_type = data.get('player_type')

    # Fetch player data
    stats = get_player_stats(first_name, last_name, year, player_type)
    if isinstance(stats, dict) and 'error' in stats:
        return jsonify(stats), 400

    # Calculate event ranges by count
    event_ranges = calculate_event_ranges_for_counts(stats, player_type)

    # Calculate count frequencies and assign dice ranges
    count_frequencies = calculate_count_frequencies(stats)

    # Get distinct events
    distinct_events = stats['events'].dropna().unique().tolist()

    return jsonify({
        "event_ranges": event_ranges,
        "count_frequencies": count_frequencies.to_dict(orient='records'),
        "distinct_events": distinct_events  # Add distinct events here
    })

def get_player_stats(first_name, last_name, year, player_type):
    player = playerid_lookup(last_name, first_name)
    if player.empty:
        return {"error": "Player not found"}

    player_id = player.iloc[0]['key_mlbam']

    try:
        if player_type == 'pitcher':
            stats = statcast_pitcher(f'{year}-03-25', f'{year}-10-31', player_id)
        elif player_type == 'batter':
            stats = statcast_batter(f'{year}-03-25', f'{year}-10-31', player_id)
        else:
            return {"error": "Invalid player type. Use 'batter' or 'pitcher'."}

        if stats.empty:
            return {"error": f"No stats available for {first_name} {last_name} in {year}"}
        return stats
    except Exception as e:
        return {"error": str(e)}

def calculate_event_ranges_for_counts(stats, player_type):
    print("Processing stats for event ranges")  # Debugging print
    stats = stats.dropna(subset=['events'])  # Ensure we filter out non-event rows

    # Separate stats based on handedness
    if player_type == 'batter':
        lefty_stats = stats[stats['p_throws'] == 'L']  # Left-handed pitchers
        righty_stats = stats[stats['p_throws'] == 'R']  # Right-handed pitchers
    elif player_type == 'pitcher':
        lefty_stats = stats[stats['stand'] == 'L']  # Left-handed batters
        righty_stats = stats[stats['stand'] == 'R']  # Right-handed batters

    lefty_results = calculate_ranges(lefty_stats)
    righty_results = calculate_ranges(righty_stats)

    # Summarize bb_type for "field_out" events by hand
    lefty_bb_type_summary = summarize_bb_type(lefty_stats, 'field_out')
    righty_bb_type_summary = summarize_bb_type(righty_stats, 'field_out')

    print("Lefty results:", lefty_results)  # Debugging print
    print("Righty results:", righty_results)  # Debugging print

    return {
        "lefty": lefty_results,
        "righty": righty_results,
        "lefty_bb_type_summary": lefty_bb_type_summary,
        "righty_bb_type_summary": righty_bb_type_summary
    }

def summarize_bb_type(stats, event_type):
    # Filter for the specified event type and group by bb_type
    field_outs = stats[stats['events'] == event_type]
    print("Field out events data:", field_outs[['events', 'bb_type']].head())  # Debugging print

    # Group by bb_type
    bb_type_counts = (
        field_outs.groupby('bb_type')
        .size()
        .reset_index(name='count')
    )

    # Convert to list of dictionaries for JSON serialization
    return bb_type_counts.to_dict(orient='records')


def calculate_ranges(subset):
    event_ranges = []
    print("Processing subset with shape:", subset.shape)  # Debugging print

    for (balls, strikes), group in subset.groupby(['balls', 'strikes']):
        total_count = group.shape[0]
        current_start = 0  # Start counting from 0 for each new count
        grouped_data = []

        # Prepare a dictionary of actual events that occurred for quick lookup
        events_dict = {}
        for event, event_group in group.groupby('events'):
            if event == 'field_out':
                # Handle each bb_type variant within field_out separately
                for bb_type, bb_group in event_group.groupby('bb_type'):
                    bb_count = bb_group.shape[0]
                    decimal_value = bb_count / total_count
                    event_name = f"{event}_{bb_type}"
                    events_dict[event_name] = decimal_value
            else:
                event_count = event_group.shape[0]
                decimal_value = event_count / total_count
                events_dict[event] = decimal_value

        # Iterate over all events in the specified order in ALL_EVENTS
        for event_name in ALL_EVENTS:
            if event_name in events_dict:
                # Event occurred; use its calculated decimal value
                decimal_value = events_dict[event_name]
                range_size = int(decimal_value * 1000)

                grouped_data.append({
                    'balls': int(balls),
                    'strikes': int(strikes),
                    'event': event_name,
                    'decimal_value': float(decimal_value),
                    'range_start': int(current_start),
                    'range_end': int(current_start + range_size - 1)
                })

                current_start += range_size
                if current_start > 999:
                    current_start = 999  # Ensure we don't exceed 999
            else:
                # Event did not occur; set decimal_value to 0.0 and keep range at 0
                grouped_data.append({
                    'balls': int(balls),
                    'strikes': int(strikes),
                    'event': event_name,
                    'decimal_value': 0.0,
                    'range_start': 0,
                    'range_end': 0
                })

        # Add all events for this count to event_ranges in the specified order
        event_ranges.extend(grouped_data)

    print("Finished processing subset.")  # Debugging print
    return event_ranges



    lefty_results = calculate_ranges(lefty_stats)
    righty_results = calculate_ranges(righty_stats)

    return {"lefty": lefty_results, "righty": righty_results}

def calculate_count_frequencies(stats):
    # Filter the stats to include only rows where there was a recorded event
    stats_with_results = stats.dropna(subset=['events'])  # Only keep rows with an event
    
    # Group by balls and strikes to count occurrences of each combination with an event
    count_frequencies = stats_with_results.groupby(['balls', 'strikes']).size().reset_index(name='count')
    
    # Calculate total count of rows to find percentage for each (balls, strikes) combination
    total_counts = count_frequencies['count'].sum()
    count_frequencies['percentage'] = (count_frequencies['count'] / total_counts) * 100

    # Assign dice roll range (000-999) based on the percentage of each count
    current_start = 0
    count_frequencies['range_start'] = 0
    count_frequencies['range_end'] = 0

    for i, row in count_frequencies.iterrows():
        range_size = int((row['percentage'] / 100) * 1000)
        count_frequencies.at[i, 'range_start'] = current_start
        count_frequencies.at[i, 'range_end'] = current_start + range_size - 1
        current_start += range_size

        # Ensure we don't exceed 999 for the final range
        if current_start > 999:
            current_start = 999

    return count_frequencies[['balls', 'strikes', 'count', 'percentage', 'range_start', 'range_end']]


@app.route('/api/get_stats', methods=['POST'])
@app.route('/api/get_stats', methods=['POST'])
def get_stats():
    data = request.json
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    year = data.get('year')
    player_type = data.get('player_type')

    stats = get_player_stats(first_name, last_name, year, player_type)
    if isinstance(stats, dict) and 'error' in stats:
        return jsonify(stats), 400

    # Calculate event ranges by count and include bb_type summary
    results = calculate_event_ranges_for_counts(stats, player_type)

    # Calculate count frequencies and assign dice ranges
    count_frequencies = calculate_count_frequencies(stats)

    return jsonify({
        "event_ranges": results,
        "count_frequencies": count_frequencies.to_dict(orient='records'),  # Convert to JSON serializable format
        "lefty_bb_type_summary": results["lefty_bb_type_summary"],
        "righty_bb_type_summary": results["righty_bb_type_summary"]
    })

@app.route('/api/download_csv', methods=['POST'])
def download_csv():
    data = request.json
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    year = data.get('year')
    player_type = data.get('player_type')

    # Fetch player data
    stats = get_player_stats(first_name, last_name, year, player_type)
    if isinstance(stats, dict) and 'error' in stats:
        return jsonify(stats), 400

    # Calculate event ranges by count and count frequencies
    count_frequencies = calculate_count_frequencies(stats)
    event_ranges = calculate_event_ranges_for_counts(stats, player_type)

    # Convert count frequencies and event ranges to DataFrames
    count_frequencies_df = pd.DataFrame(count_frequencies)
    lefty_events_df = pd.DataFrame(event_ranges.get('lefty', []))
    righty_events_df = pd.DataFrame(event_ranges.get('righty', []))

    # Add "hand" column for clarity and concatenate data
    lefty_events_df['hand'] = 'Left-Handed'
    righty_events_df['hand'] = 'Right-Handed'
    compiled_data = pd.concat([count_frequencies_df, lefty_events_df, righty_events_df], ignore_index=True)

    # Convert the compiled data to CSV format
    csv_data = StringIO()
    compiled_data.to_csv(csv_data, index=False)
    csv_data.seek(0)

    # Create a response for downloading
    response = make_response(csv_data.getvalue())
    response.headers["Content-Disposition"] = f"attachment; filename={first_name}_{last_name}_{year}_compiled_stats.csv"
    response.headers["Content-Type"] = "text/csv"

    return response

@app.route('/api/roll_dice', methods=['POST'])
def roll_dice():
    data = request.json
    dice_roll = random.randint(0, 999)
    return jsonify({"roll": dice_roll})

if __name__ == '__main__':
    app.run(debug=True)

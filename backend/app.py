import os
import json
from flask import Flask, request, jsonify, make_response
import pandas as pd
from io import StringIO
from flask_cors import CORS
from pybaseball import playerid_lookup, statcast_pitcher, statcast_batter
import random

app = Flask(__name__)
CORS(app)

DATA_FOLDER = "data"
os.makedirs(DATA_FOLDER, exist_ok=True)

ALL_EVENTS_ORDER = [
    "field_error", "sac_fly", "field_out_fly_ball", "field_out_popup", "field_out_line_drive", "field_out_ground_ball",
    "grounded_into_double_play", "double_play", "force_out", "fielders_choice_out", "fielders_choice", "catcher_interf", "sac_bunt", "single", "double", "triple", "home_run", "intent_walk", "walk", "hit_by_pitch",
    "strikeout", "strikeout_double_play"
]

DATA_FOLDER = "./data"
if not os.path.exists(DATA_FOLDER):
    os.makedirs(DATA_FOLDER)  # Ensure the folder exists

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

    return {
        "lefty": lefty_results,
        "righty": righty_results,
        "lefty_bb_type_summary": lefty_bb_type_summary,
        "righty_bb_type_summary": righty_bb_type_summary
    }


def calculate_ranges(subset):
    event_ranges = []

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

        # Process events in the exact order specified in ALL_EVENTS_ORDER
        for event_name in ALL_EVENTS_ORDER:
            if event_name in events_dict:
                decimal_value = events_dict[event_name]
                range_size = int(decimal_value * 1000)
                grouped_data.append({
                    'balls': int(balls),
                    'strikes': int(strikes),
                    'event': event_name,
                    'decimal_value': float(decimal_value),
                    'range_start': int(current_start),
                    'range_end': int(current_start + range_size - 1),
                    'count_label': f"({int(balls)}-{int(strikes)})"  # Format count_label as (balls-strikes)
                })

                current_start += range_size
                if current_start > 999:
                    current_start = 999  # Ensure we don't exceed 999

        # Add any events not in ALL_EVENTS_ORDER at the end, if they exist
        additional_events = [event for event in events_dict if event not in ALL_EVENTS_ORDER]
        for event_name in additional_events:
            decimal_value = events_dict[event_name]
            range_size = int(decimal_value * 1000)

            grouped_data.append({
                'balls': int(balls),
                'strikes': int(strikes),
                'event': event_name,
                'decimal_value': float(decimal_value),
                'range_start': int(current_start),
                'range_end': int(current_start + range_size - 1),
                'count_label': f"({int(balls)}-{int(strikes)})"  # Format count_label as (balls-strikes)
            })

            current_start += range_size
            if current_start > 999:
                current_start = 999

        # Add all events for this count to event_ranges in the specified order
        event_ranges.extend(grouped_data)

    print("Finished processing subset.")  # Debugging print
    return event_ranges


def summarize_bb_type(stats, event_type):
    field_outs = stats[stats['events'] == event_type]
    print("Field out events data:", field_outs[['events', 'bb_type']].head())  # Debugging print

    bb_type_counts = (
        field_outs.groupby('bb_type')
        .size()
        .reset_index(name='count')
    )

    return bb_type_counts.to_dict(orient='records')


def calculate_count_frequencies(stats):
    # Filter the stats to include only rows where there was a recorded event
    stats_with_results = stats.dropna(subset=['events'])  # Only keep rows with an event
    
    # Group by balls and strikes to count occurrences of each combination with an event
    if stats_with_results.empty:
        print("No events found in stats, returning empty count frequencies.")
        return pd.DataFrame(columns=['count_label', 'range_start', 'range_end'])

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
        count_frequencies.at[i, 'range_start'] = int(current_start)
        count_frequencies.at[i, 'range_end'] = int(current_start + range_size - 1)
        current_start += range_size

        # Ensure we don't exceed 999 for the final range
        if current_start > 999:
            current_start = 999

    # Format the result to only include (balls-strikes) as the y-axis label and range_end as the high number
    count_frequencies['count_label'] = count_frequencies.apply(lambda row: f"({int(row['balls'])}-{int(row['strikes'])})", axis=1)

    # Debugging output to verify integer conversion
    print("count_frequencies after formatting:")
    print(count_frequencies[['balls', 'strikes', 'count_label', 'range_start', 'range_end']])

    # Ensure the returned DataFrame has the correct columns and types
    count_frequencies = count_frequencies[['count_label', 'range_start', 'range_end']].astype({
        'range_start': int,
        'range_end': int
    })

    return count_frequencies

@app.route('/api/get_stats', methods=['POST'])
def get_stats():
    data = request.json
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    year = data.get('year')
    player_type = data.get('player_type')

    # Create a filename based on the player's name and year
    filename = f"{first_name}_{last_name}_{year}.json".replace(" ", "_")
    filepath = os.path.join(DATA_FOLDER, filename)

    # Check if the file already exists
    if os.path.isfile(filepath):
        print(f"Loading data from {filepath}")
        with open(filepath, 'r') as f:
            player_data = json.load(f)
        return jsonify(player_data)

    # If file doesn't exist, fetch the data from the API
    stats = get_player_stats(first_name, last_name, year, player_type)
    if isinstance(stats, dict) and 'error' in stats:
        return jsonify(stats), 400

    # Calculate event ranges and count frequencies
    event_ranges = calculate_event_ranges_for_counts(stats, player_type)
    count_frequencies = calculate_count_frequencies(stats)

    # Get distinct events
    distinct_events = stats['events'].dropna().unique().tolist()

    # Create the player data object
    player_data = {
        "event_ranges": event_ranges,
        "count_frequencies": count_frequencies.to_dict(orient='records'),
        "distinct_events": distinct_events
    }

    # Attempt to save the data to a JSON file
    try:
        print(f"Attempting to save data to {filepath}")
        with open(filepath, 'w') as f:
            json.dump(player_data, f, indent=4)
        print(f"Data successfully saved to {filepath}")
    except Exception as e:
        print(f"Error saving data to {filepath}: {e}")

    return jsonify(player_data)

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


if __name__ == '__main__':
    app.run(debug=True)

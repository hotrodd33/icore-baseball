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
    "strikeout", "sac_fly_double_play", "double_play_combined", "field_out_ground_ball", "field_out_popup", "field_out_fly_ball", "field_out_line_drive", 
    "field_error", "truncated_pa", "catcher_interf", "walk", "hit_by_pitch",
    "single", "double", "triple", "home_run"
]

# Update EVENT_GROUPS to only combine necessary events, leaving out field outs to be distinct
EVENT_GROUPS = {
    "grounded_into_double_play": "double_play_combined",
    "sac_fly_double_play": "double_play_combined",
    "double_play": "double_play_combined",
    "sac_fly": "field_out_fly_ball",
    "strikeout": "strikeout",
    "strikeout_double_play": "strikeout",
    "fielders_choice_out": "field_out_ground_ball",
    "truncated_pa": "field_out_ground_ball",
    "fielders_choice": "field_out_ground_ball",
    "sac_bunt": "field_out_ground_ball",
    "force_out": "field_out_ground_ball",
    "intent_walk": "walk",
    "walk": "walk",
    "catcher_interf": "walk",
    # You can add more mappings if necessary
}

COUNT_ORDER = ["(0-0)", "(0-1)", "(0-2)", "(1-0)", "(1-1)", "(1-2)", "(2-0)", "(2-1)", "(2-2)", "(3-0)", "(3-1)", "(3-2)"]

def calculate_event_ranges_for_counts(stats, player_type):
    print(f"Processing stats for {player_type} event ranges")
    stats = stats.dropna(subset=['events'])

    # Separate stats based on handedness
    if player_type == 'batter':
        lefty_stats = stats[stats['p_throws'] == 'L']  # Left-handed pitchers
        righty_stats = stats[stats['p_throws'] == 'R']  # Right-handed pitchers
    elif player_type == 'pitcher':
        lefty_stats = stats[stats['stand'] == 'L']  # Left-handed batters
        righty_stats = stats[stats['stand'] == 'R']  # Right-handed batters

    lefty_results = calculate_ranges(lefty_stats)
    righty_results = calculate_ranges(righty_stats)

    return {
        "lefty": lefty_results,
        "righty": righty_results
    }

def calculate_ranges(subset):
    event_ranges = []

    for (balls, strikes), group in subset.groupby(['balls', 'strikes']):
        total_count = group.shape[0]
        current_start = 0
        grouped_data = []

        # Initialize events dictionary and counts to 0 for all events in ALL_EVENTS_ORDER
        events_dict = {event_name: 0 for event_name in ALL_EVENTS_ORDER}
        event_counts = {event_name: 0 for event_name in ALL_EVENTS_ORDER}

        for event, event_group in group.groupby('events'):
            # Combine events based on the grouping dictionary if applicable
            combined_event = EVENT_GROUPS.get(event, event)

            if event == 'field_out':
                # Further classify field_out based on bb_type (batted ball type)
                for bb_type, bb_group in event_group.groupby('bb_type'):
                    if bb_type == 'fly_ball':
                        combined_event = 'field_out_fly_ball'
                    elif bb_type == 'popup':
                        combined_event = 'field_out_popup'
                    elif bb_type == 'line_drive':
                        combined_event = 'field_out_line_drive'
                    elif bb_type == 'ground_ball':
                        combined_event = 'field_out_ground_ball'

                    # Update events dictionary and counts
                    event_count = bb_group.shape[0]
                    events_dict[combined_event] += event_count / total_count
                    event_counts[combined_event] += event_count
            else:
                # Update events dictionary and counts for non-field_out events
                event_count = event_group.shape[0]
                events_dict[combined_event] += event_count / total_count
                event_counts[combined_event] += event_count

        # Create ranges based on the order defined in ALL_EVENTS_ORDER
        for event_name in ALL_EVENTS_ORDER:
            if events_dict[event_name] > 0:
                decimal_value = events_dict[event_name]
                range_size = int(decimal_value * 1000)

                # Append the event with the corrected count as the size of the range
                grouped_data.append({
                    'balls': int(balls),
                    'strikes': int(strikes),
                    'event': event_name,
                    'decimal_value': float(decimal_value),
                    'range_start': int(current_start),
                    'range_end': int(current_start + range_size - 1),
                    'count_label': f"({int(balls)}-{int(strikes)})",
                    'chances': round(decimal_value * 100, 2),
                    'chance_bar_width': int(decimal_value * 100)
                })

                current_start += range_size
                if current_start > 999:
                    current_start = 999

        # Adjust the last range to end at 999 if necessary
        if grouped_data and grouped_data[-1]['range_end'] != 999:
            grouped_data[-1]['range_end'] = 999

        event_ranges.extend(grouped_data)

    return event_ranges


def calculate_count_frequencies(stats):
    stats_with_results = stats.dropna(subset=['events'])
    
    if stats_with_results.empty:
        print("No events found in stats, returning empty count frequencies.")
        return pd.DataFrame(columns=['count_label', 'range_start', 'range_end'])

    count_frequencies = stats_with_results.groupby(['balls', 'strikes']).size().reset_index(name='count')
    total_counts = count_frequencies['count'].sum()
    count_frequencies['percentage'] = (count_frequencies['count'] / total_counts) * 100

    # Sort count_frequencies by the same order as COUNT_ORDER
    count_frequencies['count_label'] = count_frequencies.apply(
        lambda row: f"({int(row['balls'])}-{int(row['strikes'])})", axis=1
    )
    count_frequencies['count_label'] = pd.Categorical(
        count_frequencies['count_label'], categories=COUNT_ORDER, ordered=True
    )
    count_frequencies = count_frequencies.sort_values('count_label')

    current_start = 0
    count_frequencies['range_start'] = 0
    count_frequencies['range_end'] = 0

    for i, row in count_frequencies.iterrows():
        range_size = int((row['percentage'] / 100) * 1000)
        count_frequencies.at[i, 'range_start'] = int(current_start)
        count_frequencies.at[i, 'range_end'] = int(current_start + range_size - 1)
        current_start += range_size

        if current_start > 999:
            current_start = 999
            count_frequencies.at[i, 'range_end'] = 999

    # Remove NaN values that may have arisen
    count_frequencies.dropna(subset=['count_label'], inplace=True)

    return count_frequencies[['count_label', 'range_start', 'range_end']].astype({
        'range_start': int,
        'range_end': int
    })

def get_player_stats(first_name, last_name, year):
    player = playerid_lookup(last_name, first_name)
    if player.empty:
        return None, "Player not found"

    player_id = player.iloc[0]['key_mlbam']
    try:
        batter_stats = statcast_batter(f'{year}-03-25', f'{year}-10-31', player_id)
        pitcher_stats = statcast_pitcher(f'{year}-03-25', f'{year}-10-31', player_id)

        if batter_stats.empty and pitcher_stats.empty:
            return None, f"No stats available for {first_name} {last_name} in {year}"

        return {
            "batter": batter_stats if not batter_stats.empty else None,
            "pitcher": pitcher_stats if not pitcher_stats.empty else None
        }, None
    except Exception as e:
        return None, str(e)

@app.route('/api/get_both_stats', methods=['POST'])
def get_both_stats():
    data = request.json
    batter_data = data.get('batter', {})
    pitcher_data = data.get('pitcher', {})

    results = {
        "batter": None,
        "pitcher": None
    }

    # Process batter
    if batter_data:
        batter_filename = f"{batter_data['first_name']}_{batter_data['last_name']}_{batter_data['year']}_batter.json"
        batter_filepath = os.path.join(DATA_FOLDER, batter_filename)

        if os.path.isfile(batter_filepath):
            with open(batter_filepath, 'r') as f:
                results["batter"] = json.load(f)
        else:
            stats, error = get_player_stats(
                batter_data['first_name'],
                batter_data['last_name'],
                batter_data['year']
            )
            if error:
                results["batter"] = {"error": error}
            elif stats and stats.get("batter") is not None:
                batter_stats = stats["batter"]
                batter_results = {
                    "event_ranges": calculate_event_ranges_for_counts(batter_stats, "batter"),
                    "count_frequencies": calculate_count_frequencies(batter_stats).to_dict(orient='records')
                }
                results["batter"] = batter_results

                with open(batter_filepath, 'w') as f:
                    json.dump(batter_results, f, indent=4)

    # Process pitcher
    if pitcher_data:
        pitcher_filename = f"{pitcher_data['first_name']}_{pitcher_data['last_name']}_{pitcher_data['year']}_pitcher.json"
        pitcher_filepath = os.path.join(DATA_FOLDER, pitcher_filename)

        if os.path.isfile(pitcher_filepath):
            with open(pitcher_filepath, 'r') as f:
                results["pitcher"] = json.load(f)
        else:
            stats, error = get_player_stats(
                pitcher_data['first_name'],
                pitcher_data['last_name'],
                pitcher_data['year']
            )
            if error:
                results["pitcher"] = {"error": error}
            elif stats and stats.get("pitcher") is not None:
                pitcher_stats = stats["pitcher"]
                pitcher_results = {
                    "event_ranges": calculate_event_ranges_for_counts(pitcher_stats, "pitcher"),
                    "count_frequencies": calculate_count_frequencies(pitcher_stats).to_dict(orient='records')
                }
                results["pitcher"] = pitcher_results

                with open(pitcher_filepath, 'w') as f:
                    json.dump(pitcher_results, f, indent=4)

    return jsonify(results)

# Keep the original endpoint for backward compatibility
@app.route('/api/get_stats', methods=['POST'])
def get_stats():
    data = request.json
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    year = data.get('year')
    player_type = data.get('player_type')

    filename = f"{first_name}_{last_name}_{year}_{player_type}.json".replace(" ", "_")
    filepath = os.path.join(DATA_FOLDER, filename)

    if os.path.isfile(filepath):
        print(f"Loading data from {filepath}")
        with open(filepath, 'r') as f:
            return jsonify(json.load(f))

    stats, error = get_player_stats(first_name, last_name, year)
    if error:
        return jsonify({"error": error}), 400

    stats_data = stats.get(player_type)
    if stats_data is None:
        return jsonify({"error": f"No {player_type} stats found for this player"}), 400

    player_data = {
        "event_ranges": calculate_event_ranges_for_counts(stats_data, player_type),
        "count_frequencies": calculate_count_frequencies(stats_data).to_dict(orient='records')
    }

    try:
        with open(filepath, 'w') as f:
            json.dump(player_data, f, indent=4)
    except Exception as e:
        print(f"Error saving data to {filepath}: {e}")

    return jsonify(player_data)

if __name__ == '__main__':
    app.run(debug=True)

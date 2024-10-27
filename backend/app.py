from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from pybaseball import playerid_lookup, statcast_pitcher, statcast_batter
import random

app = Flask(__name__)
CORS(app)

def get_player_stats(first_name, last_name, year, player_type):
    player = playerid_lookup(last_name, first_name)
    if player.empty:
        return {"error": "Player not found"}

    player_id = player.iloc[0]['key_mlbam']

    try:
        if player_type == 'pitcher':
            stats = statcast_pitcher(f'{year}-04-01', f'{year}-10-31', player_id)
        elif player_type == 'batter':
            stats = statcast_batter(f'{year}-04-01', f'{year}-10-31', player_id)
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

    if player_type == 'batter':
        lefty_stats = stats[stats['p_throws'] == 'L']  # Left-handed pitchers
        righty_stats = stats[stats['p_throws'] == 'R']  # Right-handed pitchers
    elif player_type == 'pitcher':
        lefty_stats = stats[stats['stand'] == 'L']  # Left-handed batters
        righty_stats = stats[stats['stand'] == 'R']  # Right-handed batters

    lefty_results = calculate_ranges(lefty_stats)
    righty_results = calculate_ranges(righty_stats)

    print("Lefty results:", lefty_results)  # Debugging print
    print("Righty results:", righty_results)  # Debugging print

    if not lefty_results and not righty_results:
        return None  # Return None if no results

    return {"lefty": lefty_results, "righty": righty_results}


def calculate_ranges(subset):
    event_ranges = []
    print("Processing subset with shape:", subset.shape)  # Debugging print

    for (balls, strikes), group in subset.groupby(['balls', 'strikes']):
        total_count = group.shape[0]
        current_start = 0
        print(f"Processing {balls} balls, {strikes} strikes, total events: {total_count}")  # Debugging print

        for event, event_group in group.groupby('events'):
            event_count = event_group.shape[0]
            percentage = (event_count / total_count) * 100
            range_size = int((percentage / 100) * 1000)

            # Convert all int64 values to native Python integers for JSON serialization
            event_ranges.append({
                'balls': int(balls),
                'strikes': int(strikes),
                'event': event,
                'percentage': float(percentage),
                'range_start': int(current_start),
                'range_end': int(current_start + range_size - 1)
            })

            current_start += range_size
            if current_start > 999:
                current_start = 999  # Ensure we don't exceed 999

    print("Finished processing subset.")  # Debugging print
    return event_ranges

    lefty_results = calculate_ranges(lefty_stats)
    righty_results = calculate_ranges(righty_stats)

    return {"lefty": lefty_results, "righty": righty_results}

def calculate_count_frequencies(stats):
    # Group by balls and strikes to count occurrences of each combination
    count_frequencies = stats.groupby(['balls', 'strikes']).size().reset_index(name='count')

    # Calculate total number of rows to calculate percentage
    total_counts = count_frequencies['count'].sum()

    # Calculate percentage of each count
    count_frequencies['percentage'] = (count_frequencies['count'] / total_counts) * 100

    # Assign dice roll range (000-999) based on percentage
    current_start = 0
    count_frequencies['range_start'] = 0
    count_frequencies['range_end'] = 0

    for i, row in count_frequencies.iterrows():
        range_size = int((row['percentage'] / 100) * 1000)
        count_frequencies.at[i, 'range_start'] = current_start
        count_frequencies.at[i, 'range_end'] = current_start + range_size - 1
        current_start += range_size

        # Ensure we cap at 999 for the last range
        if current_start > 999:
            current_start = 999

    return count_frequencies[['balls', 'strikes', 'count', 'percentage', 'range_start', 'range_end']]

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

    # Calculate event ranges by count
    results = calculate_event_ranges_for_counts(stats, player_type)

    # Calculate count frequencies and assign dice ranges
    count_frequencies = calculate_count_frequencies(stats)

    return jsonify({
        "event_ranges": results,
        "count_frequencies": count_frequencies.to_dict(orient='records')  # Convert to JSON serializable format
    })



@app.route('/api/roll_dice', methods=['POST'])
def roll_dice():
    data = request.json
    dice_roll = random.randint(0, 999)
    return jsonify({"roll": dice_roll})

if __name__ == '__main__':
    app.run(debug=True)

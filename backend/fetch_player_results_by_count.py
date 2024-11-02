import sys
import pandas as pd
from pybaseball import playerid_lookup, statcast_pitcher, statcast_batter

def get_player_stats(first_name, last_name, year, player_type):
    # Look up player ID using pybaseball
    player = playerid_lookup(last_name, first_name)
    if player.empty:
        return {"error": "Player not found"}

    player_id = player.iloc[0]['key_mlbam']  # Get MLBAM player ID

    # Fetch Statcast stats for this player for a specific year
    try:
        if player_type == 'pitcher':
            stats = statcast_pitcher(f'{year}-03-01', f'{year}-10-31', player_id)
        elif player_type == 'batter':
            stats = statcast_batter(f'{year}-03-01', f'{year}-10-31', player_id)
        else:
            return {"error": "Invalid player type. Use 'batter' or 'pitcher'."}

        if stats.empty:
            return {"error": f"No stats available for {first_name} {last_name} in {year}"}
        return stats
    except Exception as e:
        return {"error": str(e)}

def get_results_by_count(stats):
    # Filter out rows where events is NaN (non-play results)
    stats = stats.dropna(subset=['events'])

    # Group by balls, strikes, and events (play results)
    results = stats.groupby(['balls', 'strikes', 'events']).size().reset_index(name='count')

    return results

if __name__ == "__main__":
    first_name = sys.argv[1]
    last_name = sys.argv[2]
    year = sys.argv[3]
    player_type = sys.argv[4]  # 'batter' or 'pitcher'

    # Fetch stats based on player type
    stats = get_player_stats(first_name, last_name, year, player_type)
    if isinstance(stats, dict) and 'error' in stats:
        print(stats)
    else:
        # Get play results by count
        results = get_results_by_count(stats)
        print(results)

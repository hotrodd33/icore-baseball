import sys
import pandas as pd
from pybaseball import playerid_lookup, statcast_pitcher

def get_player_stats(first_name, last_name):
    # Look up player ID using pybaseball
    player = playerid_lookup(last_name, first_name)
    if player.empty:
        return {"error": "Player not found"}
    
    player_id = player.iloc[0]['key_mlbam']  # Get MLBAM player ID

    # Fetch stats for this player (use career range or specific dates as needed)
    stats = statcast_pitcher('1991-04-01', '1991-10-01', player_id)

    # Convert stats DataFrame to dictionary
    return stats.to_dict(orient='records')

if __name__ == "__main__":
    first_name = sys.argv[1]
    last_name = sys.argv[2]
    
    stats = get_player_stats(first_name, last_name)
    print(stats)

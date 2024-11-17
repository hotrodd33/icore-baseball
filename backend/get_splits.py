import os
from pybaseball import retrosheet


# This will list available seasons for which game logs are present
available_seasons = retrosheet.available_game_log_seasons()
print(available_seasons)

# Download Retrosheet game logs for the year 1998
games_1998 = retrosheet.season_game_logs(1998)

# Filter for Ken Griffey Jr.
ken_griffey_games = games_1998[(games_1998['BAT_ID'] == 'griffke02')]  # Use Retrosheet ID for Ken Griffey Jr.

# Display some data
print(ken_griffey_games)

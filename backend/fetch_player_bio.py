import argparse
from pybaseball import playerid_lookup

# Function to get player bio information
def get_player_bio(first_name, last_name):
    try:
        # Get player ID lookup for a given name
        player_df = playerid_lookup(last_name, first_name)

        if player_df.empty:
            print(f"No player found with name: {first_name} {last_name}")
            return None
        
        # Display available bio data
        for _, player in player_df.iterrows():
            print(f"Player ID: {player['key_mlbam']}")
            print(f"Name: {player['name_first']} {player['name_last']}")
            print(f"Birth Year: {player['birth_year']}")
            print(f"Debut Year: {player['mlb_played_first']}")
            print()

    except Exception as e:
        print(f"An error occurred: {e}")

# Main function to parse command-line arguments
def main():
    parser = argparse.ArgumentParser(description="Get baseball player bio information")
    parser.add_argument("first_name", type=str, help="First name of the player")
    parser.add_argument("last_name", type=str, help="Last name of the player")
    
    args = parser.parse_args()
    
    get_player_bio(args.first_name, args.last_name)

if __name__ == "__main__":
    main()

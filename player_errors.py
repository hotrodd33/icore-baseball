import csv
import re
from collections import defaultdict

# Regex patterns to find errors in the "event" column
error_pattern_explicit = re.compile(r'E(\d)/([TGF])')   # e.g. E6/T
error_pattern_parenthetical = re.compile(r'\(E(\d)\)')  # e.g. (E6)

def load_player_names(player_csv):
    """
    Loads allplayers.csv into a dictionary:
        player_names[player_id] = {'first': 'Andrew', 'last': 'Abbott'}
    """
    player_names = {}
    with open(player_csv, mode='r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            pid = row['id']
            first = row['first']
            last = row['last']
            player_names[pid] = {'first': first, 'last': last}
    return player_names

def process_event_data(input_csv):
    """
    Parse 'retrosheet_event.csv' to find:
      - Errors (throwing T, fielding G, catching F) via the 'event' column
      - Putouts (po1..po9) and assists (a1..a9)
      - Defensive team from 'pitteam'
    
    Returns a nested dict:
      stats_by_player_team[(player_id, team)][position_label] = {
          'T': 0, 'G': 0, 'F': 0, 'PO': 0, 'A': 0
      }
    """
    stats_by_player_team = defaultdict(lambda: defaultdict(lambda: {
        'T': 0, 'G': 0, 'F': 0, 'PO': 0, 'A': 0
    }))

    with open(input_csv, mode='r', newline='') as f:
        reader = csv.DictReader(f)

        for row in reader:
            event_str = row['event']
            defensive_team = row.get('pitteam', 'UNKNOWN_TEAM')

            # 1) Identify errors in the event field
            matches_explicit = error_pattern_explicit.findall(event_str)      # E6/T, E3/G, etc.
            matches_parenthetical = error_pattern_parenthetical.findall(event_str)  # (E6), etc.

            # E#/(T|G|F)
            for (pos_str, err_type) in matches_explicit:
                pos_num = int(pos_str)
                f_col = f'f{pos_num}'  # e.g. 'f6' -> shortstop's ID
                player_id = row.get(f_col, 'UNKNOWN_ID')

                position_label = f'E{pos_str}'  # e.g. 'E6'
                stats_by_player_team[(player_id, defensive_team)][position_label][err_type] += 1

            # (E#) => default to 'G' (general fielding)
            for pos_str in matches_parenthetical:
                pos_num = int(pos_str)
                f_col = f'f{pos_num}'
                player_id = row.get(f_col, 'UNKNOWN_ID')

                position_label = f'E{pos_str}'
                stats_by_player_team[(player_id, defensive_team)][position_label]['G'] += 1

            # 2) Putouts & assists
            # For each position 1..9, if po{i} or a{i} are > 0, add them.
            for i in range(1, 10):
                f_col = f'f{i}'
                player_id = row.get(f_col, 'UNKNOWN_ID')
                if player_id == 'UNKNOWN_ID':
                    continue

                position_label = f'E{i}'
                po_val = row.get(f'po{i}', '0')
                a_val = row.get(f'a{i}', '0')

                try:
                    po_count = int(po_val)
                except ValueError:
                    po_count = 0

                try:
                    a_count = int(a_val)
                except ValueError:
                    a_count = 0

                if po_count or a_count:
                    stats_by_player_team[(player_id, defensive_team)][position_label]['PO'] += po_count
                    stats_by_player_team[(player_id, defensive_team)][position_label]['A'] += a_count

    return stats_by_player_team

def export_stats_to_csv(stats_by_player_team, player_names, output_csv):
    """
    Write a CSV with columns:
      playerid, first, last, team, position, T_error, G_error, F_error, putouts, assists
    """
    with open(output_csv, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([
            'Player ID', 'First', 'Last', 'Team',
            'position', 'Throw E', 'Field E', 'Catch E', 'PO', 'ASST'
        ])

        # stats_by_player_team is keyed by (player_id, team)
        for (pid, team), positions_dict in stats_by_player_team.items():
            # Look up first/last name from allplayers.csv data
            names = player_names.get(pid, {})
            first = names.get('first', '')
            last = names.get('last', '')

            for position_label, stat_dict in positions_dict.items():
                t_count = stat_dict['T']
                g_count = stat_dict['G']
                f_count = stat_dict['F']
                po_count = stat_dict['PO']
                a_count = stat_dict['A']

                writer.writerow([
                    pid,
                    first,
                    last,
                    team,
                    position_label,
                    t_count,
                    g_count,
                    f_count,
                    po_count,
                    a_count
                ])

def main():
    # 1) Load player names from allplayers.csv
    player_csv = '2024allplayers.csv'
    player_names = load_player_names(player_csv)

    # 2) Process the Retrosheet data from retrosheet_event.csv
    event_csv = '2024plays.csv'
    stats_by_player = process_event_data(event_csv)

    # 3) Export combined stats to error_summary.csv
    output_csv = 'error_summary.csv'
    export_stats_to_csv(stats_by_player, player_names, output_csv)
    print(f"Exported stats with names to {output_csv}")

if __name__ == "__main__":
    main()

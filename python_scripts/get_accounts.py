import json
import sys

accounts_file = sys.argv[1]

with open(accounts_file, 'r') as file:
    names = file.read().splitlines()
    
json_names = json.dumps(names)
print(json_names)
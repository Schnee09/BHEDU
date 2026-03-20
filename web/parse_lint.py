import json

with open('lint.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for file in data:
    for message in file.get('messages', []):
        if message.get('ruleId') == 'react/display-name':
            print(f"FILE: {file['filePath']}")
            print(f"LINE: {message['line']}")
            print(f"COLUMN: {message['column']}")
            print(f"MESSAGE: {message['message']}")
            print("-" * 20)

import json, re

# Load _tmp_items.json
tmp_path = r"C:\Users\steve\Downloads\idle-lineage-class-20260621-2200\_tmp_items.json"
with open(tmp_path, encoding="utf-8") as f:
    tmp_data = json.load(f)

# Load ITEM_DB from item_db.js
db_path = r"C:\Users\steve\Documents\chrome插件\fable5-save-editor\item_db.js"
with open(db_path, encoding="utf-8") as f:
    raw = f.read()
raw = raw.replace("\r\n", "\n")

# Find ITEM_DB = {
start = raw.find("ITEM_DB")
brace_pos = raw.find("{", start)
obj_start = brace_pos + 1

# Brace counting
brace = 0
obj_end = obj_start
for i in range(obj_start - 1, len(raw)):
    c = raw[i]
    if c == "{":
        brace += 1
    elif c == "}":
        brace -= 1
        if brace == 0:
            obj_end = i
            break

js_obj = raw[obj_start:obj_end]

# Parse entries
entries = re.findall(r'"(\w+)":\s*\{([^}]*)\}', js_obj)
print(f"ITEM_DB entries: {len(entries)}")

ITEM_STATS = {}
missing_stats = []
missing_db = []

for key, fields_str in entries:
    # Parse fields
    fields = {}
    for m in re.finditer(r'(\w+):\s*("[^"]*"|\d+\.?\d*|\w+)', fields_str):
        k, v = m.group(1), m.group(2)
        if v.startswith('"'):
            fields[k] = v[1:-1]
        elif v == 'true':
            fields[k] = True
        elif v == 'false':
            fields[k] = False
        elif '.' in v:
            fields[k] = float(v)
        else:
            try:
                fields[k] = int(v)
            except:
                fields[k] = v

    # Merge: stats from _tmp_items, names from ITEM_DB
    stats = tmp_data.get(key, {})
    merged = dict(stats)
    merged.update(fields)
    ITEM_STATS[key] = merged

    if not stats and key.startswith(("wpn_", "arm_", "acc_")):
        missing_stats.append(key)

print(f"Total ITEM_STATS: {len(ITEM_STATS)}")
print(f"Items in _tmp_items: {len(tmp_data)}")
print(f"Missing stats (in ITEM_DB but not _tmp_items): {len(missing_stats)}")
print(f"Sample missing: {missing_stats[:5]}")

# Show samples
print("\n=== Sample ITEM_STATS (Chinese names confirmed) ===")
for k in ["wpn_10", "wpn_11", "wpn_12", "wpn_2hsword", "arm_100", "arm_101", "acc_116", "acc_117"]:
    if k in ITEM_STATS:
        s = ITEM_STATS[k]
        readable = {kk: vv for kk, vv in s.items() if kk in (
            "n","t","c","legend","dmgS","dmgL","hit","spd","ac","mmp","mpR",
            "str","dex","int","con","wis","cha","req","slot","w2h","eff","p"
        )}
        print(f"  {k}: {readable}")

# Save ITEM_STATS to JS file
output = "const ITEM_STATS = " + json.dumps(ITEM_STATS, ensure_ascii=False, indent=2) + ";"
out_path = r"C:\Users\steve\Documents\chrome插件\fable5-save-editor\item_stats.js"
with open(out_path, "w", encoding="utf-8") as f:
    f.write(output)
print(f"\nSaved to {out_path} ({len(output)} bytes)")

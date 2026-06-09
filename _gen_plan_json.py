"""
Forge plan JSON generator.
Reads all tabs from the Excel training plan and writes:
  data/wod.json           — Daily Plan (one entry per session row)
  data/templates.json     — Workout Details (3 templates: A, B, C)
  data/weekly_summary.json — Weekly Summary

Usage: python _gen_plan_json.py
"""
import sys, re, json, openpyxl
from datetime import datetime, date

sys.stdout.reconfigure(encoding='utf-8')
XLSX = r"C:\Users\maxgr\OneDrive\Documents\Fitness\21km Race Plan 2026.xlsx"
OUT  = r"C:\Users\maxgr\OneDrive\Documents\Projects\sport_app\data"

wb = openpyxl.load_workbook(XLSX, data_only=True)

# ── helpers ───────────────────────────────────────────────────────────────────

def to_str(v):
    return str(v).strip() if v is not None else None

def to_int(v):
    try: return int(float(v))
    except: return None

def to_float(v):
    try: return float(v)
    except: return None

def parse_date(v):
    if v is None: return None
    if isinstance(v, (datetime, date)): return v.strftime('%Y-%m-%d')
    s = str(v).strip()
    try: return datetime.strptime(s, '%Y-%m-%d').strftime('%Y-%m-%d')
    except: return s

def is_key(v):
    return str(v).strip().lower() in ('yes','y','true','1') if v else False

def clean_muscles(raw):
    """'Glutes (max), Hip Flexors (iliopsoas)' → ['Glutes','Hip Flexors']"""
    if not raw: return []
    parts = [p.strip() for p in str(raw).split(',')]
    cleaned = []
    for p in parts:
        p = re.sub(r'\s*\(.*?\)', '', p).strip()
        if p and p != '—':
            cleaned.append(p)
    return cleaned

def clean_exercise_name(raw):
    if not raw: return None
    name = re.sub(r'\s*[⭐✕]\s*', '', str(raw)).strip()
    name = re.sub(r'\s*—\s*(REMOVED|removed).*$', '', name).strip()
    return name or None

def parse_sets_reps(raw):
    """
    '3 × 10'           → sets=3, reps=10,   mode='reps'
    '3 × 10 each'      → sets=3, reps=10,   mode='reps'
    '4 × max'          → sets=4, reps=None, mode='reps'
    '3 × 20→45 sec'    → sets=3, reps=45,   mode='seconds'
    '90 sec each'      → sets=1, reps=90,   mode='seconds'
    '10 breaths'       → sets=1, reps=10,   mode='reps'
    '3 × 30m each'     → sets=3, reps=30,   mode='reps'
    '2 × 8 each'       → sets=2, reps=8,    mode='reps'
    '3 × 15 steps each'→ sets=3, reps=15,   mode='reps'
    '90 sec right side'→ sets=1, reps=90,   mode='seconds'
    """
    if not raw: return None, None, 'reps'
    s = str(raw).strip()
    mode = 'seconds' if re.search(r'\bsec\b', s, re.I) else 'reps'

    # "N × ..." form
    m = re.match(r'(\d+)\s*[×x]\s*(.*)', s)
    if m:
        sets = int(m.group(1))
        rest = m.group(2).strip()
        # extract last number from rest (handles "20→45", "15 steps", "30m", "max")
        nums = re.findall(r'\d+', rest)
        reps = int(nums[-1]) if nums else None
        return sets, reps, mode

    # bare "N sec ..." or "N breaths"
    m = re.match(r'(\d+)\s*(sec|breaths)', s, re.I)
    if m:
        return 1, int(m.group(1)), mode

    return 1, None, mode

# ── Daily Plan ────────────────────────────────────────────────────────────────

ws = wb['Daily Plan']
rows = list(ws.iter_rows(values_only=True))

# find header row
hdr_idx = next(i for i,r in enumerate(rows) if r[0] == 'Date')
col = {h:i for i,h in enumerate(rows[hdr_idx]) if h}

wod_list = []
for row in rows[hdr_idx+1:]:
    if not any(row): continue
    d = parse_date(row[col['Date']])
    if not d: continue
    st = to_str(row[col.get('Session Type',5)]) or 'Rest'
    sn = to_str(row[col.get('Session',6)]) or ''
    notes = to_str(row[col.get('Notes',12)])
    wod_list.append({
        "date":        d,
        "week":        to_int(row[col.get('Week',1)]),
        "phase":       to_str(row[col.get('Phase',2)]),
        "sessionNum":  to_int(row[col.get('#',4)]),
        "sessionType": st,
        "session":     sn,
        "distanceKm":  to_float(row[col.get('Distance (KM)',7)]),
        "durationMin": to_int(row[col.get('Duration (Min)',8)]),
        "durationMax": to_int(row[col.get('Duration (Max)',9)]),
        "intensity":   to_str(row[col.get('Intensity',10)]),
        "keySession":  is_key(row[col.get('Key Session',11)]),
        "notes":       notes,
        "routineName": sn if st in ('Strength+Mobility','Strength') else None
    })

with open(f'{OUT}/wod.json','w',encoding='utf-8') as f:
    json.dump(wod_list, f, indent=2, ensure_ascii=False)
print(f'wod.json: {len(wod_list)} entries')

# ── Weekly Summary ────────────────────────────────────────────────────────────

ws = wb['Weekly Summary']
rows = list(ws.iter_rows(values_only=True))
hdr_idx = next(i for i,r in enumerate(rows) if r[0] == 'Week')
col = {h:i for i,h in enumerate(rows[hdr_idx]) if h}

weekly = []
for row in rows[hdr_idx+1:]:
    if not any(row): continue
    wk_raw = to_str(row[col.get('Week',0)])
    if not wk_raw: continue
    m = re.search(r'\d+', wk_raw)
    wk_num = int(m.group()) if m else None
    def dash_to_none(v):
        s = to_str(v)
        return None if s in (None,'—','-') else s
    weekly.append({
        "week":           wk_num,
        "weekLabel":      wk_raw,
        "phase":          to_str(row[col.get('Phase',1)]),
        "totalRunKm":     to_float(row[col.get('Total Run KM',2)]),
        "keySessions":    to_int(row[col.get('Key Sessions',3)]),
        "longRunKm":      to_float(row[col.get('Long Run KM',4)]),
        "kmTarget":       to_float(row[col.get('KM Target',5)]),
        "qualitySession": dash_to_none(row[col.get('Quality Session',6)]),
        "weeklyFocus":    to_str(row[col.get('Weekly Focus',7)])
    })

with open(f'{OUT}/weekly_summary.json','w',encoding='utf-8') as f:
    json.dump(weekly, f, indent=2, ensure_ascii=False)
print(f'weekly_summary.json: {len(weekly)} weeks')

# ── Workout Details ───────────────────────────────────────────────────────────

ws = wb['Workout Details']
rows = list(ws.iter_rows(values_only=True))

templates = []
current_template = None
in_morning_routine = False

for row in rows:
    a = to_str(row[0])
    b = to_str(row[1])
    if not a: continue

    # detect Morning Routine section — skip until end
    if '☀️' in a or 'MORNING ROUTINE' in a.upper():
        in_morning_routine = True
    if in_morning_routine:
        continue

    # detect workout header: "WORKOUT A — ..." (single letter after WORKOUT)
    if re.match(r'WORKOUT\s+[A-Z]\s*[—–-]', a, re.I) and not b:
        name = re.split(r'\s*\|\s*', a)[0].strip()
        current_template = {"templateName": name, "exercises": []}
        templates.append(current_template)
        continue

    # skip column-header rows
    if a == 'Exercise':
        continue

    # skip section dividers (── text ──) and footnote rows (⭐ =)
    if a.startswith('──') or a.startswith('⭐ =') or a.startswith('✕ ') or (len(a) > 2 and a[0] == '✕'):
        continue

    # skip removed exercises
    if a.startswith('✕') or '— REMOVED' in a:
        continue

    # must have a Sets×Reps value to be an exercise row
    if not b or current_template is None:
        continue

    sets, reps, mode = parse_sets_reps(b)
    primary   = clean_muscles(row[3])
    secondary = clean_muscles(row[4])
    note      = to_str(row[5])
    ex_name   = clean_exercise_name(a)
    if not ex_name:
        continue

    current_template["exercises"].append({
        "name":           ex_name,
        "sets":           sets,
        "reps":           reps,
        "metricMode":     mode,
        "primaryMuscles": primary,
        "secondaryMuscles": secondary,
        "note":           note
    })

with open(f'{OUT}/templates.json','w',encoding='utf-8') as f:
    json.dump(templates, f, indent=2, ensure_ascii=False)
print(f'templates.json: {len(templates)} templates')
for t in templates:
    print(f'  • {t["templateName"]} — {len(t["exercises"])} exercises')

import firebirdsql
import json
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

conn = firebirdsql.connect(
    host='localhost',
    database=r'C:\Users\vladimir\source\DB\Export\MEDICAL.FDB',
    user='SYSDBA',
    password='masterkey',
    charset='WIN1251'
)
cur = conn.cursor()

# Inspect sample patient row
cur.execute("SELECT FIRST 3 * FROM PATIENTS")
col_names = [desc[0] for desc in cur.description]
rows = cur.fetchall()
sample_patients = []
for r in rows:
    p_dict = {}
    for k, v in zip(col_names, r):
        if hasattr(v, 'isoformat'):
            p_dict[k] = v.isoformat()
        elif isinstance(v, bytes):
            p_dict[k] = v.decode('cp1251', errors='replace')
        else:
            p_dict[k] = v
    sample_patients.append(p_dict)

print("Sample Patients (first 2):")
print(json.dumps(sample_patients[:2], ensure_ascii=False, indent=2))

# Inspect VISITS columns
cur.execute("SELECT FIRST 1 * FROM VISITS")
vis_cols = [desc[0] for desc in cur.description]
print("\nVISITS columns:", vis_cols)

# Inspect DMSCARDS columns
cur.execute("SELECT FIRST 1 * FROM DMSCARDS")
dms_cols = [desc[0] for desc in cur.description]
print("\nDMSCARDS columns:", dms_cols)

# Inspect CHANNELS columns
cur.execute("SELECT * FROM CHANNELS")
ch_cols = [desc[0] for desc in cur.description]
ch_rows = cur.fetchall()
print(f"\nCHANNELS ({len(ch_rows)} rows):")
for r in ch_rows:
    print(" ", dict(zip(ch_cols, r)))

# Inspect CONTRACTS columns
cur.execute("SELECT FIRST 1 * FROM CONTRACTS")
con_cols = [desc[0] for desc in cur.description]
print("\nCONTRACTS columns:", con_cols)

# Inspect DIAGNOSES columns
cur.execute("SELECT FIRST 1 * FROM DIAGNOSES")
diag_cols = [desc[0] for desc in cur.description]
print("\nDIAGNOSES columns:", diag_cols)

conn.close()

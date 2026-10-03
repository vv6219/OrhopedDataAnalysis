import firebirdsql
import sqlite3
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("Connecting to Firebird...")
fb_conn = firebirdsql.connect(
    host='localhost',
    database=r'C:\Users\vladimir\source\DB\Export\MEDICAL.FDB',
    user='SYSDBA',
    password='masterkey',
    charset='WIN1251'
)
fb_cur = fb_conn.cursor()

# 1. Channels
fb_cur.execute("SELECT ID, NAME FROM CHANNELS")
channels_dict = {row[0]: row[1].strip() if row[1] else '' for row in fb_cur.fetchall()}
print(f"Loaded {len(channels_dict)} channels")

# 2. Insurers
fb_cur.execute("SELECT ID, NAME FROM INSURERS")
insurers_dict = {row[0]: row[1].strip() if row[1] else '' for row in fb_cur.fetchall()}
print(f"Loaded {len(insurers_dict)} insurers")

# 3. DMS Cards (group by PT_ID, pick latest or active)
fb_cur.execute("SELECT PT_ID, POLICY, IN_ID, LIMIT, REST FROM DMSCARDS ORDER BY ID DESC")
dms_dict = {}
for pt_id, policy, in_id, limit_val, rest_val in fb_cur.fetchall():
    if pt_id not in dms_dict:
        ins_name = insurers_dict.get(in_id, '')
        dms_dict[pt_id] = {
            'policy': policy.strip() if policy else '',
            'insurer': ins_name
        }
print(f"Loaded {len(dms_dict)} patient DMS card references")

# 4. Visit aggregates (last visit date, count of visits per patient)
t0 = time.time()
print("Aggregating patient visits from Firebird...")
fb_cur.execute("""
    SELECT PT_ID, MAX(VDATE), COUNT(*) 
    FROM VISITS 
    WHERE PT_ID IS NOT NULL 
    GROUP BY PT_ID
""")
visit_aggs = {}
for pt_id, max_vdate, vcnt in fb_cur.fetchall():
    visit_aggs[pt_id] = {
        'last_visit': max_vdate.isoformat() if max_vdate else '',
        'total_visits': vcnt
    }
print(f"Aggregated visits for {len(visit_aggs)} patients in {time.time() - t0:.2f}s")

# 5. Test reading first 1000 patients
t0 = time.time()
fb_cur.execute("SELECT FIRST 1000 * FROM PATIENTS")
sample_p = fb_cur.fetchall()
print(f"Fetched 1000 patients in {time.time() - t0:.2f}s")

fb_conn.close()
print("Firebird inspection completed successfully.")

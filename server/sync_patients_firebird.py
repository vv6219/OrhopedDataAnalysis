import firebirdsql
import sqlite3
import os
import time
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

# Dynamically load parameters from appsettings.json
config_file = os.path.join(os.path.dirname(__file__), 'appsettings.json')
appsettings = {}
if os.path.exists(config_file):
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            appsettings = json.load(f)
    except Exception as e:
        print(f"Warning: Failed to load appsettings.json ({e}), using default fallback parameters.", file=sys.stderr)

fb_cfg = appsettings.get('ConnectionStrings', {}).get('Firebird', {})
sqlite_cfg = appsettings.get('ConnectionStrings', {}).get('SQLite', {})

DEFAULT_FB_HOST = fb_cfg.get('Host', 'localhost')
DEFAULT_FB_PORT = fb_cfg.get('Port', 3050)
DEFAULT_FB_PATH = fb_cfg.get('DatabasePath', r'C:\Users\vladimir\source\DB\Export\MEDICAL.FDB')
DEFAULT_FB_USER = fb_cfg.get('User', 'SYSDBA')
DEFAULT_FB_PASS = fb_cfg.get('Password', 'masterkey')
DEFAULT_FB_CHARSET = fb_cfg.get('Charset', 'WIN1251')

sqlite_db_setting = sqlite_cfg.get('DatabasePath', '../db/orthopedic_data_center.sqlite')
if os.path.isabs(sqlite_db_setting):
    DEFAULT_SQLITE_PATH = sqlite_db_setting
else:
    DEFAULT_SQLITE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), sqlite_db_setting))

# Handle test connection mode
if len(sys.argv) > 1 and sys.argv[1] == '--test':
    test_db = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != 'DEFAULT' else DEFAULT_FB_PATH
    test_user = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != 'DEFAULT' else DEFAULT_FB_USER
    test_pass = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] != 'DEFAULT' else DEFAULT_FB_PASS
    test_host = sys.argv[5] if len(sys.argv) > 5 else DEFAULT_FB_HOST
    test_port = int(sys.argv[6]) if len(sys.argv) > 6 else int(DEFAULT_FB_PORT)
    test_charset = sys.argv[7] if len(sys.argv) > 7 else DEFAULT_FB_CHARSET
    try:
        conn = firebirdsql.connect(
            host=test_host,
            port=test_port,
            database=test_db,
            user=test_user,
            password=test_pass,
            charset=test_charset
        )
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM PATIENTS")
        p_cnt = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM VISITS")
        v_cnt = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM CONTRACTS")
        c_cnt = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM CHANNELS")
        ch_cnt = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM INSURERS")
        ins_cnt = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM DMSCARDS")
        dms_cnt = cur.fetchone()[0]
        conn.close()
        print(json.dumps({
            "success": True,
            "host": test_host,
            "port": test_port,
            "database": test_db,
            "charset": test_charset,
            "patients": p_cnt,
            "visits": v_cnt,
            "contracts": c_cnt,
            "channels": ch_cnt,
            "insurers": ins_cnt,
            "dms_cards": dms_cnt
        }))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

FB_PATH = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] != 'DEFAULT' else DEFAULT_FB_PATH
FB_USER = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != 'DEFAULT' else DEFAULT_FB_USER
FB_PASS = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != 'DEFAULT' else DEFAULT_FB_PASS
FB_HOST = sys.argv[4] if len(sys.argv) > 4 else DEFAULT_FB_HOST
FB_PORT = int(sys.argv[5]) if len(sys.argv) > 5 else int(DEFAULT_FB_PORT)
FB_CHARSET = sys.argv[6] if len(sys.argv) > 6 else DEFAULT_FB_CHARSET
SQLITE_PATH = sys.argv[7] if len(sys.argv) > 7 else DEFAULT_SQLITE_PATH

print(f"=== Starting Full Patients Sync from Firebird ===")
print(f"Firebird Source: {FB_HOST}:{FB_PORT}/{FB_PATH} (user: {FB_USER}, charset: {FB_CHARSET})")
print(f"SQLite Target:   {SQLITE_PATH}")

t_start = time.time()

# 1. Connect to Firebird
fb_conn = firebirdsql.connect(
    host=FB_HOST,
    port=FB_PORT,
    database=FB_PATH,
    user=FB_USER,
    password=FB_PASS,
    charset=FB_CHARSET
)
fb_cur = fb_conn.cursor()

# 2. Connect to SQLite
sqlite_conn = sqlite3.connect(SQLITE_PATH)
sqlite_cur = sqlite_conn.cursor()

# Enable WAL mode and synchronous normal for high performance
journal_mode = sqlite_cfg.get('JournalMode', 'WAL')
synchronous = sqlite_cfg.get('Synchronous', 'NORMAL')
sqlite_cur.execute(f"PRAGMA journal_mode = {journal_mode};")
sqlite_cur.execute(f"PRAGMA synchronous = {synchronous};")

# -------------------------------------------------------------
# 3. Create / Sync CHANNELS Table
# -------------------------------------------------------------
print("\n[1/5] Syncing CHANNELS...")
sqlite_cur.execute("""
CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    moduser TEXT,
    moddate TEXT
);
""")
sqlite_cur.execute("DELETE FROM channels;")

fb_cur.execute("SELECT ID, NAME, MODUSER, MODDATE FROM CHANNELS")
channels_rows = []
channels_map = {}
for r in fb_cur.fetchall():
    cid = r[0]
    cname = r[1].strip() if r[1] else ''
    muser = r[2].strip() if r[2] else ''
    mdate = r[3].isoformat() if r[3] else None
    channels_rows.append((cid, cname, muser, mdate))
    channels_map[cid] = cname

sqlite_cur.executemany("INSERT INTO channels (id, name, moduser, moddate) VALUES (?, ?, ?, ?)", channels_rows)
print(f"  -> Imported {len(channels_rows)} channels")

# -------------------------------------------------------------
# 4. Create / Sync INSURERS Table
# -------------------------------------------------------------
print("\n[2/5] Syncing INSURERS...")
sqlite_cur.execute("""
CREATE TABLE IF NOT EXISTS insurers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    briefly TEXT,
    moduser TEXT,
    moddate TEXT
);
""")
sqlite_cur.execute("DELETE FROM insurers;")

fb_cur.execute("SELECT ID, NAME, BRIEFLY, MODUSER, MODDATE FROM INSURERS")
insurers_rows = []
insurers_map = {}
for r in fb_cur.fetchall():
    iid = r[0]
    iname = r[1].strip() if r[1] else ''
    ibrief = r[2].strip() if r[2] else ''
    muser = r[3].strip() if r[3] else ''
    mdate = r[4].isoformat() if r[4] else None
    insurers_rows.append((iid, iname, ibrief, muser, mdate))
    insurers_map[iid] = iname

sqlite_cur.executemany("INSERT INTO insurers (id, name, briefly, moduser, moddate) VALUES (?, ?, ?, ?, ?)", insurers_rows)
print(f"  -> Imported {len(insurers_rows)} insurers")

# -------------------------------------------------------------
# 5. Create / Sync DMSCARDS Table
# -------------------------------------------------------------
print("\n[3/5] Syncing DMSCARDS...")
sqlite_cur.execute("""
CREATE TABLE IF NOT EXISTS dms_cards (
    id INTEGER PRIMARY KEY,
    patient_id INTEGER,
    referral TEXT,
    reg_date TEXT,
    policy TEXT,
    insurer_id INTEGER,
    insurer_name TEXT,
    limit_amount REAL,
    accrued REAL,
    rest_amount REAL,
    barcode TEXT,
    moduser TEXT,
    moddate TEXT,
    FOREIGN KEY(patient_id) REFERENCES patients(id)
);
""")
sqlite_cur.execute("DELETE FROM dms_cards;")

fb_cur.execute("SELECT ID, PT_ID, REFERRAL, RDATE, POLICY, IN_ID, LIMIT, ACCRUED, REST, BARCODE, MODUSER, MODDATE FROM DMSCARDS")
dms_rows = []
dms_patient_map = {}
for r in fb_cur.fetchall():
    did = r[0]
    ptid = r[1]
    ref = r[2].strip() if r[2] else ''
    rdate = r[3].isoformat() if r[3] else None
    pol = r[4].strip() if r[4] else ''
    in_id = r[5]
    in_name = insurers_map.get(in_id, '')
    limit_val = float(r[6] or 0)
    accr_val = float(r[7] or 0)
    rest_val = float(r[8] or 0)
    bcode = r[9].strip() if r[9] else ''
    muser = r[10].strip() if r[10] else ''
    mdate = r[11].isoformat() if r[11] else None
    dms_rows.append((did, ptid, ref, rdate, pol, in_id, in_name, limit_val, accr_val, rest_val, bcode, muser, mdate))
    
    if ptid and ptid not in dms_patient_map:
        dms_patient_map[ptid] = {
            'policy': pol,
            'insurer': in_name
        }

sqlite_cur.executemany("""
INSERT INTO dms_cards (id, patient_id, referral, reg_date, policy, insurer_id, insurer_name, limit_amount, accrued, rest_amount, barcode, moduser, moddate)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", dms_rows)
print(f"  -> Imported {len(dms_rows)} DMS cards")

# -------------------------------------------------------------
# 6. Create / Sync PATIENT_VISITS Table & Aggregations
# -------------------------------------------------------------
print("\n[4/5] Syncing PATIENT_VISITS & computing aggregates...")
sqlite_cur.execute("""
CREATE TABLE IF NOT EXISTS patient_visits (
    id INTEGER PRIMARY KEY,
    patient_id INTEGER,
    docn INTEGER,
    visit_date TEXT,
    visit_time INTEGER,
    visit_time_s TEXT,
    remark TEXT,
    moduser TEXT,
    moddate TEXT
);
""")
sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_pv_pt_id ON patient_visits(patient_id);")
sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_pv_vdate ON patient_visits(visit_date);")
sqlite_cur.execute("DELETE FROM patient_visits;")

fb_cur.execute("SELECT ID, PT_ID, DOCN, VDATE, VTIME, VTIME_S, REMARK, MODUSER, MODDATE FROM VISITS")
visits_rows = []
visit_aggregates = {}
for r in fb_cur.fetchall():
    vid = r[0]
    ptid = r[1]
    docn = r[2]
    vdate_str = r[3].isoformat() if r[3] else None
    vtime = r[4]
    vtime_s = r[5].strip() if r[5] else ''
    rem = r[6].strip() if r[6] else ''
    muser = r[7].strip() if r[7] else ''
    mdate = r[8].isoformat() if r[8] else None
    visits_rows.append((vid, ptid, docn, vdate_str, vtime, vtime_s, rem, muser, mdate))

    if ptid:
        if ptid not in visit_aggregates:
            visit_aggregates[ptid] = {'last_date': vdate_str, 'count': 1}
        else:
            visit_aggregates[ptid]['count'] += 1
            if vdate_str and (not visit_aggregates[ptid]['last_date'] or vdate_str > visit_aggregates[ptid]['last_date']):
                visit_aggregates[ptid]['last_date'] = vdate_str

sqlite_cur.executemany("""
INSERT INTO patient_visits (id, patient_id, docn, visit_date, visit_time, visit_time_s, remark, moduser, moddate)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
""", visits_rows)
print(f"  -> Imported {len(visits_rows)} patient visits (aggregated {len(visit_aggregates)} patients)")

# Also aggregate contracts (financial total spent by patient)
print("  -> Aggregating patient contract spend...")
fb_cur.execute("SELECT PT_ID, SUM(ACCRUED) FROM CONTRACTS WHERE PT_ID IS NOT NULL GROUP BY PT_ID")
contract_aggregates = {row[0]: float(row[1] or 0) for row in fb_cur.fetchall()}
print(f"  -> Aggregated financial spend for {len(contract_aggregates)} patients")

# -------------------------------------------------------------
# 7. Create Enhanced PATIENTS Table & Import 61,298 Rows
# -------------------------------------------------------------
print("\n[5/5] Re-creating enhanced PATIENTS table and importing 61,298 records...")
sqlite_cur.execute("DROP TABLE IF EXISTS patients;")
sqlite_cur.execute("""
CREATE TABLE patients (
    id INTEGER PRIMARY KEY,
    surname TEXT,
    name TEXT,
    patron TEXT,
    full_name TEXT,
    brief_name TEXT,
    sex INTEGER,
    sex_display TEXT,
    bdate TEXT,
    age INTEGER,
    weight REAL,
    height REAL,
    phone TEXT,
    phones TEXT,
    sphone TEXT,
    email TEXT,
    address TEXT,
    subject TEXT,
    region TEXT,
    city TEXT,
    area TEXT,
    street TEXT,
    house TEXT,
    flat TEXT,
    pseries TEXT,
    pnumber TEXT,
    pdate TEXT,
    pauthor TEXT,
    parent TEXT,
    mednum INTEGER,
    dms_flag INTEGER DEFAULT 0,
    dms_policy TEXT,
    dms_insurer TEXT,
    ignor_flag INTEGER DEFAULT 0,
    unch_flag INTEGER DEFAULT 0,
    ch_id INTEGER,
    channel_name TEXT,
    rdate TEXT,
    last_visit_date TEXT,
    total_visits INTEGER DEFAULT 0,
    total_spent REAL DEFAULT 0,
    moduser TEXT,
    moddate TEXT,
    
    -- Backward compatibility fields
    first_name TEXT,
    last_name TEXT,
    contact_phone TEXT,
    date_of_birth TEXT,
    medical_history_notes TEXT,
    firstName TEXT,
    lastName TEXT,
    contact TEXT,
    lastVisit TEXT
);
""")

# Create performance indexes
sqlite_cur.execute("CREATE INDEX idx_patients_surname ON patients(surname);")
sqlite_cur.execute("CREATE INDEX idx_patients_fname ON patients(full_name);")
sqlite_cur.execute("CREATE INDEX idx_patients_phone ON patients(phone);")
sqlite_cur.execute("CREATE INDEX idx_patients_sphone ON patients(sphone);")
sqlite_cur.execute("CREATE INDEX idx_patients_mednum ON patients(mednum);")
sqlite_cur.execute("CREATE INDEX idx_patients_bdate ON patients(bdate);")
sqlite_cur.execute("CREATE INDEX idx_patients_rdate ON patients(rdate);")
sqlite_cur.execute("CREATE INDEX idx_patients_last_visit ON patients(last_visit_date);")

# Read all 61,298 patients from Firebird
fb_cur.execute("""
SELECT 
    ID, SURNAME, NAME, PATRON, SEX, BDATE, WEIGHT, HEIGHT,
    PHONE, PHONES, ADDR, PSERIES, PNUMBER, PDATE, PAUTHOR,
    UNCH_F, PARENT, MEDNUM, DMS_F, MAIL, IGNOR_F, AGE,
    MODUSER, MODDATE, BNAME, FNAME, SPHONE, SUBJECT, REGION,
    CITY, AREA, STREET, HOUSE, FLAT, CH_ID, RDATE, ADDRESS
FROM PATIENTS
ORDER BY ID
""")

patients_batch = []
count = 0
t_batch = time.time()

for row in fb_cur.fetchall():
    pid = row[0]
    surname = (row[1] or '').strip()
    pname = (row[2] or '').strip()
    patron = (row[3] or '').strip()
    sex = int(row[4] or 0)
    sex_disp = 'М' if sex == 1 else ('Ж' if sex == 2 else '')
    bdate_str = row[5].isoformat() if row[5] else None
    weight = float(row[6] or 0)
    height = float(row[7] or 0)
    phone = (row[8] or '').strip()
    phones = (row[9] or '').strip()
    addr = (row[10] or '').strip()
    pseries = (row[11] or '').strip()
    pnumber = (row[12] or '').strip()
    pdate_str = row[13].isoformat() if row[13] else None
    pauthor = (row[14] or '').strip()
    unch_f = int(row[15] or 0)
    parent = (row[16] or '').strip()
    mednum = int(row[17] or 0)
    dms_f = int(row[18] or 0)
    mail = (row[19] or '').strip()
    ignor_f = int(row[20] or 0)
    age = int(row[21] or 0)
    muser = (row[22] or '').strip()
    mdate_str = row[23].isoformat() if row[23] else None
    bname = (row[24] or '').strip()
    fname = (row[25] or '').strip()
    sphone = (row[26] or '').strip()
    subject = (row[27] or '').strip()
    region = (row[28] or '').strip()
    city = (row[29] or '').strip()
    area = (row[30] or '').strip()
    street = (row[31] or '').strip()
    house = (row[32] or '').strip()
    flat = (row[33] or '').strip()
    ch_id = row[34]
    ch_name = channels_map.get(ch_id, '')
    rdate_str = row[35].isoformat() if row[35] else None
    full_address = (row[36] or addr or '').strip()

    # Full name fallback
    if not fname:
        fname = f"{surname} {pname} {patron}".strip()
    if not bname:
        bname = f"{surname} {pname[:1]}. {patron[:1]}.".strip() if pname else surname

    # Aggregated details from DMS, VISITS, CONTRACTS
    dms_info = dms_patient_map.get(pid, {})
    dms_pol = dms_info.get('policy', '')
    dms_ins = dms_info.get('insurer', '')
    if dms_pol or dms_ins:
        dms_f = 1

    vis_info = visit_aggregates.get(pid, {})
    last_visit = vis_info.get('last_date', None)
    tot_visits = vis_info.get('count', 0)
    tot_spent = contract_aggregates.get(pid, 0.0)

    # Display phone fallback
    contact_phone = sphone if sphone else phone

    # Tuple for insertion
    patients_batch.append((
        pid, surname, pname, patron, fname, bname,
        sex, sex_disp, bdate_str, age, weight, height,
        phone, phones, sphone, mail, full_address,
        subject, region, city, area, street, house, flat,
        pseries, pnumber, pdate_str, pauthor, parent,
        mednum, dms_f, dms_pol, dms_ins, ignor_f, unch_f,
        ch_id, ch_name, rdate_str, last_visit, tot_visits, tot_spent,
        muser, mdate_str,
        # Compatibility columns
        pname, surname, contact_phone, bdate_str, f"ЭМК №{mednum}. Канал: {ch_name or 'Н/Д'}",
        pname, surname, contact_phone, last_visit or rdate_str or ''
    ))

    count += 1
    if len(patients_batch) >= 5000:
        sqlite_cur.executemany("""
        INSERT INTO patients (
            id, surname, name, patron, full_name, brief_name,
            sex, sex_display, bdate, age, weight, height,
            phone, phones, sphone, email, address,
            subject, region, city, area, street, house, flat,
            pseries, pnumber, pdate, pauthor, parent,
            mednum, dms_flag, dms_policy, dms_insurer, ignor_flag, unch_flag,
            ch_id, channel_name, rdate, last_visit_date, total_visits, total_spent,
            moduser, moddate,
            first_name, last_name, contact_phone, date_of_birth, medical_history_notes,
            firstName, lastName, contact, lastVisit
        ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?
        )
        """, patients_batch)
        sqlite_conn.commit()
        patients_batch = []
        print(f"  -> Imported {count} patients ({time.time() - t_batch:.2f}s)...")
        t_batch = time.time()

# Insert remainder
if patients_batch:
    sqlite_cur.executemany("""
    INSERT INTO patients (
        id, surname, name, patron, full_name, brief_name,
        sex, sex_display, bdate, age, weight, height,
        phone, phones, sphone, email, address,
        subject, region, city, area, street, house, flat,
        pseries, pnumber, pdate, pauthor, parent,
        mednum, dms_flag, dms_policy, dms_insurer, ignor_flag, unch_flag,
        ch_id, channel_name, rdate, last_visit_date, total_visits, total_spent,
        moduser, moddate,
        first_name, last_name, contact_phone, date_of_birth, medical_history_notes,
        firstName, lastName, contact, lastVisit
    ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?
    )
    """, patients_batch)
    sqlite_conn.commit()

# Close connections
fb_conn.close()
sqlite_conn.close()

t_total = time.time() - t_start
print(f"\n[SUCCESS] Imported {count} patients into SQLite in {t_total:.2f} seconds!")

import firebirdsql
import sqlite3
import os
import time
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

# -------------------------------------------------------------
# Configuration Loader
# -------------------------------------------------------------
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

# -------------------------------------------------------------
# Handle Test Connection Mode (--test)
# -------------------------------------------------------------
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

        tables_to_count = [
            'PATIENTS', 'VISITS', 'CONTRACTS', 'CHANNELS', 'INSURERS', 'DMSCARDS',
            'PROTDICT', 'PROTOCOLS', 'PROTSHOTS', 'MKB', 'DIAGNOSES',
            'LABDICT', 'LABPDF', 'LABPLAN', 'SERVDICT', 'SERVICES', 'SERVPRICES',
            'SERVPLAN', 'DISCOUNTS', 'SCHEDULE', 'TEMPLATES'
        ]
        counts = {}
        for t in tables_to_count:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {t}")
                counts[t.lower()] = cur.fetchone()[0]
            except Exception:
                counts[t.lower()] = 0

        conn.close()

        result = {
            "success": True,
            "host": test_host,
            "port": test_port,
            "database": test_db,
            "charset": test_charset,
            # Backward-compatible fields
            "patients": counts.get("patients", 0),
            "visits": counts.get("visits", 0),
            "contracts": counts.get("contracts", 0),
            "channels": counts.get("channels", 0),
            "insurers": counts.get("insurers", 0),
            "dms_cards": counts.get("dmscards", 0),
            "dmscards": counts.get("dmscards", 0),
            # New requested and related tables
            "protdict": counts.get("protdict", 0),
            "protocols": counts.get("protocols", 0),
            "protshots": counts.get("protshots", 0),
            "mkb": counts.get("mkb", 0),
            "diagnoses": counts.get("diagnoses", 0),
            "labdict": counts.get("labdict", 0),
            "labpdf": counts.get("labpdf", 0),
            "labplan": counts.get("labplan", 0),
            "servdict": counts.get("servdict", 0),
            "services": counts.get("services", 0),
            "servprices": counts.get("servprices", 0),
            "servplan": counts.get("servplan", 0),
            "discounts": counts.get("discounts", 0),
            "schedule": counts.get("schedule", 0),
            "templates": counts.get("templates", 0)
        }
        print(json.dumps(result))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

# -------------------------------------------------------------
# Parse CLI Arguments
# -------------------------------------------------------------
def get_arg_val(idx, default):
    if len(sys.argv) > idx:
        val = sys.argv[idx]
        if val != 'DEFAULT' and not val.startswith('--'):
            return val
    return default

FB_PATH = get_arg_val(1, DEFAULT_FB_PATH)
FB_USER = get_arg_val(2, DEFAULT_FB_USER)
FB_PASS = get_arg_val(3, DEFAULT_FB_PASS)
FB_HOST = get_arg_val(4, DEFAULT_FB_HOST)
FB_PORT = int(get_arg_val(5, DEFAULT_FB_PORT))
FB_CHARSET = get_arg_val(6, DEFAULT_FB_CHARSET)
SQLITE_PATH = get_arg_val(7, DEFAULT_SQLITE_PATH)

# Check for --tables and --include-shots-blob
selected_tables = None
include_shots_blob = False

for arg in sys.argv[1:]:
    if arg.startswith('--tables='):
        t_val = arg.split('=', 1)[1].strip().lower()
        if t_val != 'all' and t_val != '':
            selected_tables = set(x.strip() for x in t_val.split(','))
    elif arg.startswith('--include-shots-blob='):
        b_val = arg.split('=', 1)[1].strip()
        include_shots_blob = (b_val in ('1', 'true', 'yes', 'True'))

def should_sync(table_key):
    if selected_tables is None:
        return True
    return table_key.lower() in selected_tables

print("=== Запуск синхронизации данных Firebird -> SQLite ===")
print(f"Источник Firebird: {FB_HOST}:{FB_PORT}/{FB_PATH} (Пользователь: {FB_USER}, Кодировка: {FB_CHARSET})")
print(f"Целевая SQLite БД: {SQLITE_PATH}")
if selected_tables:
    print(f"Выбранные таблицы: {', '.join(sorted(selected_tables))}")
else:
    print("Выбранные таблицы: ВСЕ ТАБЛИЦЫ (Полная синхронизация)")
print(f"Загрузка бинарных BLOB-изображений PROTSHOTS: {'ДА (полные файлы)' if include_shots_blob else 'НЕТ (метаданные + размер в байтах)'}")

t_start = time.time()

# -------------------------------------------------------------
# Connect to Firebird & SQLite
# -------------------------------------------------------------
fb_conn = firebirdsql.connect(
    host=FB_HOST,
    port=FB_PORT,
    database=FB_PATH,
    user=FB_USER,
    password=FB_PASS,
    charset=FB_CHARSET
)
fb_cur = fb_conn.cursor()

sqlite_conn = sqlite3.connect(SQLITE_PATH)
sqlite_cur = sqlite_conn.cursor()

journal_mode = sqlite_cfg.get('JournalMode', 'WAL')
synchronous = sqlite_cfg.get('Synchronous', 'NORMAL')
sqlite_cur.execute(f"PRAGMA journal_mode = {journal_mode};")
sqlite_cur.execute(f"PRAGMA synchronous = {synchronous};")

# Shared lookups
channels_map = {}
insurers_map = {}
dms_patient_map = {}
visit_aggregates = {}
contract_aggregates = {}
mkb_map = {}
serv_map = {}

# -------------------------------------------------------------
# 1. CHANNELS
# -------------------------------------------------------------
if should_sync('channels') or should_sync('patients'):
    print("\n[+] Синхронизация CHANNELS (Рекламные каналы)...")
    t0 = time.time()
    sqlite_cur.execute("""
    CREATE TABLE IF NOT EXISTS channels (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        moduser TEXT,
        moddate TEXT
    );
    """)
    if should_sync('channels'):
        sqlite_cur.execute("DELETE FROM channels;")
    fb_cur.execute("SELECT ID, NAME, MODUSER, MODDATE FROM CHANNELS")
    ch_rows = []
    for r in fb_cur.fetchall():
        cid = r[0]
        cname = (r[1] or '').strip()
        channels_map[cid] = cname
        ch_rows.append((cid, cname, (r[2] or '').strip(), r[3].isoformat() if r[3] else None))
    if should_sync('channels'):
        sqlite_cur.executemany("INSERT INTO channels VALUES (?, ?, ?, ?)", ch_rows)
        sqlite_conn.commit()
        print(f"  -> Импортировано {len(ch_rows)} каналов ({time.time()-t0:.2f}с)")

# -------------------------------------------------------------
# 2. INSURERS
# -------------------------------------------------------------
if should_sync('insurers') or should_sync('dmscards') or should_sync('dms_cards') or should_sync('servprices'):
    print("\n[+] Синхронизация INSURERS (Страховые компании)...")
    t0 = time.time()
    sqlite_cur.execute("""
    CREATE TABLE IF NOT EXISTS insurers (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        briefly TEXT,
        moduser TEXT,
        moddate TEXT
    );
    """)
    if should_sync('insurers'):
        sqlite_cur.execute("DELETE FROM insurers;")
    fb_cur.execute("SELECT ID, NAME, BRIEFLY, MODUSER, MODDATE FROM INSURERS")
    ins_rows = []
    for r in fb_cur.fetchall():
        iid = r[0]
        iname = (r[1] or '').strip()
        insurers_map[iid] = iname
        ins_rows.append((iid, iname, (r[2] or '').strip(), (r[3] or '').strip(), r[4].isoformat() if r[4] else None))
    if should_sync('insurers'):
        sqlite_cur.executemany("INSERT INTO insurers VALUES (?, ?, ?, ?, ?)", ins_rows)
        sqlite_conn.commit()
        print(f"  -> Импортировано {len(ins_rows)} страховых компаний ({time.time()-t0:.2f}с)")

# -------------------------------------------------------------
# 3. DMSCARDS
# -------------------------------------------------------------
if should_sync('dmscards') or should_sync('dms_cards') or should_sync('patients'):
    print("\n[+] Синхронизация DMSCARDS (Полисы и карты ДМС)...")
    t0 = time.time()
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
        scnt INTEGER,
        lcnt INTEGER
    );
    """)
    cur_dms_cols = [c[1] for c in sqlite_cur.execute("PRAGMA table_info(dms_cards)").fetchall()]
    if 'scnt' not in cur_dms_cols:
        sqlite_cur.execute("ALTER TABLE dms_cards ADD COLUMN scnt INTEGER DEFAULT 0;")
    if 'lcnt' not in cur_dms_cols:
        sqlite_cur.execute("ALTER TABLE dms_cards ADD COLUMN lcnt INTEGER DEFAULT 0;")

    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_dms_cards_patient ON dms_cards(patient_id);")
    if should_sync('dmscards') or should_sync('dms_cards'):
        sqlite_cur.execute("DELETE FROM dms_cards;")

    fb_cur.execute("SELECT ID, PT_ID, REFERRAL, RDATE, POLICY, IN_ID, LIMIT, ACCRUED, REST, BARCODE, MODUSER, MODDATE, SCNT, LCNT FROM DMSCARDS")
    dms_rows = []
    for r in fb_cur.fetchall():
        did = r[0]
        ptid = r[1]
        pol = (r[4] or '').strip()
        in_id = r[5]
        in_name = insurers_map.get(in_id, '')
        dms_rows.append((
            did, ptid, (r[2] or '').strip(),
            r[3].isoformat() if r[3] else None,
            pol, in_id, in_name,
            float(r[6] or 0), float(r[7] or 0), float(r[8] or 0),
            (r[9] or '').strip(), (r[10] or '').strip(),
            r[11].isoformat() if r[11] else None,
            int(r[12] or 0), int(r[13] or 0)
        ))
        if ptid and ptid not in dms_patient_map:
            dms_patient_map[ptid] = {'policy': pol, 'insurer': in_name}

    if should_sync('dmscards') or should_sync('dms_cards'):
        sqlite_cur.executemany("""
        INSERT INTO dms_cards (
            id, patient_id, referral, reg_date, policy, insurer_id, insurer_name,
            limit_amount, accrued, rest_amount, barcode, moduser, moddate, scnt, lcnt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, dms_rows)
        sqlite_conn.commit()
        print(f"  -> Импортировано {len(dms_rows)} карт ДМС ({time.time()-t0:.2f}с)")

# -------------------------------------------------------------
# 4. VISITS (patient_visits)
# -------------------------------------------------------------
if should_sync('visits') or should_sync('patient_visits') or should_sync('patients'):
    print("\n[+] Синхронизация VISITS (История приёмов и визитов)...")
    t0 = time.time()
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
    if should_sync('visits') or should_sync('patient_visits'):
        sqlite_cur.execute("DELETE FROM patient_visits;")

    fb_cur.execute("SELECT ID, PT_ID, DOCN, VDATE, VTIME, VTIME_S, REMARK, MODUSER, MODDATE FROM VISITS")
    visits_rows = []
    for r in fb_cur.fetchall():
        vid = r[0]
        ptid = r[1]
        vdate_str = r[3].isoformat() if r[3] else None
        visits_rows.append((
            vid, ptid, r[2], vdate_str, r[4],
            (r[5] or '').strip(), (r[6] or '').strip(),
            (r[7] or '').strip(), r[8].isoformat() if r[8] else None
        ))
        if ptid:
            if ptid not in visit_aggregates:
                visit_aggregates[ptid] = {'last_date': vdate_str, 'count': 1}
            else:
                visit_aggregates[ptid]['count'] += 1
                if vdate_str and (not visit_aggregates[ptid]['last_date'] or vdate_str > visit_aggregates[ptid]['last_date']):
                    visit_aggregates[ptid]['last_date'] = vdate_str

    if should_sync('visits') or should_sync('patient_visits'):
        sqlite_cur.executemany("INSERT INTO patient_visits VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", visits_rows)
        sqlite_conn.commit()
        print(f"  -> Импортировано {len(visits_rows)} визитов ({time.time()-t0:.2f}с)")

# -------------------------------------------------------------
# 5. PATIENTS
# -------------------------------------------------------------
if should_sync('patients'):
    print("\n[+] Синхронизация PATIENTS (Картотека пациентов)...")
    t0 = time.time()
    
    # Financial total spent by patient from CONTRACTS
    try:
        fb_cur.execute("SELECT PT_ID, SUM(ACCRUED) FROM CONTRACTS WHERE PT_ID IS NOT NULL GROUP BY PT_ID")
        contract_aggregates = {row[0]: float(row[1] or 0) for row in fb_cur.fetchall()}
    except Exception:
        contract_aggregates = {}

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

    p_batch = []
    p_count = 0
    for row in fb_cur.fetchall():
        pid = row[0]
        surname = (row[1] or '').strip()
        pname = (row[2] or '').strip()
        patron = (row[3] or '').strip()
        sex = int(row[4] or 0)
        sex_disp = 'М' if sex == 1 else ('Ж' if sex == 2 else '')
        bdate_str = row[5].isoformat() if row[5] else None
        phone = (row[8] or '').strip()
        sphone = (row[26] or '').strip()
        addr = (row[10] or '').strip()
        mednum = int(row[17] or 0)
        bname = (row[24] or '').strip()
        fname = (row[25] or '').strip()
        if not fname:
            fname = f"{surname} {pname} {patron}".strip()
        if not bname:
            bname = f"{surname} {pname[:1]}. {patron[:1]}.".strip() if pname else surname

        dms_info = dms_patient_map.get(pid, {})
        dms_pol = dms_info.get('policy', '')
        dms_ins = dms_info.get('insurer', '')
        dms_f = 1 if (dms_pol or dms_ins or int(row[18] or 0) == 1) else 0

        vis_info = visit_aggregates.get(pid, {})
        last_visit = vis_info.get('last_date', None)
        tot_visits = vis_info.get('count', 0)
        tot_spent = contract_aggregates.get(pid, 0.0)
        contact_phone = sphone if sphone else phone
        ch_id = row[34]
        ch_name = channels_map.get(ch_id, '')
        rdate_str = row[35].isoformat() if row[35] else None

        p_batch.append((
            pid, surname, pname, patron, fname, bname,
            sex, sex_disp, bdate_str, int(row[21] or 0),
            float(row[6] or 0), float(row[7] or 0),
            phone, (row[9] or '').strip(), sphone, (row[19] or '').strip(),
            (row[36] or addr or '').strip(),
            (row[27] or '').strip(), (row[28] or '').strip(),
            (row[29] or '').strip(), (row[30] or '').strip(),
            (row[31] or '').strip(), (row[32] or '').strip(), (row[33] or '').strip(),
            (row[11] or '').strip(), (row[12] or '').strip(),
            row[13].isoformat() if row[13] else None,
            (row[14] or '').strip(), (row[16] or '').strip(),
            mednum, dms_f, dms_pol, dms_ins,
            int(row[20] or 0), int(row[15] or 0),
            ch_id, ch_name, rdate_str, last_visit, tot_visits, tot_spent,
            (row[22] or '').strip(), row[23].isoformat() if row[23] else None,
            pname, surname, contact_phone, bdate_str, f"ЭМК №{mednum}. Канал: {ch_name or 'Н/Д'}",
            pname, surname, contact_phone, last_visit or rdate_str or ''
        ))
        p_count += 1
        if len(p_batch) >= 5000:
            sqlite_cur.executemany("INSERT INTO patients VALUES (" + ",".join(["?"]*52) + ")", p_batch)
            sqlite_conn.commit()
            p_batch = []

    if p_batch:
        sqlite_cur.executemany("INSERT INTO patients VALUES (" + ",".join(["?"]*52) + ")", p_batch)
        sqlite_conn.commit()

    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_patients_surname ON patients(surname);")
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_patients_fname ON patients(full_name);")
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);")
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_patients_sphone ON patients(sphone);")
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_patients_mednum ON patients(mednum);")
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_patients_bdate ON patients(bdate);")
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_patients_last_visit ON patients(last_visit_date);")
    sqlite_conn.commit()
    print(f"  -> Импортировано {p_count} пациентов ({time.time()-t0:.2f}с)")

# -------------------------------------------------------------
# 6. PROTDICT (Шаблоны протоколов)
# -------------------------------------------------------------
if should_sync('protdict'):
    print("\n[+] Синхронизация PROTDICT (Справочник шаблонов протоколов)...")
    t0 = time.time()
    sqlite_cur.execute("""
    CREATE TABLE IF NOT EXISTS protdict (
        id INTEGER PRIMARY KEY,
        docn INTEGER,
        kind INTEGER,
        name TEXT,
        title TEXT,
        content TEXT,
        post TEXT,
        fname TEXT,
        hide_f INTEGER DEFAULT 0,
        moddate TEXT,
        moduser TEXT
    );
    """)
    sqlite_cur.execute("DELETE FROM protdict;")
    fb_cur.execute("SELECT ID, DOCN, KIND, NAME, TITLE, CONTENT, POST, FNAME, HIDE_F, MODDATE, MODUSER FROM PROTDICT")
    rows = []
    for r in fb_cur.fetchall():
        content_val = r[5]
        if isinstance(content_val, bytes):
            content_val = content_val.decode('cp1251', errors='replace')
        elif content_val is None:
            content_val = ''
        rows.append((
            r[0], r[1], r[2],
            (r[3] or '').strip(),
            (r[4] or '').strip(),
            content_val,
            (r[6] or '').strip(),
            (r[7] or '').strip(),
            int(r[8] or 0),
            r[9].isoformat() if r[9] else None,
            (r[10] or '').strip()
        ))
    sqlite_cur.executemany("INSERT INTO protdict VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", rows)
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_protdict_docn ON protdict(docn);")
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_protdict_kind ON protdict(kind);")
    sqlite_conn.commit()
    print(f"  -> Импортировано {len(rows)} шаблонов протоколов ({time.time()-t0:.2f}с)")

# -------------------------------------------------------------
# 7. PROTOCOLS (Медицинские протоколы приёмов)
# -------------------------------------------------------------
if should_sync('protocols'):
    print("\n[+] Синхронизация PROTOCOLS (Клинические протоколы приемов)...")
    t0 = time.time()
    sqlite_cur.execute("""
    CREATE TABLE IF NOT EXISTS protocols (
        id INTEGER PRIMARY KEY,
        docn INTEGER,
        pt_id INTEGER,
        vdate TEXT,
        kind INTEGER,
        mode INTEGER,
        title TEXT,
        content TEXT,
        post TEXT,
        rdate TEXT,
        fname TEXT,
        hide_f INTEGER DEFAULT 0,
        moddate TEXT,
        moduser TEXT,
        shot_f INTEGER DEFAULT 0
    );
    """)
    sqlite_cur.execute("DELETE FROM protocols;")
    fb_cur.execute("SELECT ID, DOCN, PT_ID, VDATE, KIND, MODE, TITLE, CONTENT, POST, RDATE, FNAME, HIDE_F, MODDATE, MODUSER, SHOT_F FROM PROTOCOLS")
    p_batch = []
    p_count = 0
    for r in fb_cur.fetchall():
        content_val = r[7]
        if isinstance(content_val, bytes):
            content_val = content_val.decode('cp1251', errors='replace')
        elif content_val is None:
            content_val = ''
        p_batch.append((
            r[0], r[1], r[2],
            r[3].isoformat() if r[3] else None,
            r[4], r[5],
            (r[6] or '').strip(),
            content_val,
            (r[8] or '').strip(),
            r[9].isoformat() if r[9] else None,
            (r[10] or '').strip(),
            int(r[11] or 0),
            r[12].isoformat() if r[12] else None,
            (r[13] or '').strip(),
            int(r[14] or 0)
        ))
        p_count += 1
        if len(p_batch) >= 2000:
            sqlite_cur.executemany("INSERT INTO protocols VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", p_batch)
            sqlite_conn.commit()
            p_batch = []

    if p_batch:
        sqlite_cur.executemany("INSERT INTO protocols VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", p_batch)
        sqlite_conn.commit()

    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_protocols_pt_id ON protocols(pt_id);")
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_protocols_vdate ON protocols(vdate);")
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_protocols_docn ON protocols(docn);")
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_protocols_kind ON protocols(kind);")
    sqlite_conn.commit()
    print(f"  -> Импортировано {p_count} протоколов осмотра ({time.time()-t0:.2f}с)")

# -------------------------------------------------------------
# 8. PROTSHOTS (Снимки и изображения к протоколам)
# -------------------------------------------------------------
if should_sync('protshots'):
    print(f"\n[+] Синхронизация PROTSHOTS (Снимки к протоколам, режим BLOB={include_shots_blob})...")
    t0 = time.time()
    sqlite_cur.execute("""
    CREATE TABLE IF NOT EXISTS protshots (
        id INTEGER PRIMARY KEY,
        pr_id INTEGER,
        shot BLOB,
        title TEXT,
        fname TEXT,
        shot_size_bytes INTEGER
    );
    """)
    sqlite_cur.execute("DELETE FROM protshots;")

    if include_shots_blob:
        fb_cur.execute("SELECT ID, PR_ID, TITLE, FNAME, SHOT, OCTET_LENGTH(SHOT) FROM PROTSHOTS")
    else:
        fb_cur.execute("SELECT ID, PR_ID, TITLE, FNAME, NULL, OCTET_LENGTH(SHOT) FROM PROTSHOTS")

    s_rows = []
    for r in fb_cur.fetchall():
        shot_data = r[4] if include_shots_blob else None
        s_rows.append((
            r[0], r[1], shot_data,
            (r[2] or '').strip(),
            (r[3] or '').strip(),
            int(r[5] or 0)
        ))
    sqlite_cur.executemany("INSERT INTO protshots VALUES (?, ?, ?, ?, ?, ?)", s_rows)
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_protshots_pr_id ON protshots(pr_id);")
    sqlite_conn.commit()
    print(f"  -> Импортировано {len(s_rows)} снимков PROTSHOTS ({time.time()-t0:.2f}с)")

# -------------------------------------------------------------
# 9. MKB (Международная классификация болезней МКБ-10)
# -------------------------------------------------------------
if should_sync('mkb') or should_sync('diagnoses'):
    print("\n[+] Синхронизация MKB (Классификатор МКБ-10)...")
    t0 = time.time()
    sqlite_cur.execute("""
    CREATE TABLE IF NOT EXISTS mkb (
        id INTEGER PRIMARY KEY,
        ownid INTEGER,
        group_f INTEGER,
        code TEXT,
        name TEXT,
        rindex INTEGER,
        bdate TEXT,
        hide_f INTEGER DEFAULT 0
    );
    """)
    if should_sync('mkb'):
        sqlite_cur.execute("DELETE FROM mkb;")
    fb_cur.execute("SELECT ID, OWNID, GROUP_F, CODE, NAME, RINDEX, BDATE, HIDE_F FROM MKB")
    mkb_rows = []
    for r in fb_cur.fetchall():
        mid = r[0]
        code = (r[3] or '').strip()
        name = (r[4] or '').strip()
        mkb_map[mid] = {'code': code, 'name': name}
        mkb_rows.append((
            mid, r[1], int(r[2] or 0),
            code, name, int(r[5] or 0),
            r[6].isoformat() if r[6] else None,
            int(r[7] or 0)
        ))
    if should_sync('mkb'):
        sqlite_cur.executemany("INSERT INTO mkb VALUES (?, ?, ?, ?, ?, ?, ?, ?)", mkb_rows)
        sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_mkb_code ON mkb(code);")
        sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_mkb_ownid ON mkb(ownid);")
        sqlite_conn.commit()
        print(f"  -> Импортировано {len(mkb_rows)} диагнозов МКБ-10 ({time.time()-t0:.2f}с)")

# -------------------------------------------------------------
# 10. DIAGNOSES (Связка протоколов осмотра с МКБ-10)
# -------------------------------------------------------------
if should_sync('diagnoses'):
    print("\n[+] Синхронизация DIAGNOSES (Диагнозы протоколов приёмов)...")
    t0 = time.time()
    sqlite_cur.execute("""
    CREATE TABLE IF NOT EXISTS diagnoses (
        id INTEGER PRIMARY KEY,
        pr_id INTEGER,
        mk_id INTEGER,
        mkb_code TEXT,
        mkb_name TEXT
    );
    """)
    sqlite_cur.execute("DELETE FROM diagnoses;")
    fb_cur.execute("SELECT ID, PR_ID, MK_ID FROM DIAGNOSES")
    diag_rows = []
    for r in fb_cur.fetchall():
        mk_id = r[2]
        info = mkb_map.get(mk_id, {})
        diag_rows.append((
            r[0], r[1], mk_id,
            info.get('code', ''),
            info.get('name', '')
        ))
    sqlite_cur.executemany("INSERT INTO diagnoses VALUES (?, ?, ?, ?, ?)", diag_rows)
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_diagnoses_pr_id ON diagnoses(pr_id);")
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_diagnoses_mk_id ON diagnoses(mk_id);")
    sqlite_conn.commit()
    print(f"  -> Импортировано {len(diag_rows)} установленных диагнозов ({time.time()-t0:.2f}с)")

# -------------------------------------------------------------
# 11. SERVDICT (Справочник медицинских услуг / прайс-лист)
# -------------------------------------------------------------
if should_sync('servdict') or should_sync('services') or should_sync('servprices') or should_sync('servplan'):
    print("\n[+] Синхронизация SERVDICT (Номенклатура медицинских услуг)...")
    t0 = time.time()
    sqlite_cur.execute("""
    CREATE TABLE IF NOT EXISTS servdict (
        id INTEGER PRIMARY KEY,
        ownid INTEGER,
        rootid INTEGER,
        group_f INTEGER,
        code TEXT,
        name TEXT,
        kind INTEGER,
        price REAL,
        modes TEXT,
        moduser TEXT,
        moddate TEXT
    );
    """)
    if should_sync('servdict'):
        sqlite_cur.execute("DELETE FROM servdict;")
    fb_cur.execute("SELECT ID, OWNID, ROOTID, GROUP_F, CODE, NAME, KIND, PRICE, MODES, MODUSER, MODDATE FROM SERVDICT")
    serv_rows = []
    for r in fb_cur.fetchall():
        sid = r[0]
        code = (r[4] or '').strip()
        name = (r[5] or '').strip()
        serv_map[sid] = {'code': code, 'name': name}
        serv_rows.append((
            sid, r[1], r[2], int(r[3] or 0),
            code, name, int(r[6] or 0),
            float(r[7] or 0), (r[8] or '').strip(),
            (r[9] or '').strip(), r[10].isoformat() if r[10] else None
        ))
    if should_sync('servdict'):
        sqlite_cur.executemany("INSERT INTO servdict VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", serv_rows)
        sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_servdict_code ON servdict(code);")
        sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_servdict_ownid ON servdict(ownid);")
        sqlite_conn.commit()
        print(f"  -> Импортировано {len(serv_rows)} услуг SERVDICT ({time.time()-t0:.2f}с)")

# -------------------------------------------------------------
# 12. SERVICES (Оказанные услуги пациентам)
# -------------------------------------------------------------
if should_sync('services'):
    print("\n[+] Синхронизация SERVICES (Оказанные услуги и чеки)...")
    t0 = time.time()
    sqlite_cur.execute("""
    CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY,
        ownid INTEGER,
        docn INTEGER,
        pt_id INTEGER,
        sd_id INTEGER,
        service_code TEXT,
        service_name TEXT,
        vdate TEXT,
        mode INTEGER,
        iprice REAL,
        discount REAL,
        fprice REAL,
        cnt INTEGER,
        total REAL,
        vmonth INTEGER,
        salen INTEGER,
        retn INTEGER,
        card_f INTEGER,
        vyear INTEGER,
        moduser TEXT,
        moddate TEXT,
        rrn TEXT
    );
    """)
    sqlite_cur.execute("DELETE FROM services;")
    fb_cur.execute("""
    SELECT ID, OWNID, DOCN, PT_ID, SD_ID, VDATE, MODE, IPRICE, DISCOUNT, FPRICE,
           CNT, TOTAL, VMONTH, SALEN, RETN, CARD_F, VYEAR, MODUSER, MODDATE, RRN
    FROM SERVICES
    """)
    s_batch = []
    s_count = 0
    for r in fb_cur.fetchall():
        sd_id = r[4]
        s_info = serv_map.get(sd_id, {})
        s_batch.append((
            r[0], r[1], r[2], r[3], sd_id,
            s_info.get('code', ''), s_info.get('name', ''),
            r[5].isoformat() if r[5] else None,
            r[6], float(r[7] or 0), float(r[8] or 0), float(r[9] or 0),
            int(r[10] or 0), float(r[11] or 0), int(r[12] or 0),
            int(r[13] or 0), int(r[14] or 0), int(r[15] or 0), int(r[16] or 0),
            (r[17] or '').strip(), r[18].isoformat() if r[18] else None,
            (r[19] or '').strip()
        ))
        s_count += 1
        if len(s_batch) >= 5000:
            sqlite_cur.executemany("INSERT INTO services VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", s_batch)
            sqlite_conn.commit()
            s_batch = []

    if s_batch:
        sqlite_cur.executemany("INSERT INTO services VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", s_batch)
        sqlite_conn.commit()

    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_services_pt_id ON services(pt_id);")
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_services_sd_id ON services(sd_id);")
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_services_vdate ON services(vdate);")
    sqlite_conn.commit()
    print(f"  -> Импортировано {s_count} оказанных услуг SERVICES ({time.time()-t0:.2f}с)")

# -------------------------------------------------------------
# 13. SERVPRICES (Специальные прайсы ДМС)
# -------------------------------------------------------------
if should_sync('servprices'):
    print("\n[+] Синхронизация SERVPRICES (Тарифы услуг по страховым)...")
    t0 = time.time()
    sqlite_cur.execute("""
    CREATE TABLE IF NOT EXISTS servprices (
        id INTEGER PRIMARY KEY,
        in_id INTEGER,
        sd_id INTEGER,
        price REAL,
        moduser TEXT,
        moddate TEXT
    );
    """)
    sqlite_cur.execute("DELETE FROM servprices;")
    fb_cur.execute("SELECT ID, IN_ID, SD_ID, PRICE, MODUSER, MODDATE FROM SERVPRICES")
    sp_rows = [(
        r[0], r[1], r[2], float(r[3] or 0),
        (r[4] or '').strip(), r[5].isoformat() if r[5] else None
    ) for r in fb_cur.fetchall()]
    sqlite_cur.executemany("INSERT INTO servprices VALUES (?, ?, ?, ?, ?, ?)", sp_rows)
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_servprices_in_id ON servprices(in_id);")
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_servprices_sd_id ON servprices(sd_id);")
    sqlite_conn.commit()
    print(f"  -> Импортировано {len(sp_rows)} цен SERVPRICES ({time.time()-t0:.2f}с)")

# -------------------------------------------------------------
# 14. SERVPLAN (Планы оказания услуг)
# -------------------------------------------------------------
if should_sync('servplan'):
    print("\n[+] Синхронизация SERVPLAN (Планы назначений услуг)...")
    t0 = time.time()
    sqlite_cur.execute("""
    CREATE TABLE IF NOT EXISTS servplan (
        id INTEGER PRIMARY KEY,
        pr_id INTEGER,
        sd_id INTEGER,
        sr_id INTEGER,
        cnt INTEGER
    );
    """)
    sqlite_cur.execute("DELETE FROM servplan;")
    fb_cur.execute("SELECT ID, PR_ID, SD_ID, SR_ID, CNT FROM SERVPLAN")
    spl_rows = [(r[0], r[1], r[2], r[3], int(r[4] or 0)) for r in fb_cur.fetchall()]
    sqlite_cur.executemany("INSERT INTO servplan VALUES (?, ?, ?, ?, ?)", spl_rows)
    sqlite_conn.commit()
    print(f"  -> Импортировано {len(spl_rows)} планов SERVPLAN ({time.time()-t0:.2f}с)")

# -------------------------------------------------------------
# 15. LABDICT, LABPDF, LABPLAN
# -------------------------------------------------------------
if should_sync('labdict'):
    print("\n[+] Синхронизация LABDICT (Справочник анализов и исследований)...")
    t0 = time.time()
    sqlite_cur.execute("""
    CREATE TABLE IF NOT EXISTS labdict (
        id INTEGER PRIMARY KEY,
        ownid INTEGER,
        rootid INTEGER,
        group_f INTEGER,
        code TEXT,
        name TEXT,
        price REAL,
        modes TEXT,
        moduser TEXT,
        moddate TEXT,
        period INTEGER,
        cdate TEXT
    );
    """)
    sqlite_cur.execute("DELETE FROM labdict;")
    fb_cur.execute("SELECT ID, OWNID, ROOTID, GROUP_F, CODE, NAME, PRICE, MODES, MODUSER, MODDATE, PERIOD, CDATE FROM LABDICT")
    ld_rows = []
    for r in fb_cur.fetchall():
        ld_rows.append((
            r[0], r[1], r[2], int(r[3] or 0),
            (r[4] or '').strip(), (r[5] or '').strip(),
            float(r[6] or 0), (r[7] or '').strip(),
            (r[8] or '').strip(), r[9].isoformat() if r[9] else None,
            int(r[10] or 0), r[11].isoformat() if r[11] else None
        ))
    sqlite_cur.executemany("INSERT INTO labdict VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", ld_rows)
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_labdict_code ON labdict(code);")
    sqlite_conn.commit()
    print(f"  -> Импортировано {len(ld_rows)} исследований LABDICT ({time.time()-t0:.2f}с)")

if should_sync('labpdf'):
    print("\n[+] Проверка LABPDF (PDF файлы результатов анализов)...")
    sqlite_cur.execute("""
    CREATE TABLE IF NOT EXISTS labpdf (
        id INTEGER PRIMARY KEY,
        ownid INTEGER,
        pt_id INTEGER,
        vdate TEXT,
        title TEXT,
        shot BLOB,
        fname TEXT,
        moduser TEXT,
        moddate TEXT
    );
    """)
    sqlite_cur.execute("DELETE FROM labpdf;")
    try:
        fb_cur.execute("SELECT ID, OWNID, PT_ID, VDATE, TITLE, SHOT, FNAME, MODUSER, MODDATE FROM LABPDF")
        pdf_rows = [(
            r[0], r[1], r[2], r[3].isoformat() if r[3] else None,
            (r[4] or '').strip(), r[5], (r[6] or '').strip(),
            (r[7] or '').strip(), r[8].isoformat() if r[8] else None
        ) for r in fb_cur.fetchall()]
        sqlite_cur.executemany("INSERT INTO labpdf VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", pdf_rows)
        sqlite_conn.commit()
        print(f"  -> Импортировано {len(pdf_rows)} файлов LABPDF")
    except Exception as e:
        print(f"  -> LABPDF пуст или не содержит строк ({e})")

if should_sync('labplan'):
    print("\n[+] Проверка LABPLAN (План назначений анализов)...")
    sqlite_cur.execute("""
    CREATE TABLE IF NOT EXISTS labplan (
        id INTEGER PRIMARY KEY,
        pr_id INTEGER,
        ld_id INTEGER,
        lr_id INTEGER,
        cnt INTEGER
    );
    """)
    sqlite_cur.execute("DELETE FROM labplan;")
    try:
        fb_cur.execute("SELECT ID, PR_ID, LD_ID, LR_ID, CNT FROM LABPLAN")
        lp_rows = [(r[0], r[1], r[2], r[3], int(r[4] or 0)) for r in fb_cur.fetchall()]
        sqlite_cur.executemany("INSERT INTO labplan VALUES (?, ?, ?, ?, ?)", lp_rows)
        sqlite_conn.commit()
        print(f"  -> Импортировано {len(lp_rows)} назначений LABPLAN")
    except Exception as e:
        print(f"  -> LABPLAN пуст или не содержит строк ({e})")

# -------------------------------------------------------------
# 16. DISCOUNTS, SCHEDULE, TEMPLATES
# -------------------------------------------------------------
if should_sync('discounts'):
    print("\n[+] Синхронизация DISCOUNTS (Персональные скидки пациентов)...")
    t0 = time.time()
    sqlite_cur.execute("""
    CREATE TABLE IF NOT EXISTS discounts (
        id INTEGER PRIMARY KEY,
        pt_id INTEGER,
        bdate TEXT,
        edate TEXT,
        val INTEGER,
        reason TEXT,
        moduser TEXT,
        moddate TEXT
    );
    """)
    sqlite_cur.execute("DELETE FROM discounts;")
    fb_cur.execute("SELECT ID, PT_ID, BDATE, EDATE, VAL, REASON, MODUSER, MODDATE FROM DISCOUNTS")
    d_rows = [(
        r[0], r[1],
        r[2].isoformat() if r[2] else None,
        r[3].isoformat() if r[3] else None,
        int(r[4] or 0), (r[5] or '').strip(),
        (r[6] or '').strip(), r[7].isoformat() if r[7] else None
    ) for r in fb_cur.fetchall()]
    sqlite_cur.executemany("INSERT INTO discounts VALUES (?, ?, ?, ?, ?, ?, ?, ?)", d_rows)
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_discounts_pt_id ON discounts(pt_id);")
    sqlite_conn.commit()
    print(f"  -> Импортировано {len(d_rows)} скидок DISCOUNTS ({time.time()-t0:.2f}с)")

if should_sync('schedule'):
    print("\n[+] Синхронизация SCHEDULE (Расписание работы врачей)...")
    t0 = time.time()
    sqlite_cur.execute("""
    CREATE TABLE IF NOT EXISTS schedule (
        id INTEGER PRIMARY KEY,
        docn INTEGER,
        bdate TEXT,
        edate TEXT,
        btime INTEGER,
        etime INTEGER,
        ival INTEGER,
        days TEXT,
        btime_s TEXT,
        etime_s TEXT,
        ival_s TEXT,
        moduser TEXT,
        moddate TEXT
    );
    """)
    sqlite_cur.execute("DELETE FROM schedule;")
    fb_cur.execute("SELECT ID, DOCN, BDATE, EDATE, BTIME, ETIME, IVAL, DAYS, BTIME_S, ETIME_S, IVAL_S, MODUSER, MODDATE FROM SCHEDULE")
    sc_rows = [(
        r[0], r[1],
        r[2].isoformat() if r[2] else None,
        r[3].isoformat() if r[3] else None,
        int(r[4] or 0), int(r[5] or 0), int(r[6] or 0),
        (r[7] or '').strip(), (r[8] or '').strip(), (r[9] or '').strip(), (r[10] or '').strip(),
        (r[11] or '').strip(), r[12].isoformat() if r[12] else None
    ) for r in fb_cur.fetchall()]
    sqlite_cur.executemany("INSERT INTO schedule VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", sc_rows)
    sqlite_cur.execute("CREATE INDEX IF NOT EXISTS idx_schedule_docn ON schedule(docn);")
    sqlite_conn.commit()
    print(f"  -> Импортировано {len(sc_rows)} записей расписания SCHEDULE ({time.time()-t0:.2f}с)")

if should_sync('templates'):
    print("\n[+] Синхронизация TEMPLATES (Шаблоны документов)...")
    sqlite_cur.execute("""
    CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY,
        docn INTEGER,
        n INTEGER,
        name TEXT,
        content TEXT,
        moddate TEXT,
        moduser TEXT
    );
    """)
    sqlite_cur.execute("DELETE FROM templates;")
    fb_cur.execute("SELECT ID, DOCN, N, NAME, CONTENT, MODDATE, MODUSER FROM TEMPLATES")
    tpl_rows = []
    for r in fb_cur.fetchall():
        c_val = r[4]
        if isinstance(c_val, bytes):
            c_val = c_val.decode('cp1251', errors='replace')
        elif c_val is None:
            c_val = ''
        tpl_rows.append((
            r[0], r[1], r[2], (r[3] or '').strip(),
            c_val, r[5].isoformat() if r[5] else None,
            (r[6] or '').strip()
        ))
    sqlite_cur.executemany("INSERT INTO templates VALUES (?, ?, ?, ?, ?, ?, ?)", tpl_rows)
    sqlite_conn.commit()
    print(f"  -> Импортировано {len(tpl_rows)} шаблонов TEMPLATES")

# -------------------------------------------------------------
# Wrap up & Close
# -------------------------------------------------------------
fb_conn.close()
sqlite_conn.close()

t_total = time.time() - t_start
print(f"\n[УСПЕХ] Синхронизация выбранных таблиц Firebird в SQLite успешно завершена за {t_total:.2f} сек!")

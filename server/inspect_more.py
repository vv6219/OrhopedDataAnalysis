import firebirdsql
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = firebirdsql.connect(
    host='localhost',
    database=r'C:\Users\vladimir\source\DB\Export\MEDICAL.FDB',
    user='SYSDBA',
    password='masterkey',
    charset='WIN1251'
)
cur = conn.cursor()

for tbl in ['INSURERS', 'SERVICES', 'PROTOCOLS', 'VISITS']:
    cur.execute(f"SELECT FIRST 1 * FROM {tbl}")
    cols = [d[0] for d in cur.description]
    print(f"\n{tbl} columns: {cols}")
    row = cur.fetchone()
    print(f"Sample {tbl}: {dict(zip(cols, row)) if row else None}")

conn.close()

import pandas as pd
import sqlite3
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

db_path = r"c:\Users\vladimir\source\repos\Data Analysis\db\orthopedic_data_center.sqlite"
conn = sqlite3.connect(db_path)

# Drop existing to start fresh
conn.execute('DROP TABLE IF EXISTS orthopedic_operations_expenses')
conn.execute('DROP TABLE IF EXISTS orthopedic_revenue_streams')
conn.execute('DROP TABLE IF EXISTS orthopedic_monthly_summaries')

# 1. EXPENSES TABLE (Document 1)
conn.execute('''
CREATE TABLE orthopedic_operations_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    quantity_or_invoice_num TEXT,
    amount REAL,
    transaction_date TEXT,
    report_month TEXT
)
''')

# 2. SUMMARIES TABLE (Document 2)
conn.execute('''
CREATE TABLE orthopedic_monthly_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_month TEXT UNIQUE NOT NULL,
    total_income REAL,
    vlad_salary REAL,
    other_expenses REAL,
    total_expenses REAL,
    net_total REAL
)
''')

# 3. REVENUE STREAMS TABLE (Document 2)
conn.execute('''
CREATE TABLE orthopedic_revenue_streams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    summary_id INTEGER,
    source_name TEXT NOT NULL,
    amount REAL,
    FOREIGN KEY(summary_id) REFERENCES orthopedic_monthly_summaries(id)
)
''')

url1 = 'https://docs.google.com/spreadsheets/d/1aIEDd-b_afYUSkUkxzTN9jirOc9ULL3DWiAMo-xx7dI/export?format=xlsx'
url2 = 'https://docs.google.com/spreadsheets/d/1mJ1zl51CT9po4eTpyZ8WUvLGzrwaZ7R08fFGMDHLxW0/export?format=xlsx'

def safe_float(val):
    try:
        return float(val)
    except:
        return 0.0

print("Processing Operational Expenses (Doc 1)...")
xl1 = pd.ExcelFile(url1)
for sheet in xl1.sheet_names:
    try:
        df = pd.read_excel(url1, sheet_name=sheet)
        if len(df.columns) >= 4:
            for idx, row in df.iterrows():
                item_name = str(row.iloc[0]).strip()
                if item_name == 'nan' or not item_name: continue
                qty = str(row.iloc[1])
                amount = safe_float(row.iloc[2])
                date = str(row.iloc[3])
                conn.execute('''
                    INSERT INTO orthopedic_operations_expenses (item_name, quantity_or_invoice_num, amount, transaction_date, report_month)
                    VALUES (?, ?, ?, ?, ?)
                ''', (item_name, qty, amount, date, sheet))
    except Exception as e:
        print(f"Error on Doc 1 Sheet {sheet}: {e}")

print("Processing Revenue and Financial Summaries (Doc 2)...")
xl2 = pd.ExcelFile(url2)
for sheet in xl2.sheet_names:
    if "Лист" in sheet: continue # skip empty/scratch sheets
    try:
        df = pd.read_excel(url2, sheet_name=sheet)
        if len(df.columns) < 5: continue
        
        cols = df.columns.tolist()
        
        total_income_idx = [i for i, c in enumerate(cols) if 'Итого доход' in str(c)]
        vlad_salary_idx = [i for i, c in enumerate(cols) if 'ЗП Влада' in str(c)]
        total_expenses_idx = [i for i, c in enumerate(cols) if 'Итого расход' in str(c)]
        other_expenses_idx = [i for i, c in enumerate(cols) if 'Расход' in str(c) and 'Итого' not in str(c)]
        net_total_idx = [i for i, c in enumerate(cols) if str(c).strip() == 'Итого']

        if not total_income_idx: continue
        
        row = df.iloc[0]
        
        total_inc = safe_float(row.iloc[total_income_idx[0]]) if total_income_idx else 0.0
        vlad_sal = safe_float(row.iloc[vlad_salary_idx[0]]) if vlad_salary_idx else 0.0
        tot_exp = safe_float(row.iloc[total_expenses_idx[0]]) if total_expenses_idx else 0.0
        oth_exp = safe_float(row.iloc[other_expenses_idx[0]]) if other_expenses_idx else 0.0
        net_tot = safe_float(row.iloc[net_total_idx[-1]]) if net_total_idx else 0.0
        
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO orthopedic_monthly_summaries (report_month, total_income, vlad_salary, other_expenses, total_expenses, net_total)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (sheet, total_inc, vlad_sal, oth_exp, tot_exp, net_tot))
        summary_id = cur.lastrowid
        
        for i in range(1, total_income_idx[0]):
            source_name = str(cols[i]).strip()
            amount = safe_float(row.iloc[i])
            conn.execute('''
                INSERT INTO orthopedic_revenue_streams (summary_id, source_name, amount)
                VALUES (?, ?, ?)
            ''', (summary_id, source_name, amount))
            
    except Exception as e:
        print(f"Error on Doc 2 Sheet {sheet}: {e}")

conn.commit()
conn.close()
print("Data extraction complete! DB saved to db/orthopedic_data_center.sqlite")

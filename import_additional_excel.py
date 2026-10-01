import pandas as pd
import sqlite3
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

db_path = r"c:\Users\vladimir\source\repos\Data Analysis\db\orthopedic_data_center.sqlite"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

file_path = r"c:\Users\vladimir\source\repos\Data Analysis\Excel\Для формулы период 01.06.2026-29.09.2026.xlsx"
xl = pd.ExcelFile(file_path)

def safe_float(val):
    try:
        if pd.isna(val): return 0.0
        return float(str(val).replace(' ','').replace(',','.'))
    except:
        return 0.0

# 1. Parse 'Закупка расходников' (Materials Catalog)
try:
    df_mat = pd.read_excel(file_path, sheet_name='Закупка расходников')
    materials_added = 0
    for idx, row in df_mat.iterrows():
        name = str(row.iloc[0]).strip()
        if name == 'nan' or not name: continue
        unit = str(row.iloc[1]).strip()
        cost = safe_float(row.iloc[2])
        
        # Insert into materials_catalog
        cur.execute('''
            INSERT INTO materials_catalog (material_name, unit_of_measure, current_unit_cost)
            VALUES (?, ?, ?)
        ''', (name, unit, cost))
        materials_added += 1
    print(f"Added {materials_added} materials to materials_catalog.")
except Exception as e:
    print(f"Error parsing materials: {e}")

# 2. Parse '1.06.2026-29.09.2026' (Services, Prices, and Quantities)
try:
    df_srv = pd.read_excel(file_path, sheet_name='1.06.2026-29.09.2026')
    services_added = 0
    prices_added = 0
    trans_added = 0
    for idx, row in df_srv.iterrows():
        category = str(row.iloc[0]).strip()
        service = str(row.iloc[1]).strip()
        if service == 'nan' or not service: continue
        price = safe_float(row.iloc[2])
        quantity = int(safe_float(row.iloc[3]))
        
        # 2a. Add to operation_catalog
        cur.execute('''
            INSERT INTO operation_catalog (operation_code, operation_name, description)
            SELECT ?, ?, ?
            WHERE NOT EXISTS (SELECT 1 FROM operation_catalog WHERE operation_name = ?)
        ''', (f"SRV-{idx}", service, category, service))
        if cur.rowcount > 0:
            services_added += 1
            
        # Get operation ID
        cur.execute('SELECT id FROM operation_catalog WHERE operation_name = ?', (service,))
        res = cur.fetchone()
        if res:
            op_id = res[0]
            # 2b. Add to operation_prices
            cur.execute('''
                INSERT INTO operation_prices (operation_id, price, valid_from)
                VALUES (?, ?, '2026-06-01')
            ''', (op_id, price))
            prices_added += 1
            
            # 2c. Add to operation_transactions (if quantity > 0)
            for _ in range(quantity):
                cur.execute('''
                    INSERT INTO operation_transactions (patient_id, operation_id, transaction_date, billed_price, notes)
                    VALUES (1, ?, '2026-09-29', ?, 'Imported from 01.06-29.09 aggregate')
                ''', (op_id, price))
                trans_added += 1
                
    print(f"Added {services_added} new services to operation_catalog.")
    print(f"Added {prices_added} price records to operation_prices.")
    print(f"Added {trans_added} operation transactions based on quantity.")
except Exception as e:
    print(f"Error parsing services: {e}")

conn.commit()
conn.close()

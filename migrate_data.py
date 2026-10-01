import sqlite3
import os

db_path = r"c:\Users\vladimir\source\repos\Data Analysis\db\orthopedic_data_center.sqlite"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

print("Migrating legacy spreadsheet data to new ERP schema...")

# 1. Populate Operation Catalog from unique item names in legacy expenses
cur.execute('''
    INSERT INTO operation_catalog (operation_code, operation_name, description)
    SELECT 
        'LEGACY-OP-' || id, 
        item_name, 
        'Imported from legacy Google Sheets' 
    FROM (SELECT DISTINCT item_name, ROW_NUMBER() OVER(ORDER BY item_name) as id FROM orthopedic_operations_expenses)
''')

# 2. Add a default legacy patient for these historical transactions
cur.execute('''
    INSERT INTO patients (id, first_name, last_name, date_of_birth, contact_phone, medical_history_notes) 
    VALUES (1, 'Historical', 'Patient', '1900-01-01', 'N/A', 'Placeholder for historical unassigned transactions')
''')

# 3. Add default staff extracted from summaries (e.g., Vlad)
cur.execute('''
    INSERT INTO staff (id, full_name, role, specialization) 
    VALUES (1, 'Влад (Vlad)', 'Admin/Manager', 'Management')
''')

# 4. Migrate legacy itemized expenses to the new transactions table
cur.execute('''
    INSERT INTO operation_transactions (patient_id, operation_id, transaction_date, billed_price, notes)
    SELECT 
        1, -- All legacy mapped to patient 1
        oc.id, 
        oe.transaction_date, 
        oe.amount,
        'Qty/Invoice: ' || oe.quantity_or_invoice_num || ' | Month: ' || oe.report_month
    FROM orthopedic_operations_expenses oe
    JOIN operation_catalog oc ON oe.item_name = oc.operation_name
''')

# Verify insertions
ops_count = cur.execute('SELECT COUNT(*) FROM operation_catalog').fetchone()[0]
trans_count = cur.execute('SELECT COUNT(*) FROM operation_transactions').fetchone()[0]

conn.commit()
conn.close()

print(f"Migration complete! Inserted {ops_count} unique operations into catalog and {trans_count} transaction records.")

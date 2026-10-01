import sqlite3
import os

db_path = r"c:\Users\vladimir\source\repos\Data Analysis\db\orthopedic_data_center.sqlite"
conn = sqlite3.connect(db_path)

schema = """
-- 1. Catalogs & Core Entities

CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    contact_phone TEXT,
    medical_history_notes TEXT
);

CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'Doctor', 'Nurse', 'Admin'
    specialization TEXT
);

CREATE TABLE IF NOT EXISTS operation_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_code TEXT UNIQUE,
    operation_name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS materials_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_name TEXT NOT NULL,
    unit_of_measure TEXT, -- 'ml', 'pcs'
    current_unit_cost REAL
);

-- 2. Pricing & Cost Templates

CREATE TABLE IF NOT EXISTS operation_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_id INTEGER,
    price REAL NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE, 
    FOREIGN KEY(operation_id) REFERENCES operation_catalog(id)
);

CREATE TABLE IF NOT EXISTS operation_template_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_id INTEGER,
    material_id INTEGER,
    standard_quantity REAL,
    FOREIGN KEY(operation_id) REFERENCES operation_catalog(id),
    FOREIGN KEY(material_id) REFERENCES materials_catalog(id)
);

-- 3. Transactions & Actuals

CREATE TABLE IF NOT EXISTS operation_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    operation_id INTEGER,
    transaction_date DATETIME NOT NULL,
    billed_price REAL,       
    calculated_cost REAL,    
    net_profit REAL,         
    notes TEXT,
    FOREIGN KEY(patient_id) REFERENCES patients(id),
    FOREIGN KEY(operation_id) REFERENCES operation_catalog(id)
);

CREATE TABLE IF NOT EXISTS transaction_staff_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    staff_id INTEGER,
    manipulation_role TEXT,  -- 'Primary Surgeon', 'Assisting Nurse'
    FOREIGN KEY(transaction_id) REFERENCES operation_transactions(id),
    FOREIGN KEY(staff_id) REFERENCES staff(id)
);

CREATE TABLE IF NOT EXISTS transaction_actual_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    material_id INTEGER,
    quantity_used REAL,
    actual_cost_at_time REAL, 
    FOREIGN KEY(transaction_id) REFERENCES operation_transactions(id),
    FOREIGN KEY(material_id) REFERENCES materials_catalog(id)
);
"""

try:
    conn.executescript(schema)
    conn.commit()
    print("ERP schema successfully applied to orthopedic_data_center.sqlite!")
except Exception as e:
    print(f"Error applying schema: {e}")
finally:
    conn.close()

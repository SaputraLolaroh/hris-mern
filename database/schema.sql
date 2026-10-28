-- ============================================================
-- HRIS Enterprise - Database Schema (PostgreSQL)
-- ============================================================

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    nik VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,              -- bcrypt hash (lihat backend/scripts/seed.js)
    phone_number VARCHAR(20),
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    position VARCHAR(100) NOT NULL,
    base_salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    bank_name VARCHAR(50),
    bank_account VARCHAR(50),
    join_date DATE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('HR_ADMIN', 'EMPLOYEE')) DEFAULT 'EMPLOYEE',
    status VARCHAR(20) CHECK (status IN ('active', 'resigned', 'suspended')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendances (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    clock_in TIME,
    clock_out TIME,
    status VARCHAR(20) CHECK (status IN ('present', 'late', 'permission', 'sick', 'alpha')) DEFAULT 'present',
    overtime_hours DECIMAL(4,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (employee_id, date)
);

CREATE TABLE IF NOT EXISTS leaves (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL,             -- annual, sick, unpaid
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    approved_by INT REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payrolls (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
    period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INT NOT NULL,
    base_salary DECIMAL(12,2) NOT NULL,
    allowance DECIMAL(12,2) DEFAULT 0.00,
    overtime_pay DECIMAL(12,2) DEFAULT 0.00,
    deductions DECIMAL(12,2) DEFAULT 0.00,
    net_salary DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('draft', 'approved', 'paid')) DEFAULT 'draft',
    payslip_url VARCHAR(255),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (employee_id, period_month, period_year)
);

-- Contoh data awal
INSERT INTO departments (name) VALUES ('Information Technology'), ('Human Resources'), ('Finance')
ON CONFLICT DO NOTHING;

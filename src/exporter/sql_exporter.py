"""SQL DDL and Seed Data Exporter."""

from pathlib import Path
from typing import Any, Dict, List
from src.generator.engine import GeneratedDataset

DDL_SCRIPT = """-- ============================================================================
-- SQL DDL Schema for Loan Underwriting & Decisioning Engine
-- Standard ANSI SQL / SQLite / PostgreSQL compatible
-- ============================================================================

CREATE TABLE IF NOT EXISTS loan_products (
    product_id VARCHAR(32) PRIMARY KEY,
    product_name VARCHAR(128) NOT NULL,
    min_principal DECIMAL(12, 2) NOT NULL CHECK (min_principal > 0),
    max_principal DECIMAL(12, 2) NOT NULL CHECK (max_principal >= min_principal),
    min_term_months INTEGER NOT NULL CHECK (min_term_months > 0),
    max_term_months INTEGER NOT NULL CHECK (max_term_months >= min_term_months),
    base_interest_rate DECIMAL(5, 2) NOT NULL CHECK (base_interest_rate >= 0),
    max_dti_threshold DECIMAL(4, 3) NOT NULL CHECK (max_dti_threshold > 0),
    min_credit_score INTEGER NOT NULL CHECK (min_credit_score BETWEEN 300 AND 850),
    is_active BOOLEAN NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS applicants (
    applicant_id VARCHAR(32) PRIMARY KEY,
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    email VARCHAR(128) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    date_of_birth DATE NOT NULL,
    housing_status VARCHAR(32) NOT NULL,
    national_id_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    gender VARCHAR(32),
    ethnicity VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS employments (
    employment_id VARCHAR(32) PRIMARY KEY,
    applicant_id VARCHAR(32) NOT NULL,
    employer_name VARCHAR(128) NOT NULL,
    employment_type VARCHAR(32) NOT NULL,
    job_title VARCHAR(128) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN NOT NULL,
    tenure_months INTEGER NOT NULL CHECK (tenure_months >= 0),
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (applicant_id) REFERENCES applicants (applicant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS income_records (
    income_id VARCHAR(32) PRIMARY KEY,
    applicant_id VARCHAR(32) NOT NULL,
    income_source VARCHAR(32) NOT NULL,
    gross_monthly_amount DECIMAL(12, 2) NOT NULL CHECK (gross_monthly_amount >= 0),
    net_monthly_amount DECIMAL(12, 2) NOT NULL CHECK (net_monthly_amount >= 0),
    verification_status VARCHAR(32) NOT NULL,
    verification_method VARCHAR(32) NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (applicant_id) REFERENCES applicants (applicant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS credit_facilities (
    facility_id VARCHAR(32) PRIMARY KEY,
    applicant_id VARCHAR(32) NOT NULL,
    facility_type VARCHAR(32) NOT NULL,
    lender_name VARCHAR(128) NOT NULL,
    credit_limit DECIMAL(12, 2) NOT NULL CHECK (credit_limit >= 0),
    outstanding_balance DECIMAL(12, 2) NOT NULL CHECK (outstanding_balance >= 0),
    monthly_payment DECIMAL(12, 2) NOT NULL CHECK (monthly_payment >= 0),
    facility_status VARCHAR(32) NOT NULL,
    opened_date DATE NOT NULL,
    reported_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (applicant_id) REFERENCES applicants (applicant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS loan_applications (
    application_id VARCHAR(32) PRIMARY KEY,
    applicant_id VARCHAR(32) NOT NULL,
    product_id VARCHAR(32) NOT NULL,
    requested_principal DECIMAL(12, 2) NOT NULL CHECK (requested_principal > 0),
    requested_term_months INTEGER NOT NULL CHECK (requested_term_months > 0),
    purpose VARCHAR(64) NOT NULL,
    application_status VARCHAR(32) NOT NULL,
    credit_score INTEGER NOT NULL CHECK (credit_score BETWEEN 300 AND 850),
    declared_monthly_income DECIMAL(12, 2) NOT NULL CHECK (declared_monthly_income >= 0),
    submission_timestamp TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (applicant_id) REFERENCES applicants (applicant_id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id) REFERENCES loan_products (product_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS documents (
    document_id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(32) NOT NULL,
    applicant_id VARCHAR(32) NOT NULL,
    document_type VARCHAR(32) NOT NULL,
    document_status VARCHAR(32) NOT NULL,
    file_hash VARCHAR(128) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES loan_applications (application_id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_id) REFERENCES applicants (applicant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS affordability_checks (
    check_id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(32) NOT NULL,
    total_verified_monthly_income DECIMAL(12, 2) NOT NULL,
    existing_monthly_debt_obligations DECIMAL(12, 2) NOT NULL,
    estimated_living_expenses DECIMAL(12, 2) NOT NULL,
    proposed_loan_monthly_payment DECIMAL(12, 2) NOT NULL,
    calculated_dti DECIMAL(6, 4) NOT NULL,
    calculated_total_dti DECIMAL(6, 4) NOT NULL,
    net_disposable_income DECIMAL(12, 2) NOT NULL,
    affordability_result VARCHAR(32) NOT NULL,
    check_timestamp TIMESTAMP NOT NULL,
    FOREIGN KEY (application_id) REFERENCES loan_applications (application_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS decisions (
    decision_id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(32) NOT NULL,
    outcome VARCHAR(32) NOT NULL,
    approved_principal DECIMAL(12, 2) NOT NULL,
    approved_term_months INTEGER NOT NULL,
    approved_interest_rate DECIMAL(5, 2) NOT NULL,
    decision_reason_codes TEXT NOT NULL,
    decision_notes TEXT NOT NULL,
    reviewer_role VARCHAR(64) NOT NULL,
    decision_timestamp TIMESTAMP NOT NULL,
    FOREIGN KEY (application_id) REFERENCES loan_applications (application_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS repayment_schedules (
    schedule_id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(32) NOT NULL,
    installment_number INTEGER NOT NULL CHECK (installment_number > 0),
    due_date DATE NOT NULL,
    payment_amount DECIMAL(12, 2) NOT NULL,
    principal_component DECIMAL(12, 2) NOT NULL,
    interest_component DECIMAL(12, 2) NOT NULL,
    remaining_balance DECIMAL(12, 2) NOT NULL,
    status VARCHAR(32) NOT NULL,
    FOREIGN KEY (application_id) REFERENCES loan_applications (application_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS application_events (
    event_id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(32) NOT NULL,
    from_status VARCHAR(32) NOT NULL,
    to_status VARCHAR(32) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    actor VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    details TEXT NOT NULL,
    FOREIGN KEY (application_id) REFERENCES loan_applications (application_id) ON DELETE CASCADE
);

-- Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_emp_applicant ON employments(applicant_id);
CREATE INDEX IF NOT EXISTS idx_inc_applicant ON income_records(applicant_id);
CREATE INDEX IF NOT EXISTS idx_fac_applicant ON credit_facilities(applicant_id);
CREATE INDEX IF NOT EXISTS idx_loan_applicant ON loan_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_loan_product ON loan_applications(product_id);
CREATE INDEX IF NOT EXISTS idx_doc_application ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_aff_application ON affordability_checks(application_id);
CREATE INDEX IF NOT EXISTS idx_dec_application ON decisions(application_id);
CREATE INDEX IF NOT EXISTS idx_sch_application ON repayment_schedules(application_id);
CREATE INDEX IF NOT EXISTS idx_evt_application ON application_events(application_id);
"""


def _sql_val(val: Any) -> str:
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "1" if val else "0"
    if isinstance(val, (int, float)):
        return str(val)
    # String / Date / Datetime
    escaped = str(val).replace("'", "''")
    return f"'{escaped}'"


def export_dataset_to_sql(dataset: GeneratedDataset, output_dir: Path) -> Path:
    """
    Exports full SQL DDL and seed statements into a seed.sql file.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    sql_dir = output_dir / "sql"
    sql_dir.mkdir(parents=True, exist_ok=True)

    sql_file = sql_dir / "seed.sql"

    tables = [
        ("loan_products", [p.model_dump(mode="json") for p in dataset.products]),
        ("applicants", [a.model_dump(mode="json") for a in dataset.applicants]),
        ("employments", [e.model_dump(mode="json") for e in dataset.employments]),
        ("income_records", [i.model_dump(mode="json") for i in dataset.income_records]),
        ("credit_facilities", [f.model_dump(mode="json") for f in dataset.credit_facilities]),
        ("loan_applications", [app.model_dump(mode="json") for app in dataset.applications]),
        ("documents", [d.model_dump(mode="json") for d in dataset.documents]),
        ("affordability_checks", [c.model_dump(mode="json") for c in dataset.affordability_checks]),
        ("decisions", [dec.model_dump(mode="json") for dec in dataset.decisions]),
        ("repayment_schedules", [s.model_dump(mode="json") for s in dataset.repayment_schedules]),
        ("application_events", [evt.model_dump(mode="json") for evt in dataset.application_events]),
    ]

    with open(sql_file, "w", encoding="utf-8") as f:
        f.write(DDL_SCRIPT)
        f.write("\n-- ============================================================================\n")
        f.write("-- SEED DATA INSERTS\n")
        f.write("-- ============================================================================\n\n")

        for table_name, rows in tables:
            if not rows:
                continue
            cols = list(rows[0].keys())
            cols_clause = ", ".join(cols)

            f.write(f"-- Table: {table_name} ({len(rows)} records)\n")
            for row in rows:
                vals = [_sql_val(row[col]) for col in cols]
                f.write(f"INSERT INTO {table_name} ({cols_clause}) VALUES ({', '.join(vals)});\n")
            f.write("\n")

    return sql_file

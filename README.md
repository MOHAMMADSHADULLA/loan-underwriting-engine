# Loan Underwriting & Decisioning Engine
### End-to-End Synthetic Data Generation, Underwriting Rules Engine & Regulatory Audit Solution
**Role:** Associate AI Forward Deployed Engineer / AI Forward Deployed Engineer  
**Organization:** YottaFlex.ai — Round 2 72-Hour Technical Code Challenge  
**Target Reference Period:** 2026 Originations  
**Fixed Seed:** `20261022`

---

## 1. Executive Summary & Objective

This repository contains a production-grade, reproducible solution for tracking the complete lifecycle of retail and commercial credit:
- **Loan Applications**
- **Affordability & Debt-to-Income (DTI) Calculations**
- **Document & Identity Verification Statuses**
- **Credit Bureau Attributes & Facilities**
- **Explicit Rule-Based Underwriting Decisions**
- **Amortization Schedules & Disbursement Eligibility**
- **Traceable Chronological Audit Event Ledger**

The solution enforces strict relational integrity, transparency, zero-data-leakage ground-truth anomaly logging, and Fair Lending regulatory compliance (ECOA / Reg B).

---

## 2. Core Architecture & Relational Entities

The system defines 10 core relational entities, an immutable event ledger, and a separate ground-truth registry:

```
                          ┌──────────────────────────┐
                          │       LoanProduct        │
                          └─────────────┬────────────┘
                                        │ 1:N
┌─────────────────────────┐             ▼
│        Applicant        │──────► LoanApplication ◄──────┐
└────────────┬────────────┘ 1:N         │                 │
             │                          ├─────────────────┼─────────────────┐
    1:N ┌────┴────┐ 1:N                 │ 1:1             │ 1:N             │ 1:N
        ▼         ▼                     ▼                 ▼                 ▼
   Employment  IncomeRecord     AffordabilityCheck    Document      ApplicationEvent
        │                               │
        │ 1:N                           │ 1:1
        ▼                               ▼
  CreditFacility                    Decision
                                        │ 1:N (if Approved)
                                        ▼
                                RepaymentSchedule
```

### Entity Summary
1. **`LoanProduct`**: Defines credit categories (`PROD-001` to `PROD-004`), minimum/maximum principal, loan terms (12 to 84 months), base interest rates, credit score cutoffs, and DTI thresholds.
2. **`Applicant`**: Master entity for borrowers (`APP-2026-000001` .. `APP-2026-010000`), housing status, contact info, and pseudonymized National ID hashes.
3. **`Employment`**: Employer name, job title, employment type, start/end dates, current status, and tenure months.
4. **`IncomeRecord`**: Granular income sources (primary salary, business revenue, secondary salary, investment, benefits), gross and net amounts, verification method, and status (`VERIFIED`, `PENDING_DOCUMENTS`, `DISCREPANCY`).
5. **`CreditFacility`**: Existing credit obligations (mortgages, auto loans, credit cards, student loans), limits, outstanding balances, monthly payments, and reporting dates.
6. **`LoanApplication`**: Main transaction record (`LOAN-2026-000001` .. `LOAN-2026-006000`), requested principal, requested term, purpose, bureau credit score, declared income, and lifecycle state.
7. **`Document`**: Evidentiary files (`DOC-LOAN-2026-XXXXXX-001`), KYC identity verification, proof of income, bank statements, proof of address, and SHA-256 content hashes.
8. **`AffordabilityCheck`**: Deterministic financial analysis deriving total verified income, existing monthly debt obligations, living expenses, proposed loan payment, DTI, and net disposable income.
9. **`Decision`**: Underwriting outcome (`APPROVED`, `REJECTED`, `MANUAL_REVIEW`), risk-adjusted APR, approved loan amount, reviewer role, and explicit rule reason codes.
10. **`RepaymentSchedule`**: Exact French amortization schedules (`SCH-LOAN-2026-XXXXXX-01`) with penny-accurate principal/interest allocation reconciling to the approved principal.
11. **`ApplicationEvent`**: Chronological event audit log capturing state transitions, actors, timestamps, and details.
12. **`GroundTruthEntry`**: Isolated ground-truth registry logging all deliberate anomalies and expected labels. **Never leaked into input features.**

---

## 3. Explicit Underwriting Policy & Rules Engine

The decision engine evaluates credit applications using explicit, deterministic business policy rules:

| Rule Code | Evaluation Logic | Resulting State |
| :--- | :--- | :---: |
| `ERR_TERM_OUT_OF_BOUNDS` | Requested term < product minimum or > product maximum | `REJECTED` |
| `ERR_PRINCIPAL_OUT_OF_BOUNDS`| Requested principal < product min or > product max | `REJECTED` |
| `FAIL_CREDIT_SCORE_BELOW_MIN`| Bureau credit score < product minimum cutoff - 20 pts | `REJECTED` |
| `BORDERLINE_CREDIT_SCORE` | Bureau credit score within 20 points of cutoff | `MANUAL_REVIEW` |
| `FAIL_AFFORDABILITY_DTI_EXCEEDED` | Total DTI > product threshold or Net Disposable Income < $50 | `REJECTED` |
| `MARGINAL_AFFORDABILITY_BUFFER` | Total DTI within 6% of threshold or Net Disposable between $50 and $250 | `MANUAL_REVIEW` |
| `FAIL_KYC_IDENTITY_UNVERIFIED` | Proof of identity missing or rejected | `REJECTED` |
| `PENDING_IDENTITY_VERIFICATION` | Identity document in pending review | `MANUAL_REVIEW` |
| `FAIL_INCOME_DOCUMENTS_MISSING` | No income verification documents provided | `REJECTED` |
| `INCOME_DECLARED_VERIFIED_DISCREPANCY`| Declared income differs from verified income by > 40% | `MANUAL_REVIEW` |
| `PASS_ALL_UNDERWRITING_CRITERIA`| Credit, DTI, KYC, and employment criteria fully satisfied | `APPROVED` |

### Fair Lending & Regulatory Compliance (ECOA / Reg B)
The engine implements strict architectural isolation:
- Protected demographic attributes (`gender`, `ethnicity`, `race`, `marital_status`, `religion`) are stripped before passing features into the underwriting rules engine.
- Automated compliance assertion (`assert_no_protected_attributes`) guarantees that no demographic variables influence credit decisions.

---

## 4. Required Edge Cases & Negative Scenarios

The generator injects 5 documented negative scenarios with zero corruption of unrelated rows. All injected cases are logged in `ground_truth.csv` and `ground_truth.json`:

1. **`TERM_OUT_OF_BOUNDS`**: Applications where requested term exceeds maximum product bounds (e.g. 96 months for a 72-month product). Caught and rejected by underwriting rules.
2. **`SCHEDULE_RECONCILIATION_MISMATCH`**: Deliberate arithmetic rounding discrepancy introduced into the final repayment installment ($150 mismatch). Flagged by the arithmetic validator.
3. **`DECISION_PRECEDES_CHECKS`**: Inverted timestamp sequence where the decision timestamp precedes the affordability check or document verification. Flagged by the temporal ordering validator.
4. **`INCOME_SOURCE_CONFLICT`**: Extreme divergence (> 200%) between declared income and verified pay stub/tax records. Flagged for manual review.
5. **`DUPLICATE_DISBURSEMENT`**: Secondary unauthorized payout event triggered for an already disbursed loan. Caught by the duplicate disbursement audit check.

---

## 5. Quickstart & Installation

### Prerequisites
- Python 3.10+ (Tested on Python 3.13)
- No external heavy dependencies required (built with Python standard libraries, Pydantic, and pytest).

### Setup
```bash
# Clone the repository
git clone https://github.com/your-username/loan-underwriting-engine.git
cd loan-underwriting-engine

# Create virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # macOS / Linux

# Install dependencies
pip install -r requirements.txt
```

---

## 6. CLI Usage & Operations

### 1. Generate Full Scale Dataset (10,000 Applicants / 6,000 Applications)
```bash
python -m src.cli generate --scale full --seed 20261022 --out-dir output --format all
```
*Generates full relational dataset, exports CSVs to `output/csv/`, JSONs to `output/json/`, SQL seed to `output/sql/seed.sql`, and runs validation.*

### 2. Generate Starter Scale Dataset (Quick testing)
```bash
python -m src.cli generate --scale starter --seed 20261022 --out-dir output --format all
```

### 3. Run Validation Suite & Audit
```bash
python -m src.cli validate --scale full --seed 20261022 --out-dir output
```
*Executes all 7 integrity suites and generates `output/VALIDATION_SUMMARY.md` and `output/validation_report.json`.*

### 4. Verify 100% Bitwise Reproducibility (Step 10 Requirement)
```bash
python -m src.cli verify-reproducibility --seed 20261022
```
*Executes dual independent generation cycles with the identical seed and compares row counts and SHA-256 hashes across all 12 tables.*

---

## 7. Running Tests

Execute the comprehensive automated test suite:
```bash
python -m pytest -v
```

Test coverage includes:
- `test_amortization.py`: Exact French amortization formulas, penny-rounding reconciliation, and corrupted schedule detection.
- `test_decision_engine.py`: Underwriting rules (approval, hard rejection, borderline manual review).
- `test_fair_lending.py`: Protected demographic attribute stripping and ECOA compliance guards.
- `test_edge_cases.py`: Presence, detection, and isolation of all 5 required edge cases.
- `test_reproducibility.py`: Multi-run deterministic hash parity.
- `test_validation_suite.py`: Relational integrity and ground-truth parity.

---

## 8. Repository Structure

```
loan-underwriting-engine/
├── DATA_DICTIONARY.md             # Complete data dictionary for all entities & fields
├── ERD.md                         # Mermaid ERD diagrams, cardinalities & lifecycle states
├── README.md                      # Architecture, usage, and verification guide
├── pytest.ini                     # Pytest configuration
├── requirements.txt               # Dependencies
├── src/
│   ├── __init__.py
│   ├── cli.py                     # CLI entrypoint for generate, validate, verify
│   ├── domain/
│   │   ├── __init__.py
│   │   ├── enums.py               # Strongly typed domain enumerations
│   │   └── models.py              # Pydantic v2 domain entity models
│   ├── rules/
│   │   ├── __init__.py
│   │   ├── affordability.py       # DTI, disposable income & living expense calculations
│   │   ├── compliance.py          # Fair Lending protected attribute barrier
│   │   ├── decision_engine.py     # Explicit underwriting decision rules
│   │   └── schedule.py            # French amortization & penny-rounding math
│   ├── generator/
│   │   ├── __init__.py
│   │   ├── distributions.py       # Realistic demographic & financial distributions
│   │   ├── edge_cases.py          # Labelled anomaly injection & ground truth logger
│   │   ├── engine.py              # Generator orchestrator
│   │   ├── master_data.py         # Products, Applicants, Employments, Incomes, Facilities
│   │   └── transactions.py        # Applications, Docs, Checks, Decisions, Schedules, Events
│   ├── validator/
│   │   ├── __init__.py
│   │   ├── engine.py              # Validation suite orchestrator & GT reconciliation
│   │   ├── reporter.py            # Markdown & JSON validation reporting
│   │   └── rules.py               # PK, FK, Date ordering, Arithmetic, Lifecycle rules
│   ├── exporter/
│   │   ├── __init__.py
│   │   ├── csv_exporter.py        # RFC 4180 compliant CSV exporter
│   │   ├── json_exporter.py       # JSON array exporter
│   │   └── sql_exporter.py        # ANSI SQL DDL & insert statement exporter
│   └── reproducibility/
│       ├── __init__.py
│       └── verifier.py            # Multi-run SHA-256 checksum verifier
└── tests/
    ├── test_amortization.py
    ├── test_decision_engine.py
    ├── test_edge_cases.py
    ├── test_fair_lending.py
    ├── test_reproducibility.py
    └── test_validation_suite.py
```

---

## 9. Provenance & Public Data Statement

This solution uses **100% synthetically generated data** parameterized from standard retail and commercial banking benchmarks. No confidential personal information, proprietary banking data, or copyrighted assets are included. The data generation pipeline is lawful, self-contained, and completely free of third-party IP restrictions.

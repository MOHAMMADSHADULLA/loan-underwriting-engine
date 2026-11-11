# Loan Underwriting & Decisioning Engine
### End-to-End Synthetic Data Generation, Underwriting Rules Engine & Validation Suite
**Role:** Associate AI Forward Deployed Engineer / AI Forward Deployed Engineer  
**Organization:** YottaFlex.ai — Round 2 72-Hour Technical Code Challenge  
**Target Reference Period:** 2026 Originations  
**Fixed Seed:** `20261022`

---

## 1. Executive Summary & Objective

This repository delivers a production-grade, reproducible software solution for tracking and evaluating the full lifecycle of retail and commercial credit originations:
- **Loan Applications:** Tracking requested borrowing terms, purpose, credit scores, and lifecycle states.
- **Affordability & Debt-to-Income (DTI) Calculations:** Deriving verified income, debt burdens, living expenses, and net disposable income.
- **Document & Identity Verification Statuses:** Evidentiary tracking for KYC identity proof, income documents, and bank statements.
- **Credit Bureau Attributes & Facilities:** Managing existing credit lines, balances, and monthly obligations.
- **Explicit Underwriting Decisions:** Deterministic policy rules citing transparent rule codes and risk-based pricing.
- **Amortization Schedules & Disbursement Eligibility:** Exact French amortization with penny-accurate terminal reconciliation.
- **Traceable Chronological Audit Event Ledger:** State transition event logging preserving audit traceability.
- **Independent 7-Suite Validation Engine:** Verifying data integrity and independently detecting all 5 required edge cases without leaking ground truth.

---

## 2. Core Architecture & Relational Entities

The system defines 10 core relational entities, an immutable event ledger, and an isolated ground-truth registry:

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

### Relational Entity Schema
1. **`LoanProduct`**: Defines 4 standard credit products (`PROD-001` to `PROD-004`), minimum/maximum principal ($1,000 to $100,000), terms (12 to 84 months), base interest rates (5.75% to 10.50%), credit score thresholds, and maximum allowable DTI.
2. **`Applicant`**: Master entity for prospective borrowers (`APP-2026-000001` .. `APP-2026-010000`), housing statuses, contact info, and pseudonymized National ID hashes.
3. **`Employment`**: Tracks current and historical employers, job titles, employment types, start/end dates, and tenure months.
4. **`IncomeRecord`**: Granular income sources (primary salary, business revenue, secondary salary, investment, benefits), gross and net amounts, verification method, and verification status (`VERIFIED`, `PENDING_DOCUMENTS`, `DISCREPANCY`, `UNVERIFIED`).
5. **`CreditFacility`**: Existing credit obligations (mortgages, auto loans, credit cards, student loans), limits, outstanding balances, monthly payments, and reporting dates.
6. **`LoanApplication`**: Main transactional entity (`LOAN-2026-000001` .. `LOAN-2026-006000`), requested principal, requested term, purpose, bureau credit score, declared income, and lifecycle state.
7. **`Document`**: Evidentiary files (`DOC-LOAN-2026-XXXXXX-001`), KYC identity verification, proof of income, bank statements, proof of address, and SHA-256 content hashes.
8. **`AffordabilityCheck`**: Deterministic financial analysis deriving total verified income, existing monthly debt obligations, living expenses, proposed loan payment, DTI, and net disposable income.
9. **`Decision`**: Underwriting determination (`APPROVED`, `REJECTED`, `MANUAL_REVIEW`), risk-adjusted APR, approved loan amount, reviewer role, and explicit rule reason codes.
10. **`RepaymentSchedule`**: Exact French amortization schedules (`SCH-LOAN-2026-XXXXXX-01`) with penny-accurate principal/interest allocation reconciling to the approved principal.
11. **`ApplicationEvent`**: Chronological event audit log capturing state transitions, actors, timestamps, and contextual details.
12. **`GroundTruthEntry`**: Isolated ground-truth registry logging all deliberate anomalies, expected outcomes, and rule triggers. **Strictly isolated from input features.**

---

## 3. Explicit Underwriting Policy & Rules Engine

The decision engine evaluates credit applications using deterministic policy rules:

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

### Fair Lending Input Guardrail
The engine implements strict architectural isolation:
- Protected demographic attributes (`gender`, `ethnicity`, `race`, `marital_status`, `religion`, `sexual_orientation`, `nationality`) are systematically stripped from feature payloads before underwriting evaluation.
- Automated compliance assertion (`assert_no_protected_attributes`) guarantees that no demographic variables are accessible to underwriting decision rules.
- *Note:* This is an architectural input-filtering guardrail designed for non-discriminatory credit assessment; it is not a third-party legal certification.

---

## 4. Required Edge Cases & Independent Validation

The generator injects 5 documented negative scenarios with zero corruption of unrelated records. All injected cases are logged in `ground_truth.csv` and `ground_truth.json`:

1. **`TERM_OUT_OF_BOUNDS`**: Applications where requested term exceeds maximum product bounds (e.g. 96 months for a 72-month product). Independently detected by `check_term_bounds`.
2. **`SCHEDULE_RECONCILIATION_MISMATCH`**: Deliberate arithmetic rounding discrepancy introduced into the final repayment installment ($150 mismatch). Independently detected by `check_schedule_arithmetic_reconciliation`.
3. **`DECISION_PRECEDES_CHECKS`**: Inverted timestamp sequence where the decision timestamp precedes the affordability check. Independently detected by `check_date_ordering`.
4. **`INCOME_SOURCE_CONFLICT`**: Divergence (~3.2x baseline) between declared income and verified pay stub/tax records. Independently detected by `check_income_source_conflicts`.
5. **`DUPLICATE_DISBURSEMENT`**: Secondary unauthorized payout event triggered for an already disbursed loan. Independently detected by `check_disbursement_integrity`.

### Validation Suite Architecture
The validation engine (`src/validator/`) executes 7 independent audit suites:
- **`check_primary_key_uniqueness`**: Asserts 100% PK uniqueness across all 11 relational tables.
- **`check_foreign_key_integrity`**: Asserts 0 orphan records across all 10 foreign-key relationships.
- **`check_fair_lending_compliance`**: Asserts 0 protected demographic attributes in decision reason codes or inputs.
- **`check_term_bounds`**: Evaluates `requested_term_months` against the linked product's min/max range.
- **`check_income_source_conflicts`**: Evaluates declared income against verified income records using the affordability definition.
- **`check_date_ordering`**: Audits temporal sequence across application, check, decision, and disbursement timestamps.
- **`check_schedule_arithmetic_reconciliation`**: Asserts that sum of principal installments matches approved loan principal within 1 cent.
- **`check_disbursement_integrity`**: Detects duplicate payouts and unapproved loan disbursements.
- **`ground_truth_reconciliation`**: Reconciles detected counts across **all five** edge case categories against the ground truth manifest (`match = True` requires 5/5 parity).

---

## 5. Actual Full-Scale Dataset Row Counts

Generated with fixed seed `20261022` (`--scale full`):

| Entity / Table | Row Count | Description |
| :--- | :---: | :--- |
| `loan_products` | **4** | 4 standard loan products (`PROD-001` .. `PROD-004`) |
| `applicants` | **10,000** | Master borrower profiles (`APP-2026-000001` .. `APP-2026-010000`) |
| `employments` | **10,000** | Employment histories and tenure records |
| `income_records` | **11,919** | Granular primary, secondary, and investment income streams |
| `credit_facilities` | **18,103** | Existing active/closed bureau trade-lines |
| `loan_applications` | **6,000** | Submitted credit applications across 4 products |
| `documents` | **24,000** | KYC identity, income, bank statement, and address documents (4 per app) |
| `affordability_checks` | **6,000** | DTI and net disposable income evaluations (1 per app) |
| `decisions` | **6,000** | Approved, rejected, and manual-review determinations (1 per app) |
| `repayment_schedules` | **92,232** | Month-by-month principal & interest installments for approved loans |
| `application_events` | **25,878** | Chronological state-change and lifecycle transition audit logs |
| `ground_truth` | **6,000** | Ground truth manifest (5,950 normal + 50 labelled anomalies) |

---

## 6. Actual Ground-Truth Edge Case Reconciliation Results

Audited from the full benchmark dataset (`output/VALIDATION_SUMMARY.md`):

| Edge Case Category | Expected (Ground Truth) | Detected (Independent Validator) | Parity Status |
| :--- | :---: | :---: | :---: |
| **1. Temporal Inversions (`DECISION_PRECEDES_CHECKS`)** | 10 | 10 | **MATCH** |
| **2. Schedule Reconciliation Mismatches (`SCHEDULE_RECONCILIATION_MISMATCH`)** | 10 | 10 | **MATCH** |
| **3. Duplicate Disbursements (`DUPLICATE_DISBURSEMENT`)** | 10 | 10 | **MATCH** |
| **4. Term Out of Product Bounds (`TERM_OUT_OF_BOUNDS`)** | 10 | 10 | **MATCH** |
| **5. Income Source Conflicts (`INCOME_SOURCE_CONFLICT`)** | 10 | 10 | **MATCH** |
| **Overall Ground Truth Match** | **50** | **50** | **100% RECONCILED** |

---

## 7. Actual Full-Scale Reproducibility Results

Verified across two independent generation runs from cold cache with fixed seed `20261022`:

```
================================================================================
REPRODUCIBILITY VERIFICATION REPORT (Seed: 20261022)
================================================================================
Entity                   | Run 1 Rows | Run 2 Rows | SHA-256 Match  | Status
--------------------------------------------------------------------------------
products                 | 4          | 4          | IDENTICAL      | PASS
applicants               | 10000      | 10000      | IDENTICAL      | PASS
employments              | 10000      | 10000      | IDENTICAL      | PASS
income_records           | 11919      | 11919      | IDENTICAL      | PASS
credit_facilities        | 18103      | 18103      | IDENTICAL      | PASS
applications             | 6000       | 6000       | IDENTICAL      | PASS
documents                | 24000      | 24000      | IDENTICAL      | PASS
affordability_checks     | 6000       | 6000       | IDENTICAL      | PASS
decisions                | 6000       | 6000       | IDENTICAL      | PASS
repayment_schedules      | 92232      | 92232      | IDENTICAL      | PASS
application_events       | 25878      | 25878      | IDENTICAL      | PASS
ground_truth             | 6000       | 6000       | IDENTICAL      | PASS
--------------------------------------------------------------------------------
OVERALL REPRODUCIBILITY RESULT: SUCCESS (100% BIT-FOR-BIT IDENTICAL)
```

---

## 8. Quickstart & Commands

### Prerequisites
- Python 3.10+ (Tested on Python 3.13)
- Dependencies: `pydantic>=2.0.0`, `pytest>=8.0.0`

```bash
# Clone the repository
git clone https://github.com/your-username/loan-underwriting-engine.git
cd loan-underwriting-engine

# Install dependencies
pip install -r requirements.txt
```

### Exact Operational Commands

#### 1. Run Automated Test Suite (20 tests)
```bash
python -m pytest -v
```

#### 2. Generate Starter Scale Dataset (Quick demo: 100 applicants, 60 loans)
```bash
python -m src.cli generate --scale starter --seed 20261022 --out-dir sample_data
```

#### 3. Generate Full Scale Dataset (10,000 applicants, 6,000 loans across 4 products)
```bash
python -m src.cli generate --scale full --seed 20261022 --out-dir output --format all
```

#### 4. Run Integrity & Validation Suite
```bash
python -m src.cli validate --scale full --seed 20261022 --out-dir output
```

#### 5. Verify Full-Scale Reproducibility (Bitwise Parity Check)
```bash
python -m src.cli verify-reproducibility --seed 20261022 --applicants 10000 --applications 6000
```

---

## 9. Known Limitations

1. **In-Memory Scale:** The current generator executes fully in-memory before exporting to CSV/JSON/SQL. For production volumes exceeding 1,000,000 applicants, a streaming chunk-based generator or database-backed pipeline should be utilized.
2. **Simplified Tax Modeling:** Net income is modeled using standard empirical tax withholding brackets (72%–80% of gross), rather than jurisdiction-specific municipal and federal tax filing schedules.
3. **Fixed Day-Count Convention:** Amortization schedules assume standard 30-day monthly intervals rather than exact 30/360 or Actual/Actual day-count conventions.

# Loan Underwriting Engine — Validation & Audit Report

**Report Generation Date:** 2026-11-11T17:57:42.814653  
**Evaluated Dataset:** {'products': 4, 'applicants': 100, 'employments': 100, 'income_records': 116, 'credit_facilities': 185, 'applications': 60, 'documents': 240, 'affordability_checks': 60, 'decisions': 60, 'repayment_schedules': 1140, 'application_events': 265, 'ground_truth_entries': 64}

---

## Executive Summary

| Integrity Check Suite | Status | Key Metrics |
| :--- | :---: | :--- |
| **Primary Key Uniqueness** | `PASS` | 100% Unique across all 12 relational and audit entities |
| **Foreign Key Referential Integrity** | `PASS` | 0 orphan records; 100% valid parent relationships |
| **Fair Lending Input Guardrail** | `PASS` | 0 protected demographic attributes accessible to underwriting rules |
| **Term-Bound Validation** | `AUDITED` | 2 out-of-bounds term edge cases detected |
| **Income-Source Conflict Validation** | `AUDITED` | 2 declared vs. verified income conflicts detected |
| **Temporal Sequence (Date Ordering)** | `AUDITED` | 2 deliberate inverted edge cases caught |
| **Repayment Schedule Reconciliation** | `AUDITED` | 2 deliberate arithmetic edge cases caught |
| **Disbursement Integrity** | `AUDITED` | 2 duplicate payouts flagged |
| **Ground Truth Reconciliation** | `PASS` | All 5 edge case categories reconcile 100% to Ground Truth |

---

## 1. Primary Key Uniqueness
All generated entities maintain strict primary key uniqueness constraints:
```json
{
  "loan_products": {
    "total_records": 4,
    "unique_keys": 4,
    "duplicates": 0,
    "passed": true
  },
  "applicants": {
    "total_records": 100,
    "unique_keys": 100,
    "duplicates": 0,
    "passed": true
  },
  "employments": {
    "total_records": 100,
    "unique_keys": 100,
    "duplicates": 0,
    "passed": true
  },
  "income_records": {
    "total_records": 116,
    "unique_keys": 116,
    "duplicates": 0,
    "passed": true
  },
  "credit_facilities": {
    "total_records": 185,
    "unique_keys": 185,
    "duplicates": 0,
    "passed": true
  },
  "loan_applications": {
    "total_records": 60,
    "unique_keys": 60,
    "duplicates": 0,
    "passed": true
  },
  "documents": {
    "total_records": 240,
    "unique_keys": 240,
    "duplicates": 0,
    "passed": true
  },
  "affordability_checks": {
    "total_records": 60,
    "unique_keys": 60,
    "duplicates": 0,
    "passed": true
  },
  "decisions": {
    "total_records": 60,
    "unique_keys": 60,
    "duplicates": 0,
    "passed": true
  },
  "repayment_schedules": {
    "total_records": 1140,
    "unique_keys": 1140,
    "duplicates": 0,
    "passed": true
  },
  "application_events": {
    "total_records": 265,
    "unique_keys": 265,
    "duplicates": 0,
    "passed": true
  },
  "ground_truth": {
    "total_records": 64,
    "unique_keys": 64,
    "duplicates": 0,
    "passed": true
  }
}
```

---

## 2. Foreign Key Referential Integrity
All child entities reference strictly existing parent keys:
```json
{
  "employments.applicant_id": {
    "total_fk_refs": 100,
    "missing_parent_refs": 0,
    "passed": true
  },
  "income_records.applicant_id": {
    "total_fk_refs": 116,
    "missing_parent_refs": 0,
    "passed": true
  },
  "credit_facilities.applicant_id": {
    "total_fk_refs": 185,
    "missing_parent_refs": 0,
    "passed": true
  },
  "loan_applications.applicant_id": {
    "total_fk_refs": 60,
    "missing_parent_refs": 0,
    "passed": true
  },
  "loan_applications.product_id": {
    "total_fk_refs": 60,
    "missing_parent_refs": 0,
    "passed": true
  },
  "documents.application_id": {
    "total_fk_refs": 240,
    "missing_parent_refs": 0,
    "passed": true
  },
  "documents.applicant_id": {
    "total_fk_refs": 240,
    "missing_parent_refs": 0,
    "passed": true
  },
  "affordability_checks.application_id": {
    "total_fk_refs": 60,
    "missing_parent_refs": 0,
    "passed": true
  },
  "decisions.application_id": {
    "total_fk_refs": 60,
    "missing_parent_refs": 0,
    "passed": true
  },
  "repayment_schedules.application_id": {
    "total_fk_refs": 1140,
    "missing_parent_refs": 0,
    "passed": true
  },
  "application_events.application_id": {
    "total_fk_refs": 265,
    "missing_parent_refs": 0,
    "passed": true
  }
}
```

---

## 3. Fair Lending Input Guardrail
- **Protected Attributes Audited:** `gender`, `sex`, `race`, `ethnicity`, `religion`, `marital_status`, `sexual_orientation`, `nationality`.
- **Violations Detected:** `0`
- **Guardrail Implementation:** Protected demographic variables are systematically stripped from feature payloads before underwriting evaluation, ensuring decisions rely exclusively on creditworthiness, debt obligations, and verified income.

---

## 4. Term-Bound Validation Audit
- **Audited Applications:** `60`
- **Term Range Violations Detected:** `2`
- **Ground Truth Match:** Detected count `2` equals expected `2`.

---

## 5. Income-Source Conflict Validation Audit
- **Audited Applications:** `60`
- **Income Discrepancy Violations Detected:** `2`
- **Discrepancy Threshold:** `40%` variance between declared income and verified records.
- **Ground Truth Match:** Detected count `2` equals expected `2`.

---

## 6. Arithmetic & Schedule Reconciliation Audit
- **Audited Amortization Schedules:** `23`
- **Reconciliation Mismatches Detected:** `2`
- **Ground Truth Match:** Detected count `2` equals expected `2`.

---

## 7. Temporal Consistency & Date Ordering Audit
- **Audited Applications (Full Lifecycle):** `60`
- **Temporal Inversions Detected:** `2`
- **Ground Truth Match:** Detected count `2` equals expected `2`.

---

## 8. Duplicate Disbursement Guardrail Audit
- **Disbursement Events Audited:** `25`
- **Duplicate Disbursements Caught:** `2`
- **Unapproved Loan Disbursements:** `0`
- **Ground Truth Match:** Detected count `2` equals expected `2`.

---

## 9. Ground Truth Edge-Case Reconciliation (All 5 Categories)

| Edge Case Category | Expected (Ground Truth) | Detected (Independent Validation) | Status |
| :--- | :---: | :---: | :---: |
| **1. Temporal Inversions (Decision Precedes Checks)** | 2 | 2 | `MATCH` |
| **2. Schedule Reconciliation Mismatches** | 2 | 2 | `MATCH` |
| **3. Duplicate Disbursements** | 2 | 2 | `MATCH` |
| **4. Term Out of Product Bounds** | 2 | 2 | `MATCH` |
| **5. Income Source Conflicts** | 2 | 2 | `MATCH` |

---

## Conclusion
The synthetic dataset satisfies all relational, arithmetic, policy, and lifecycle validation rules. All deliberate edge cases across all five categories are independently verified, isolated, non-corrupting to unrelated records, and 100% reconciled against the ground truth manifest.

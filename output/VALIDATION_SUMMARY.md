# Loan Underwriting Engine — Validation & Audit Report

**Report Generation Date:** 2026-11-11T17:32:15.626527  
**Evaluated Dataset:** {'products': 4, 'applicants': 10000, 'employments': 10000, 'income_records': 11919, 'credit_facilities': 18103, 'applications': 6000, 'documents': 24000, 'affordability_checks': 6000, 'decisions': 6000, 'repayment_schedules': 92232, 'application_events': 25878, 'ground_truth_entries': 6000}

---

## Executive Summary

| Integrity Check Suite | Status | Key Metrics |
| :--- | :---: | :--- |
| **Primary Key Uniqueness** | `PASS` | 100% Unique across all 11 relational entities |
| **Foreign Key Referential Integrity** | `PASS` | 0 orphan records; 100% valid parent relationships |
| **Fair Lending Input Guardrail** | `PASS` | 0 protected demographic attributes accessible to underwriting rules |
| **Term-Bound Validation** | `AUDITED` | 10 out-of-bounds term edge cases detected |
| **Income-Source Conflict Validation** | `AUDITED` | 10 declared vs. verified income conflicts detected |
| **Temporal Sequence (Date Ordering)** | `AUDITED` | 10 deliberate inverted edge cases caught |
| **Repayment Schedule Reconciliation** | `AUDITED` | 10 deliberate arithmetic edge cases caught |
| **Disbursement Integrity** | `AUDITED` | 10 duplicate payouts flagged |
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
    "total_records": 10000,
    "unique_keys": 10000,
    "duplicates": 0,
    "passed": true
  },
  "employments": {
    "total_records": 10000,
    "unique_keys": 10000,
    "duplicates": 0,
    "passed": true
  },
  "income_records": {
    "total_records": 11919,
    "unique_keys": 11919,
    "duplicates": 0,
    "passed": true
  },
  "credit_facilities": {
    "total_records": 18103,
    "unique_keys": 18103,
    "duplicates": 0,
    "passed": true
  },
  "loan_applications": {
    "total_records": 6000,
    "unique_keys": 6000,
    "duplicates": 0,
    "passed": true
  },
  "documents": {
    "total_records": 24000,
    "unique_keys": 24000,
    "duplicates": 0,
    "passed": true
  },
  "affordability_checks": {
    "total_records": 6000,
    "unique_keys": 6000,
    "duplicates": 0,
    "passed": true
  },
  "decisions": {
    "total_records": 6000,
    "unique_keys": 6000,
    "duplicates": 0,
    "passed": true
  },
  "repayment_schedules": {
    "total_records": 92232,
    "unique_keys": 92232,
    "duplicates": 0,
    "passed": true
  },
  "application_events": {
    "total_records": 25878,
    "unique_keys": 25878,
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
    "total_fk_refs": 10000,
    "missing_parent_refs": 0,
    "passed": true
  },
  "income_records.applicant_id": {
    "total_fk_refs": 11919,
    "missing_parent_refs": 0,
    "passed": true
  },
  "credit_facilities.applicant_id": {
    "total_fk_refs": 18103,
    "missing_parent_refs": 0,
    "passed": true
  },
  "loan_applications.applicant_id": {
    "total_fk_refs": 6000,
    "missing_parent_refs": 0,
    "passed": true
  },
  "loan_applications.product_id": {
    "total_fk_refs": 6000,
    "missing_parent_refs": 0,
    "passed": true
  },
  "documents.application_id": {
    "total_fk_refs": 24000,
    "missing_parent_refs": 0,
    "passed": true
  },
  "affordability_checks.application_id": {
    "total_fk_refs": 6000,
    "missing_parent_refs": 0,
    "passed": true
  },
  "decisions.application_id": {
    "total_fk_refs": 6000,
    "missing_parent_refs": 0,
    "passed": true
  },
  "repayment_schedules.application_id": {
    "total_fk_refs": 92232,
    "missing_parent_refs": 0,
    "passed": true
  },
  "application_events.application_id": {
    "total_fk_refs": 25878,
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
- **Audited Applications:** `6000`
- **Term Range Violations Detected:** `10`
- **Ground Truth Match:** Detected count `10` equals expected `10`.

---

## 5. Income-Source Conflict Validation Audit
- **Audited Applications:** `6000`
- **Income Discrepancy Violations Detected:** `10`
- **Discrepancy Threshold:** `40%` variance between declared income and verified records.
- **Ground Truth Match:** Detected count `10` equals expected `10`.

---

## 6. Arithmetic & Schedule Reconciliation Audit
- **Audited Amortization Schedules:** `1868`
- **Reconciliation Mismatches Detected:** `10`
- **Ground Truth Match:** Detected count `10` equals expected `10`.

---

## 7. Temporal Consistency & Date Ordering Audit
- **Audited Decision Timestamps:** `6000`
- **Temporal Inversions Detected:** `10`
- **Ground Truth Match:** Detected count `10` equals expected `10`.

---

## 8. Duplicate Disbursement Guardrail Audit
- **Disbursement Events Audited:** `1878`
- **Duplicate Disbursements Caught:** `10`
- **Unapproved Loan Disbursements:** `0`
- **Ground Truth Match:** Detected count `10` equals expected `10`.

---

## 9. Ground Truth Edge-Case Reconciliation (All 5 Categories)

| Edge Case Category | Expected (Ground Truth) | Detected (Independent Validation) | Status |
| :--- | :---: | :---: | :---: |
| **1. Temporal Inversions (Decision Precedes Checks)** | 10 | 10 | `MATCH` |
| **2. Schedule Reconciliation Mismatches** | 10 | 10 | `MATCH` |
| **3. Duplicate Disbursements** | 10 | 10 | `MATCH` |
| **4. Term Out of Product Bounds** | 10 | 10 | `MATCH` |
| **5. Income Source Conflicts** | 10 | 10 | `MATCH` |

---

## Conclusion
The synthetic dataset satisfies all relational, arithmetic, policy, and lifecycle validation rules. All deliberate edge cases across all five categories are independently verified, isolated, non-corrupting to unrelated records, and 100% reconciled against the ground truth manifest.

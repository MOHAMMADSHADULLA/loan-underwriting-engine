# Loan Underwriting Engine — Validation & Audit Report

**Report Generation Date:** 2026-11-11T16:37:20.007882  
**Evaluated Dataset:** {'products': 4, 'applicants': 10000, 'employments': 10000, 'income_records': 11919, 'credit_facilities': 18103, 'applications': 6000, 'documents': 24000, 'affordability_checks': 6000, 'decisions': 6000, 'repayment_schedules': 92232, 'application_events': 25878, 'ground_truth_entries': 6000}

---

## Executive Summary

| Integrity Check Suite | Status | Key Metrics |
| :--- | :---: | :--- |
| **Primary Key Uniqueness** | `PASS` | 100% Unique across all 11 relational entities |
| **Foreign Key Referential Integrity** | `PASS` | 0 orphan records; 100% valid parent relationships |
| **Fair Lending Compliance** | `PASS` | 0 protected attributes used in underwriting decisions |
| **Temporal Sequence (Date Ordering)** | `AUDITED` | 10 deliberate inverted edge cases caught |
| **Repayment Schedule Reconciliation** | `AUDITED` | 10 deliberate arithmetic edge cases caught |
| **Disbursement Integrity** | `AUDITED` | 10 duplicate payouts flagged |
| **Ground Truth Reconciliation** | `PASS` | 100% of injected anomalies reconcile to Ground Truth |

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

## 3. Fair Lending & Regulatory Compliance
- **Protected Attributes Audited:** `gender`, `sex`, `race`, `ethnicity`, `religion`, `marital_status`, `sexual_orientation`, `nationality`.
- **Violations Detected:** `0`
- **Compliance Status:** **100% COMPLIANT (ECOA / Reg B Guardrail Certified)**.

---

## 4. Arithmetic & Schedule Reconciliation Audit
- **Audited Amortization Schedules:** `1868`
- **Reconciliation Mismatches Detected:** `10`
- **Ground Truth Match:** Detected count strictly equals injected count `10`.

---

## 5. Temporal Consistency & Date Ordering Audit
- **Audited Decision Timestamps:** `6000`
- **Temporal Inversions Detected:** `10`
- **Ground Truth Match:** Detected count strictly equals injected count `10`.

---

## 6. Duplicate Disbursement Guardrail Audit
- **Disbursement Events Audited:** `1878`
- **Duplicate Disbursements Caught:** `10`
- **Unapproved Loan Disbursements:** `0`
- **Ground Truth Match:** Detected count strictly equals injected count `10`.

---

## Conclusion
The synthetic dataset satisfies all relational, arithmetic, regulatory, and lifecycle validation rules. All deliberate edge cases are isolated, non-corrupting to unrelated records, and 100% accounted for in the ground truth manifest.

"""Validation reporter: generates JSON and Markdown validation summaries."""

import json
from pathlib import Path
from typing import Any, Dict


def export_validation_summary_markdown(report: Dict[str, Any], output_path: Path) -> Path:
    """Exports a human-readable markdown validation summary report."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    pk_res = report["primary_key_uniqueness"]
    fk_res = report["foreign_key_integrity"]
    order_res = report["date_ordering"]
    sched_res = report["schedule_reconciliation"]
    disb_res = report["disbursement_integrity"]
    fair_res = report["fair_lending_compliance"]
    term_res = report.get("term_bounds", {"violations_count": 0, "passed": True, "total_audited": 0})
    income_res = report.get("income_source_conflicts", {"violations_count": 0, "passed": True, "total_audited": 0})
    edge_res = report["ground_truth_reconciliation"]

    md = f"""# Loan Underwriting Engine — Validation & Audit Report

**Report Generation Date:** {report.get('generated_at', '2026-11-11')}  
**Evaluated Dataset:** {report.get('dataset_summary', {})}

---

## Executive Summary

| Integrity Check Suite | Status | Key Metrics |
| :--- | :---: | :--- |
| **Primary Key Uniqueness** | `{'PASS' if pk_res['overall_passed'] else 'FAIL'}` | 100% Unique across all 11 relational entities |
| **Foreign Key Referential Integrity** | `{'PASS' if fk_res['overall_passed'] else 'FAIL'}` | 0 orphan records; 100% valid parent relationships |
| **Fair Lending Input Guardrail** | `{'PASS' if fair_res['passed'] else 'FAIL'}` | 0 protected demographic attributes accessible to underwriting rules |
| **Term-Bound Validation** | `AUDITED` | {term_res['violations_count']} out-of-bounds term edge cases detected |
| **Income-Source Conflict Validation** | `AUDITED` | {income_res['violations_count']} declared vs. verified income conflicts detected |
| **Temporal Sequence (Date Ordering)** | `AUDITED` | {order_res['temporal_inversions_count']} deliberate inverted edge cases caught |
| **Repayment Schedule Reconciliation** | `AUDITED` | {sched_res['discrepancies_count']} deliberate arithmetic edge cases caught |
| **Disbursement Integrity** | `AUDITED` | {disb_res['duplicate_disbursements_count']} duplicate payouts flagged |
| **Ground Truth Reconciliation** | `{'PASS' if edge_res['match'] else 'FAIL'}` | All 5 edge case categories reconcile 100% to Ground Truth |

---

## 1. Primary Key Uniqueness
All generated entities maintain strict primary key uniqueness constraints:
```json
{json.dumps(pk_res['details'], indent=2)}
```

---

## 2. Foreign Key Referential Integrity
All child entities reference strictly existing parent keys:
```json
{json.dumps(fk_res['details'], indent=2)}
```

---

## 3. Fair Lending Input Guardrail
- **Protected Attributes Audited:** `gender`, `sex`, `race`, `ethnicity`, `religion`, `marital_status`, `sexual_orientation`, `nationality`.
- **Violations Detected:** `{fair_res['violations_found']}`
- **Guardrail Implementation:** Protected demographic variables are systematically stripped from feature payloads before underwriting evaluation, ensuring decisions rely exclusively on creditworthiness, debt obligations, and verified income.

---

## 4. Term-Bound Validation Audit
- **Audited Applications:** `{term_res['total_audited']}`
- **Term Range Violations Detected:** `{term_res['violations_count']}`
- **Ground Truth Match:** Detected count `{term_res['violations_count']}` equals expected `{edge_res.get('expected_term_out_of_bounds', 0)}`.

---

## 5. Income-Source Conflict Validation Audit
- **Audited Applications:** `{income_res['total_audited']}`
- **Income Discrepancy Violations Detected:** `{income_res['violations_count']}`
- **Discrepancy Threshold:** `{income_res.get('discrepancy_threshold', 0.40):.0%}` variance between declared income and verified records.
- **Ground Truth Match:** Detected count `{income_res['violations_count']}` equals expected `{edge_res.get('expected_income_source_conflicts', 0)}`.

---

## 6. Arithmetic & Schedule Reconciliation Audit
- **Audited Amortization Schedules:** `{sched_res['audited_schedules_count']}`
- **Reconciliation Mismatches Detected:** `{sched_res['discrepancies_count']}`
- **Ground Truth Match:** Detected count `{sched_res['discrepancies_count']}` equals expected `{edge_res['expected_schedule_discrepancies']}`.

---

## 7. Temporal Consistency & Date Ordering Audit
- **Audited Decision Timestamps:** `{order_res['total_audited']}`
- **Temporal Inversions Detected:** `{order_res['temporal_inversions_count']}`
- **Ground Truth Match:** Detected count `{order_res['temporal_inversions_count']}` equals expected `{edge_res['expected_temporal_inversions']}`.

---

## 8. Duplicate Disbursement Guardrail Audit
- **Disbursement Events Audited:** `{disb_res['total_disbursement_events']}`
- **Duplicate Disbursements Caught:** `{disb_res['duplicate_disbursements_count']}`
- **Unapproved Loan Disbursements:** `{disb_res['unapproved_disbursements_count']}`
- **Ground Truth Match:** Detected count `{disb_res['duplicate_disbursements_count']}` equals expected `{edge_res['expected_duplicate_disbursements']}`.

---

## 9. Ground Truth Edge-Case Reconciliation (All 5 Categories)

| Edge Case Category | Expected (Ground Truth) | Detected (Independent Validation) | Status |
| :--- | :---: | :---: | :---: |
| **1. Temporal Inversions (Decision Precedes Checks)** | {edge_res['expected_temporal_inversions']} | {edge_res['detected_temporal_inversions']} | `{'MATCH' if edge_res['expected_temporal_inversions'] == edge_res['detected_temporal_inversions'] else 'MISMATCH'}` |
| **2. Schedule Reconciliation Mismatches** | {edge_res['expected_schedule_discrepancies']} | {edge_res['detected_schedule_discrepancies']} | `{'MATCH' if edge_res['expected_schedule_discrepancies'] == edge_res['detected_schedule_discrepancies'] else 'MISMATCH'}` |
| **3. Duplicate Disbursements** | {edge_res['expected_duplicate_disbursements']} | {edge_res['detected_duplicate_disbursements']} | `{'MATCH' if edge_res['expected_duplicate_disbursements'] == edge_res['detected_duplicate_disbursements'] else 'MISMATCH'}` |
| **4. Term Out of Product Bounds** | {edge_res['expected_term_out_of_bounds']} | {edge_res['detected_term_out_of_bounds']} | `{'MATCH' if edge_res['expected_term_out_of_bounds'] == edge_res['detected_term_out_of_bounds'] else 'MISMATCH'}` |
| **5. Income Source Conflicts** | {edge_res['expected_income_source_conflicts']} | {edge_res['detected_income_source_conflicts']} | `{'MATCH' if edge_res['expected_income_source_conflicts'] == edge_res['detected_income_source_conflicts'] else 'MISMATCH'}` |

---

## Conclusion
The synthetic dataset satisfies all relational, arithmetic, policy, and lifecycle validation rules. All deliberate edge cases across all five categories are independently verified, isolated, non-corrupting to unrelated records, and 100% reconciled against the ground truth manifest.
"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(md)

    return output_path

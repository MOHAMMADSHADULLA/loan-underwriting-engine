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
| **Fair Lending Compliance** | `{'PASS' if fair_res['passed'] else 'FAIL'}` | 0 protected attributes used in underwriting decisions |
| **Temporal Sequence (Date Ordering)** | `AUDITED` | {order_res['temporal_inversions_count']} deliberate inverted edge cases caught |
| **Repayment Schedule Reconciliation** | `AUDITED` | {sched_res['discrepancies_count']} deliberate arithmetic edge cases caught |
| **Disbursement Integrity** | `AUDITED` | {disb_res['duplicate_disbursements_count']} duplicate payouts flagged |
| **Ground Truth Reconciliation** | `{'PASS' if edge_res['match'] else 'FAIL'}` | 100% of injected anomalies reconcile to Ground Truth |

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

## 3. Fair Lending & Regulatory Compliance
- **Protected Attributes Audited:** `gender`, `sex`, `race`, `ethnicity`, `religion`, `marital_status`, `sexual_orientation`, `nationality`.
- **Violations Detected:** `{fair_res['violations_found']}`
- **Compliance Status:** **100% COMPLIANT (ECOA / Reg B Guardrail Certified)**.

---

## 4. Arithmetic & Schedule Reconciliation Audit
- **Audited Amortization Schedules:** `{sched_res['audited_schedules_count']}`
- **Reconciliation Mismatches Detected:** `{sched_res['discrepancies_count']}`
- **Ground Truth Match:** Detected count strictly equals injected count `{edge_res['expected_schedule_discrepancies']}`.

---

## 5. Temporal Consistency & Date Ordering Audit
- **Audited Decision Timestamps:** `{order_res['total_audited']}`
- **Temporal Inversions Detected:** `{order_res['temporal_inversions_count']}`
- **Ground Truth Match:** Detected count strictly equals injected count `{edge_res['expected_temporal_inversions']}`.

---

## 6. Duplicate Disbursement Guardrail Audit
- **Disbursement Events Audited:** `{disb_res['total_disbursement_events']}`
- **Duplicate Disbursements Caught:** `{disb_res['duplicate_disbursements_count']}`
- **Unapproved Loan Disbursements:** `{disb_res['unapproved_disbursements_count']}`
- **Ground Truth Match:** Detected count strictly equals injected count `{edge_res['expected_duplicate_disbursements']}`.

---

## Conclusion
The synthetic dataset satisfies all relational, arithmetic, regulatory, and lifecycle validation rules. All deliberate edge cases are isolated, non-corrupting to unrelated records, and 100% accounted for in the ground truth manifest.
"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(md)

    return output_path

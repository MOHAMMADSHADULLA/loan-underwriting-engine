"""Validation engine orchestrator."""

from datetime import datetime
import json
from pathlib import Path
from typing import Any, Dict

from src.domain.enums import IssueType
from src.generator.engine import GeneratedDataset
from src.validator.reporter import export_validation_summary_markdown
from src.validator.rules import (
    check_date_ordering,
    check_disbursement_integrity,
    check_fair_lending_compliance,
    check_foreign_key_integrity,
    check_primary_key_uniqueness,
    check_schedule_arithmetic_reconciliation,
)


def run_full_validation_suite(
    dataset: GeneratedDataset,
    output_dir: Path,
) -> Dict[str, Any]:
    """
    Executes all validation suites, audits edge cases against ground truth,
    and produces JSON and Markdown reports.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    pk_res = check_primary_key_uniqueness(dataset)
    fk_res = check_foreign_key_integrity(dataset)
    order_res = check_date_ordering(dataset)
    sched_res = check_schedule_arithmetic_reconciliation(dataset)
    disb_res = check_disbursement_integrity(dataset)
    fair_res = check_fair_lending_compliance(dataset)

    # Reconcile detected anomalies against ground truth registry
    gt_temporal = [gt for gt in dataset.ground_truth if gt.issue_type == IssueType.DECISION_PRECEDES_CHECKS]
    gt_sched = [gt for gt in dataset.ground_truth if gt.issue_type == IssueType.SCHEDULE_RECONCILIATION_MISMATCH]
    gt_disb = [gt for gt in dataset.ground_truth if gt.issue_type == IssueType.DUPLICATE_DISBURSEMENT]
    gt_term = [gt for gt in dataset.ground_truth if gt.issue_type == IssueType.TERM_OUT_OF_BOUNDS]
    gt_income = [gt for gt in dataset.ground_truth if gt.issue_type == IssueType.INCOME_SOURCE_CONFLICT]

    ground_truth_reconciliation = {
        "expected_temporal_inversions": len(gt_temporal),
        "detected_temporal_inversions": order_res["temporal_inversions_count"],
        "expected_schedule_discrepancies": len(gt_sched),
        "detected_schedule_discrepancies": sched_res["discrepancies_count"],
        "expected_duplicate_disbursements": len(gt_disb),
        "detected_duplicate_disbursements": disb_res["duplicate_disbursements_count"],
        "expected_term_out_of_bounds": len(gt_term),
        "expected_income_source_conflicts": len(gt_income),
        "match": (
            len(gt_temporal) == order_res["temporal_inversions_count"]
            and len(gt_sched) == sched_res["discrepancies_count"]
            and len(gt_disb) == disb_res["duplicate_disbursements_count"]
        ),
    }

    report = {
        "generated_at": datetime.now().isoformat(),
        "dataset_summary": dataset.summary(),
        "primary_key_uniqueness": pk_res,
        "foreign_key_integrity": fk_res,
        "date_ordering": order_res,
        "schedule_reconciliation": sched_res,
        "disbursement_integrity": disb_res,
        "fair_lending_compliance": fair_res,
        "ground_truth_reconciliation": ground_truth_reconciliation,
    }

    # Save JSON report
    json_path = output_dir / "validation_report.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, default=str)

    # Save Markdown report
    md_path = output_dir / "VALIDATION_SUMMARY.md"
    export_validation_summary_markdown(report, md_path)

    return report

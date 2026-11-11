"""Unit tests verifying all 5 required edge cases are injected and properly classified."""

from src.domain.enums import IssueType
from src.generator.engine import generate_dataset


def test_all_five_edge_case_types_present():
    """Verify that all 5 required edge cases exist in ground truth."""
    dataset = generate_dataset(
        num_applicants=100,
        num_applications=60,
        seed=20261022,
        num_edge_cases_per_type=2,
    )

    issue_types_found = {gt.issue_type for gt in dataset.ground_truth if gt.is_anomaly}

    expected_issues = {
        IssueType.TERM_OUT_OF_BOUNDS,
        IssueType.SCHEDULE_RECONCILIATION_MISMATCH,
        IssueType.DECISION_PRECEDES_CHECKS,
        IssueType.INCOME_SOURCE_CONFLICT,
        IssueType.DUPLICATE_DISBURSEMENT,
    }

    assert expected_issues.issubset(issue_types_found), f"Missing: {expected_issues - issue_types_found}"


def test_term_out_of_bounds_outcome():
    """Term out of bounds must lead to REJECTED outcome and rule trigger."""
    dataset = generate_dataset(
        num_applicants=100,
        num_applications=60,
        seed=20261022,
        num_edge_cases_per_type=2,
    )

    term_anomalies = [gt for gt in dataset.ground_truth if gt.issue_type == IssueType.TERM_OUT_OF_BOUNDS]
    assert len(term_anomalies) == 2
    for anomaly in term_anomalies:
        app = next(a for a in dataset.applications if a.application_id == anomaly.application_id)
        dec = next(d for d in dataset.decisions if d.application_id == anomaly.application_id)
        prod = next(p for p in dataset.products if p.product_id == app.product_id)
        assert app.requested_term_months > prod.max_term_months
        assert "ERR_TERM_OUT_OF_BOUNDS" in dec.decision_reason_codes


def test_income_conflict_outcome():
    """Income source conflict must flag discrepancy."""
    dataset = generate_dataset(
        num_applicants=100,
        num_applications=60,
        seed=20261022,
        num_edge_cases_per_type=2,
    )

    income_anomalies = [gt for gt in dataset.ground_truth if gt.issue_type == IssueType.INCOME_SOURCE_CONFLICT]
    assert len(income_anomalies) == 2
    for anomaly in income_anomalies:
        app = next(a for a in dataset.applications if a.application_id == anomaly.application_id)
        aff = next(c for c in dataset.affordability_checks if c.application_id == anomaly.application_id)
        assert app.declared_monthly_income > (aff.total_verified_monthly_income * 2.0)

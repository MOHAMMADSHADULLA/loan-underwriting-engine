"""Validation suite tests verifying integrity, rules, and ground truth correlation."""

from datetime import date, datetime
from pathlib import Path
from src.domain.enums import (
    ApplicationStatus,
    IncomeSource,
    LoanPurpose,
    VerificationMethod,
    VerificationStatus,
)
from src.domain.models import IncomeRecord, LoanApplication, LoanProduct
from src.generator.engine import GeneratedDataset, generate_dataset
from src.validator.engine import run_full_validation_suite
from src.validator.rules import check_income_source_conflicts, check_term_bounds


def test_starter_validation_suite(tmp_path: Path):
    """Verify validation suite execution on generated starter dataset with all 5 edge-case categories."""
    dataset = generate_dataset(
        num_applicants=100,
        num_applications=60,
        seed=20261022,
        num_edge_cases_per_type=2,
    )

    report = run_full_validation_suite(dataset, tmp_path)

    # Core integrity must pass
    assert report["primary_key_uniqueness"]["overall_passed"] is True
    assert report["foreign_key_integrity"]["overall_passed"] is True
    assert report["fair_lending_compliance"]["passed"] is True

    # Ground truth parity must reconcile all 5 categories
    gt_rec = report["ground_truth_reconciliation"]
    assert gt_rec["match"] is True
    assert gt_rec["expected_temporal_inversions"] == gt_rec["detected_temporal_inversions"] == 2
    assert gt_rec["expected_schedule_discrepancies"] == gt_rec["detected_schedule_discrepancies"] == 2
    assert gt_rec["expected_duplicate_disbursements"] == gt_rec["detected_duplicate_disbursements"] == 2
    assert gt_rec["expected_term_out_of_bounds"] == gt_rec["detected_term_out_of_bounds"] == 2
    assert gt_rec["expected_income_source_conflicts"] == gt_rec["detected_income_source_conflicts"] == 2


def test_check_term_bounds_valid():
    """Verify check_term_bounds passes when term is within product range."""
    prod = LoanProduct(
        product_id="PROD-001",
        product_name="Personal Loan",
        min_principal=1000.0,
        max_principal=35000.0,
        min_term_months=12,
        max_term_months=60,
        base_interest_rate=8.5,
        max_dti_threshold=0.45,
        min_credit_score=620,
        is_active=True,
    )
    app = LoanApplication(
        application_id="LOAN-T-001",
        applicant_id="APP-T-001",
        product_id="PROD-001",
        requested_principal=10000.0,
        requested_term_months=36,
        purpose=LoanPurpose.DEBT_CONSOLIDATION,
        application_status=ApplicationStatus.SUBMITTED,
        credit_score=720,
        declared_monthly_income=5000.0,
        submission_timestamp=datetime(2026, 3, 1, 10, 0),
        updated_at=datetime(2026, 3, 1, 10, 0),
    )

    mock_ds = GeneratedDataset(
        products=[prod],
        applicants=[],
        employments=[],
        income_records=[],
        credit_facilities=[],
        applications=[app],
        documents=[],
        affordability_checks=[],
        decisions=[],
        repayment_schedules=[],
        application_events=[],
        ground_truth=[],
    )

    result = check_term_bounds(mock_ds)
    assert result["passed"] is True
    assert result["violations_count"] == 0


def test_check_term_bounds_below_min():
    """Verify check_term_bounds flags terms below the minimum."""
    prod = LoanProduct(
        product_id="PROD-001",
        product_name="Personal Loan",
        min_principal=1000.0,
        max_principal=35000.0,
        min_term_months=12,
        max_term_months=60,
        base_interest_rate=8.5,
        max_dti_threshold=0.45,
        min_credit_score=620,
        is_active=True,
    )
    app = LoanApplication(
        application_id="LOAN-T-002",
        applicant_id="APP-T-001",
        product_id="PROD-001",
        requested_principal=10000.0,
        requested_term_months=6,  # Below min 12
        purpose=LoanPurpose.DEBT_CONSOLIDATION,
        application_status=ApplicationStatus.SUBMITTED,
        credit_score=720,
        declared_monthly_income=5000.0,
        submission_timestamp=datetime(2026, 3, 1, 10, 0),
        updated_at=datetime(2026, 3, 1, 10, 0),
    )

    mock_ds = GeneratedDataset(
        products=[prod],
        applicants=[],
        employments=[],
        income_records=[],
        credit_facilities=[],
        applications=[app],
        documents=[],
        affordability_checks=[],
        decisions=[],
        repayment_schedules=[],
        application_events=[],
        ground_truth=[],
    )

    result = check_term_bounds(mock_ds)
    assert result["passed"] is False
    assert result["violations_count"] == 1
    assert result["violations"][0]["violation_type"] == "BELOW_MIN_TERM"
    assert result["violations"][0]["requested_term_months"] == 6


def test_check_term_bounds_above_max():
    """Verify check_term_bounds flags terms exceeding the maximum."""
    prod = LoanProduct(
        product_id="PROD-001",
        product_name="Personal Loan",
        min_principal=1000.0,
        max_principal=35000.0,
        min_term_months=12,
        max_term_months=60,
        base_interest_rate=8.5,
        max_dti_threshold=0.45,
        min_credit_score=620,
        is_active=True,
    )
    app = LoanApplication(
        application_id="LOAN-T-003",
        applicant_id="APP-T-001",
        product_id="PROD-001",
        requested_principal=10000.0,
        requested_term_months=84,  # Exceeds max 60
        purpose=LoanPurpose.DEBT_CONSOLIDATION,
        application_status=ApplicationStatus.SUBMITTED,
        credit_score=720,
        declared_monthly_income=5000.0,
        submission_timestamp=datetime(2026, 3, 1, 10, 0),
        updated_at=datetime(2026, 3, 1, 10, 0),
    )

    mock_ds = GeneratedDataset(
        products=[prod],
        applicants=[],
        employments=[],
        income_records=[],
        credit_facilities=[],
        applications=[app],
        documents=[],
        affordability_checks=[],
        decisions=[],
        repayment_schedules=[],
        application_events=[],
        ground_truth=[],
    )

    result = check_term_bounds(mock_ds)
    assert result["passed"] is False
    assert result["violations_count"] == 1
    assert result["violations"][0]["violation_type"] == "EXCEEDS_MAX_TERM"
    assert result["violations"][0]["requested_term_months"] == 84


def test_check_income_conflicts_clean():
    """Verify check_income_source_conflicts passes when declared income matches verified income."""
    app = LoanApplication(
        application_id="LOAN-T-004",
        applicant_id="APP-T-001",
        product_id="PROD-001",
        requested_principal=10000.0,
        requested_term_months=36,
        purpose=LoanPurpose.DEBT_CONSOLIDATION,
        application_status=ApplicationStatus.SUBMITTED,
        credit_score=720,
        declared_monthly_income=4800.0,  # Within 4% of 5000.0
        submission_timestamp=datetime(2026, 3, 1, 10, 0),
        updated_at=datetime(2026, 3, 1, 10, 0),
    )
    inc = IncomeRecord(
        income_id="INC-T-001",
        applicant_id="APP-T-001",
        income_source=IncomeSource.PRIMARY_SALARY,
        gross_monthly_amount=6200.0,
        net_monthly_amount=5000.0,
        verification_status=VerificationStatus.VERIFIED,
        verification_method=VerificationMethod.PAYSLIP,
        effective_date=date(2026, 2, 1),
        created_at=datetime(2026, 2, 1),
    )

    mock_ds = GeneratedDataset(
        products=[],
        applicants=[],
        employments=[],
        income_records=[inc],
        credit_facilities=[],
        applications=[app],
        documents=[],
        affordability_checks=[],
        decisions=[],
        repayment_schedules=[],
        application_events=[],
        ground_truth=[],
    )

    result = check_income_source_conflicts(mock_ds, discrepancy_threshold=0.40)
    assert result["passed"] is True
    assert result["violations_count"] == 0


def test_check_income_conflicts_injected():
    """Verify check_income_source_conflicts detects injected 3.2x declared income discrepancy."""
    app = LoanApplication(
        application_id="LOAN-T-005",
        applicant_id="APP-T-001",
        product_id="PROD-001",
        requested_principal=10000.0,
        requested_term_months=36,
        purpose=LoanPurpose.DEBT_CONSOLIDATION,
        application_status=ApplicationStatus.SUBMITTED,
        credit_score=720,
        declared_monthly_income=16000.0,  # 3.2x of 5000.0
        submission_timestamp=datetime(2026, 3, 1, 10, 0),
        updated_at=datetime(2026, 3, 1, 10, 0),
    )
    inc = IncomeRecord(
        income_id="INC-T-001",
        applicant_id="APP-T-001",
        income_source=IncomeSource.PRIMARY_SALARY,
        gross_monthly_amount=6200.0,
        net_monthly_amount=5000.0,
        verification_status=VerificationStatus.VERIFIED,
        verification_method=VerificationMethod.PAYSLIP,
        effective_date=date(2026, 2, 1),
        created_at=datetime(2026, 2, 1),
    )

    mock_ds = GeneratedDataset(
        products=[],
        applicants=[],
        employments=[],
        income_records=[inc],
        credit_facilities=[],
        applications=[app],
        documents=[],
        affordability_checks=[],
        decisions=[],
        repayment_schedules=[],
        application_events=[],
        ground_truth=[],
    )

    result = check_income_source_conflicts(mock_ds, discrepancy_threshold=0.40)
    assert result["passed"] is False
    assert result["violations_count"] == 1
    v = result["violations"][0]
    assert v["application_id"] == "LOAN-T-005"
    assert v["applicant_id"] == "APP-T-001"
    assert v["verified_monthly_income"] == 5000.0
    assert v["discrepancy_ratio"] == 2.2  # |16000 - 5000| / 5000 = 2.2


def test_check_income_conflicts_zero_verified_safe():
    """Verify check_income_source_conflicts safely skips applicants with zero verified income."""
    app = LoanApplication(
        application_id="LOAN-T-006",
        applicant_id="APP-T-002",
        product_id="PROD-001",
        requested_principal=5000.0,
        requested_term_months=24,
        purpose=LoanPurpose.EMERGENCY_EXPENSE,
        application_status=ApplicationStatus.SUBMITTED,
        credit_score=650,
        declared_monthly_income=3000.0,
        submission_timestamp=datetime(2026, 3, 1, 10, 0),
        updated_at=datetime(2026, 3, 1, 10, 0),
    )
    # Income record is UNVERIFIED
    inc = IncomeRecord(
        income_id="INC-T-002",
        applicant_id="APP-T-002",
        income_source=IncomeSource.GOVERNMENT_BENEFIT,
        gross_monthly_amount=1200.0,
        net_monthly_amount=1000.0,
        verification_status=VerificationStatus.UNVERIFIED,
        verification_method=VerificationMethod.BANK_STATEMENT,
        effective_date=date(2026, 2, 1),
        created_at=datetime(2026, 2, 1),
    )

    mock_ds = GeneratedDataset(
        products=[],
        applicants=[],
        employments=[],
        income_records=[inc],
        credit_facilities=[],
        applications=[app],
        documents=[],
        affordability_checks=[],
        decisions=[],
        repayment_schedules=[],
        application_events=[],
        ground_truth=[],
    )

    result = check_income_source_conflicts(mock_ds, discrepancy_threshold=0.40)
    assert result["passed"] is True
    assert result["violations_count"] == 0


def test_check_income_conflicts_isolation_between_applicants():
    """Verify that income records belonging to another applicant are not attributed to the current applicant."""
    app_a = LoanApplication(
        application_id="LOAN-T-007",
        applicant_id="APP-A",
        product_id="PROD-001",
        requested_principal=10000.0,
        requested_term_months=36,
        purpose=LoanPurpose.DEBT_CONSOLIDATION,
        application_status=ApplicationStatus.SUBMITTED,
        credit_score=720,
        declared_monthly_income=3000.0,
        submission_timestamp=datetime(2026, 3, 1, 10, 0),
        updated_at=datetime(2026, 3, 1, 10, 0),
    )
    # APP-A has verified income of $3,000 (declared matches verified -> clean)
    inc_a = IncomeRecord(
        income_id="INC-A",
        applicant_id="APP-A",
        income_source=IncomeSource.PRIMARY_SALARY,
        gross_monthly_amount=4000.0,
        net_monthly_amount=3000.0,
        verification_status=VerificationStatus.VERIFIED,
        verification_method=VerificationMethod.PAYSLIP,
        effective_date=date(2026, 2, 1),
        created_at=datetime(2026, 2, 1),
    )
    # APP-B has verified income of $15,000 (must NOT be counted for APP-A)
    inc_b = IncomeRecord(
        income_id="INC-B",
        applicant_id="APP-B",
        income_source=IncomeSource.PRIMARY_SALARY,
        gross_monthly_amount=20000.0,
        net_monthly_amount=15000.0,
        verification_status=VerificationStatus.VERIFIED,
        verification_method=VerificationMethod.PAYSLIP,
        effective_date=date(2026, 2, 1),
        created_at=datetime(2026, 2, 1),
    )

    mock_ds = GeneratedDataset(
        products=[],
        applicants=[],
        employments=[],
        income_records=[inc_a, inc_b],
        credit_facilities=[],
        applications=[app_a],
        documents=[],
        affordability_checks=[],
        decisions=[],
        repayment_schedules=[],
        application_events=[],
        ground_truth=[],
    )

    result = check_income_source_conflicts(mock_ds, discrepancy_threshold=0.40)
    assert result["passed"] is True
    assert result["violations_count"] == 0

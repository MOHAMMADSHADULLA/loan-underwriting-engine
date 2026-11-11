"""Validation suite tests verifying integrity, rules, and ground truth correlation."""

from datetime import date, datetime, timedelta
from pathlib import Path
from src.domain.enums import (
    AffordabilityResult,
    ApplicationStatus,
    DecisionOutcome,
    DocumentStatus,
    DocumentType,
    EventType,
    HousingStatus,
    IncomeSource,
    IssueType,
    LoanPurpose,
    ReviewerRole,
    VerificationMethod,
    VerificationStatus,
)
from src.domain.models import (
    AffordabilityCheck,
    Applicant,
    ApplicationEvent,
    Decision,
    Document,
    GroundTruthEntry,
    IncomeRecord,
    LoanApplication,
    LoanProduct,
)
from src.generator.engine import GeneratedDataset, generate_dataset
from src.validator.engine import run_full_validation_suite
from src.validator.rules import (
    check_date_ordering,
    check_disbursement_integrity,
    check_foreign_key_integrity,
    check_income_source_conflicts,
    check_primary_key_uniqueness,
    check_schedule_arithmetic_reconciliation,
    check_term_bounds,
)


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


def test_check_date_ordering_lifecycle_valid():
    """Verify check_date_ordering passes on a clean full lifecycle sequence."""
    t0 = datetime(2026, 3, 1, 10, 0)
    t1 = datetime(2026, 3, 1, 10, 15)  # upload
    t2 = datetime(2026, 3, 1, 10, 45)  # verified
    t3 = datetime(2026, 3, 1, 11, 0)   # affordability
    t4 = datetime(2026, 3, 1, 11, 30)  # decision
    t5 = datetime(2026, 3, 2, 10, 0)   # disbursement

    app = LoanApplication(
        application_id="LOAN-T-LIFECYCLE",
        applicant_id="APP-001",
        product_id="PROD-001",
        requested_principal=10000.0,
        requested_term_months=36,
        purpose=LoanPurpose.DEBT_CONSOLIDATION,
        application_status=ApplicationStatus.DISBURSED,
        credit_score=750,
        declared_monthly_income=5000.0,
        submission_timestamp=t0,
        updated_at=t5,
    )
    doc = Document(
        document_id="DOC-001",
        application_id=app.application_id,
        applicant_id="APP-001",
        document_type=DocumentType.PROOF_OF_IDENTITY,
        document_status=DocumentStatus.VERIFIED,
        file_hash="hash123",
        uploaded_at=t1,
        verified_at=t2,
    )
    aff = AffordabilityCheck(
        check_id="AFF-001",
        application_id=app.application_id,
        total_verified_monthly_income=5000.0,
        existing_monthly_debt_obligations=500.0,
        estimated_living_expenses=1200.0,
        proposed_loan_monthly_payment=320.0,
        calculated_dti=0.064,
        calculated_total_dti=0.164,
        net_disposable_income=2980.0,
        affordability_result=AffordabilityResult.PASS,
        check_timestamp=t3,
    )
    dec = Decision(
        decision_id="DEC-001",
        application_id=app.application_id,
        outcome=DecisionOutcome.APPROVED,
        approved_principal=10000.0,
        approved_interest_rate=8.5,
        approved_term_months=36,
        decision_reason_codes="APPROVED_STANDARD",
        decision_notes="Approved according to standard policy",
        reviewer_role=ReviewerRole.AUTOMATED_RULES_ENGINE,
        decision_timestamp=t4,
    )
    evt = ApplicationEvent(
        event_id="EVT-001",
        application_id=app.application_id,
        from_status="APPROVED",
        to_status="DISBURSED",
        event_type=EventType.FUNDS_DISBURSED,
        actor=ReviewerRole.OPERATIONS_ANALYST,
        timestamp=t5,
        details="Disbursed",
    )

    dataset = GeneratedDataset(
        products=[],
        applicants=[],
        employments=[],
        income_records=[],
        credit_facilities=[],
        applications=[app],
        documents=[doc],
        affordability_checks=[aff],
        decisions=[dec],
        repayment_schedules=[],
        application_events=[evt],
        ground_truth=[],
    )

    res = check_date_ordering(dataset)
    assert res["passed"] is True
    assert res["temporal_inversions_count"] == 0


def test_check_date_ordering_lifecycle_corrupted_transitions():
    """Verify check_date_ordering detects temporal inversions at each lifecycle step."""
    base_t = datetime(2026, 3, 1, 12, 0)

    # 1. Document upload before submission
    app1 = LoanApplication(
        application_id="LOAN-CORRUPT-1",
        applicant_id="APP-001",
        product_id="PROD-001",
        requested_principal=10000.0,
        requested_term_months=36,
        purpose=LoanPurpose.DEBT_CONSOLIDATION,
        application_status=ApplicationStatus.SUBMITTED,
        credit_score=700,
        declared_monthly_income=5000.0,
        submission_timestamp=base_t,
        updated_at=base_t,
    )
    doc1 = Document(
        document_id="DOC-C1",
        application_id=app1.application_id,
        applicant_id="APP-001",
        document_type=DocumentType.PROOF_OF_IDENTITY,
        document_status=DocumentStatus.VERIFIED,
        file_hash="h1",
        uploaded_at=base_t - timedelta(minutes=10),  # Uploaded BEFORE submission
        verified_at=base_t + timedelta(minutes=10),
    )
    ds1 = GeneratedDataset([], [], [], [], [], [app1], [doc1], [], [], [], [], [])
    res1 = check_date_ordering(ds1)
    assert res1["passed"] is False
    assert res1["temporal_inversions_count"] == 1
    assert res1["inversions"][0]["rule"] == "DOCUMENT_UPLOAD_PRECEDES_SUBMISSION"

    # 2. Document verification before upload
    doc2 = Document(
        document_id="DOC-C2",
        application_id=app1.application_id,
        applicant_id="APP-001",
        document_type=DocumentType.PROOF_OF_IDENTITY,
        document_status=DocumentStatus.VERIFIED,
        file_hash="h2",
        uploaded_at=base_t + timedelta(minutes=10),
        verified_at=base_t + timedelta(minutes=5),  # Verified BEFORE upload
    )
    ds2 = GeneratedDataset([], [], [], [], [], [app1], [doc2], [], [], [], [], [])
    res2 = check_date_ordering(ds2)
    assert res2["passed"] is False
    assert res2["temporal_inversions_count"] == 1
    assert res2["inversions"][0]["rule"] == "DOCUMENT_VERIFICATION_PRECEDES_UPLOAD"

    # 3. Affordability check before submission
    aff3 = AffordabilityCheck(
        check_id="AFF-C3",
        application_id=app1.application_id,
        total_verified_monthly_income=5000.0,
        existing_monthly_debt_obligations=500.0,
        estimated_living_expenses=1200.0,
        proposed_loan_monthly_payment=320.0,
        calculated_dti=0.064,
        calculated_total_dti=0.164,
        net_disposable_income=2980.0,
        affordability_result=AffordabilityResult.PASS,
        check_timestamp=base_t - timedelta(minutes=5),  # Check BEFORE submission
    )
    ds3 = GeneratedDataset([], [], [], [], [], [app1], [], [aff3], [], [], [], [])
    res3 = check_date_ordering(ds3)
    assert res3["passed"] is False
    assert res3["temporal_inversions_count"] == 1
    assert res3["inversions"][0]["rule"] == "AFFORDABILITY_PRECEDES_SUBMISSION"

    # 4. Disbursement before decision
    dec4 = Decision(
        decision_id="DEC-C4",
        application_id=app1.application_id,
        outcome=DecisionOutcome.APPROVED,
        approved_principal=10000.0,
        approved_interest_rate=8.5,
        approved_term_months=36,
        decision_reason_codes="APPROVED",
        decision_notes="Approved according to standard policy",
        reviewer_role=ReviewerRole.AUTOMATED_RULES_ENGINE,
        decision_timestamp=base_t + timedelta(hours=2),
    )
    evt4 = ApplicationEvent(
        event_id="EVT-C4",
        application_id=app1.application_id,
        from_status="APPROVED",
        to_status="DISBURSED",
        event_type=EventType.FUNDS_DISBURSED,
        actor=ReviewerRole.OPERATIONS_ANALYST,
        timestamp=base_t + timedelta(hours=1),  # Disbursement BEFORE decision
        details="Payout",
    )
    ds4 = GeneratedDataset([], [], [], [], [], [app1], [], [], [dec4], [], [evt4], [])
    res4 = check_date_ordering(ds4)
    assert res4["passed"] is False
    assert res4["temporal_inversions_count"] == 1
    assert res4["inversions"][0]["rule"] == "DISBURSEMENT_PRECEDES_DECISION"


def test_check_primary_key_uniqueness_ground_truth():
    """Verify ground truth uniqueness validation catches duplicates and passes distinct records."""
    gt1 = GroundTruthEntry(
        application_id="LOAN-001",
        entity_type="LoanApplication",
        record_id="LOAN-001",
        issue_type=IssueType.TERM_OUT_OF_BOUNDS,
        is_anomaly=True,
        expected_decision=DecisionOutcome.REJECTED,
        rule_triggered="TERM_OUT_OF_BOUNDS",
        description="Term too long",
    )
    gt2 = GroundTruthEntry(
        application_id="LOAN-001",
        entity_type="LoanApplication",
        record_id="LOAN-001",
        issue_type=IssueType.INCOME_SOURCE_CONFLICT,  # Different issue_type on same app -> distinct!
        is_anomaly=True,
        expected_decision=DecisionOutcome.REJECTED,
        rule_triggered="INCOME_CONFLICT",
        description="Conflict",
    )
    gt_duplicate = GroundTruthEntry(
        application_id="LOAN-001",
        entity_type="LoanApplication",
        record_id="LOAN-001",
        issue_type=IssueType.TERM_OUT_OF_BOUNDS,  # Duplicate of gt1!
        is_anomaly=True,
        expected_decision=DecisionOutcome.REJECTED,
        rule_triggered="TERM_OUT_OF_BOUNDS",
        description="Duplicate entry",
    )

    clean_ds = GeneratedDataset([], [], [], [], [], [], [], [], [], [], [], [gt1, gt2])
    clean_res = check_primary_key_uniqueness(clean_ds)
    assert clean_res["overall_passed"] is True
    assert clean_res["details"]["ground_truth"]["passed"] is True
    assert clean_res["details"]["ground_truth"]["duplicates"] == 0

    corrupt_ds = GeneratedDataset([], [], [], [], [], [], [], [], [], [], [], [gt1, gt2, gt_duplicate])
    corrupt_res = check_primary_key_uniqueness(corrupt_ds)
    assert corrupt_res["overall_passed"] is False
    assert corrupt_res["details"]["ground_truth"]["passed"] is False
    assert corrupt_res["details"]["ground_truth"]["duplicates"] == 1


def test_check_foreign_key_integrity_documents_applicant():
    """Verify foreign key validation checks documents.applicant_id -> applicants.applicant_id."""
    app_record = Applicant(
        applicant_id="APP-VALID",
        first_name="Jane",
        last_name="Doe",
        email="jane.doe@example.com",
        phone="+15551234567",
        date_of_birth=date(1990, 1, 1),
        housing_status=HousingStatus.OWN,
        national_id_hash="abc123hash",
        created_at=datetime(2026, 1, 1),
    )
    loan_app = LoanApplication(
        application_id="LOAN-V-1",
        applicant_id="APP-VALID",
        product_id="PROD-001",
        requested_principal=5000.0,
        requested_term_months=24,
        purpose=LoanPurpose.HOME_IMPROVEMENT,
        application_status=ApplicationStatus.SUBMITTED,
        credit_score=720,
        declared_monthly_income=4000.0,
        submission_timestamp=datetime(2026, 3, 1),
        updated_at=datetime(2026, 3, 1),
    )
    valid_doc = Document(
        document_id="DOC-V-1",
        application_id="LOAN-V-1",
        applicant_id="APP-VALID",
        document_type=DocumentType.BANK_STATEMENTS,
        document_status=DocumentStatus.VERIFIED,
        file_hash="h123",
        uploaded_at=datetime(2026, 3, 1, 10, 5),
    )

    clean_ds = GeneratedDataset([], [app_record], [], [], [], [loan_app], [valid_doc], [], [], [], [], [])
    clean_res = check_foreign_key_integrity(clean_ds)
    assert clean_res["details"]["documents.applicant_id"]["passed"] is True
    assert clean_res["details"]["documents.applicant_id"]["missing_parent_refs"] == 0

    # Corrupt document with unknown applicant_id
    corrupt_doc = Document(
        document_id="DOC-ORPHAN",
        application_id="LOAN-V-1",
        applicant_id="APP-UNKNOWN-ORPHAN",
        document_type=DocumentType.BANK_STATEMENTS,
        document_status=DocumentStatus.VERIFIED,
        file_hash="h1234",
        uploaded_at=datetime(2026, 3, 1, 10, 5),
    )
    corrupt_ds = GeneratedDataset([], [app_record], [], [], [], [loan_app], [corrupt_doc], [], [], [], [], [])
    corrupt_res = check_foreign_key_integrity(corrupt_ds)
    assert corrupt_res["overall_passed"] is False
    assert corrupt_res["details"]["documents.applicant_id"]["passed"] is False
    assert corrupt_res["details"]["documents.applicant_id"]["missing_parent_refs"] == 1


def test_all_five_edge_cases_independently_detected_starter():
    """Verify all 5 edge case categories are independently detected by their dedicated rules."""
    dataset = generate_dataset(
        num_applicants=100,
        num_applications=60,
        seed=20261022,
        num_edge_cases_per_type=2,
    )

    order_res = check_date_ordering(dataset)
    sched_res = check_schedule_arithmetic_reconciliation(dataset)
    disb_res = check_disbursement_integrity(dataset)
    term_res = check_term_bounds(dataset)
    income_res = check_income_source_conflicts(dataset)

    assert order_res["temporal_inversions_count"] == 2
    assert sched_res["discrepancies_count"] == 2
    assert disb_res["duplicate_disbursements_count"] == 2
    assert term_res["violations_count"] == 2
    assert income_res["violations_count"] == 2

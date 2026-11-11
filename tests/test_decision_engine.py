"""Unit tests for the Underwriting Decision Engine."""

from datetime import date, datetime
import pytest

from src.domain.enums import (
    AffordabilityResult,
    DecisionOutcome,
    DocumentStatus,
    DocumentType,
    EmploymentType,
    HousingStatus,
    LoanPurpose,
    ReviewerRole,
)
from src.domain.models import (
    AffordabilityCheck,
    Decision,
    Document,
    Employment,
    LoanApplication,
    LoanProduct,
)
from src.rules.decision_engine import evaluate_loan_application


@pytest.fixture
def sample_product():
    return LoanProduct(
        product_id="PROD-001",
        product_name="Personal Unsecured Loan",
        min_principal=1000.0,
        max_principal=35000.0,
        min_term_months=12,
        max_term_months=60,
        base_interest_rate=8.5,
        max_dti_threshold=0.45,
        min_credit_score=620,
        is_active=True,
    )


@pytest.fixture
def clean_application():
    return LoanApplication(
        application_id="LOAN-TEST-101",
        applicant_id="APP-TEST-101",
        product_id="PROD-001",
        requested_principal=12000.0,
        requested_term_months=36,
        purpose=LoanPurpose.DEBT_CONSOLIDATION,
        application_status=DecisionOutcome.APPROVED,
        credit_score=720,
        declared_monthly_income=5500.0,
        submission_timestamp=datetime(2026, 4, 1, 10, 0),
        updated_at=datetime(2026, 4, 1, 10, 0),
    )


@pytest.fixture
def clean_documents():
    return [
        Document(
            document_id="DOC-1",
            application_id="LOAN-TEST-101",
            applicant_id="APP-TEST-101",
            document_type=DocumentType.PROOF_OF_IDENTITY,
            document_status=DocumentStatus.VERIFIED,
            file_hash="hash-1",
            uploaded_at=datetime(2026, 4, 1, 10, 15),
            verified_at=datetime(2026, 4, 1, 10, 30),
        ),
        Document(
            document_id="DOC-2",
            application_id="LOAN-TEST-101",
            applicant_id="APP-TEST-101",
            document_type=DocumentType.PROOF_OF_INCOME,
            document_status=DocumentStatus.VERIFIED,
            file_hash="hash-2",
            uploaded_at=datetime(2026, 4, 1, 10, 15),
            verified_at=datetime(2026, 4, 1, 10, 30),
        ),
    ]


@pytest.fixture
def clean_employment():
    return [
        Employment(
            employment_id="EMP-1",
            applicant_id="APP-TEST-101",
            employer_name="TechCorp",
            employment_type=EmploymentType.FULL_TIME,
            job_title="Lead Developer",
            start_date=date(2023, 1, 1),
            is_current=True,
            tenure_months=36,
            created_at=datetime(2026, 1, 1),
        )
    ]


@pytest.fixture
def clean_affordability():
    return AffordabilityCheck(
        check_id="AFF-1",
        application_id="LOAN-TEST-101",
        total_verified_monthly_income=5500.0,
        existing_monthly_debt_obligations=800.0,
        estimated_living_expenses=1925.0,
        proposed_loan_monthly_payment=378.0,
        calculated_dti=0.145,
        calculated_total_dti=0.214,
        net_disposable_income=2397.0,
        affordability_result=AffordabilityResult.PASS,
        check_timestamp=datetime(2026, 4, 1, 10, 45),
    )


def test_clean_application_approval(
    clean_application, sample_product, clean_affordability, clean_documents, clean_employment
):
    dec, reasons = evaluate_loan_application(
        application=clean_application,
        product=sample_product,
        affordability=clean_affordability,
        documents=clean_documents,
        employments=clean_employment,
        decision_timestamp=datetime(2026, 4, 1, 11, 0),
    )

    assert dec.outcome == DecisionOutcome.APPROVED
    assert dec.approved_principal == clean_application.requested_principal
    assert dec.approved_term_months == clean_application.requested_term_months
    assert "PASS_ALL_UNDERWRITING_CRITERIA" in dec.decision_reason_codes


def test_credit_score_rejection(
    clean_application, sample_product, clean_affordability, clean_documents, clean_employment
):
    clean_application.credit_score = 560  # Below 620 - 20
    dec, reasons = evaluate_loan_application(
        application=clean_application,
        product=sample_product,
        affordability=clean_affordability,
        documents=clean_documents,
        employments=clean_employment,
        decision_timestamp=datetime(2026, 4, 1, 11, 0),
    )

    assert dec.outcome == DecisionOutcome.REJECTED
    assert "FAIL_CREDIT_SCORE_BELOW_MIN" in dec.decision_reason_codes


def test_borderline_credit_manual_review(
    clean_application, sample_product, clean_affordability, clean_documents, clean_employment
):
    clean_application.credit_score = 610  # Between 600 and 620
    dec, reasons = evaluate_loan_application(
        application=clean_application,
        product=sample_product,
        affordability=clean_affordability,
        documents=clean_documents,
        employments=clean_employment,
        decision_timestamp=datetime(2026, 4, 1, 11, 0),
    )

    assert dec.outcome == DecisionOutcome.MANUAL_REVIEW
    assert "BORDERLINE_CREDIT_SCORE" in dec.decision_reason_codes

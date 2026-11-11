"""Core domain entities and schema definitions for the Loan Underwriting Engine."""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field

from src.domain.enums import (
    AffordabilityResult,
    ApplicationStatus,
    DecisionOutcome,
    DocumentStatus,
    DocumentType,
    EmploymentType,
    EventType,
    FacilityStatus,
    FacilityType,
    HousingStatus,
    IncomeSource,
    IssueType,
    LoanPurpose,
    ReviewerRole,
    ScheduleStatus,
    VerificationMethod,
    VerificationStatus,
)


class Applicant(BaseModel):
    applicant_id: str = Field(..., description="Unique applicant identifier (APP-YYYY-NNNNNN)")
    first_name: str
    last_name: str
    email: str
    phone: str
    date_of_birth: date
    housing_status: HousingStatus
    national_id_hash: str
    created_at: datetime
    # Protected attributes strictly isolated from automated underwriting decisions
    gender: Optional[str] = None
    ethnicity: Optional[str] = None


class Employment(BaseModel):
    employment_id: str = Field(..., description="Unique employment record ID (EMP-YYYY-NNNNNN)")
    applicant_id: str = Field(..., description="Foreign key to Applicant")
    employer_name: str
    employment_type: EmploymentType
    job_title: str
    start_date: date
    end_date: Optional[date] = None
    is_current: bool
    tenure_months: int
    created_at: datetime


class IncomeRecord(BaseModel):
    income_id: str = Field(..., description="Unique income record ID (INC-YYYY-NNNNNN)")
    applicant_id: str = Field(..., description="Foreign key to Applicant")
    income_source: IncomeSource
    gross_monthly_amount: float
    net_monthly_amount: float
    verification_status: VerificationStatus
    verification_method: VerificationMethod
    effective_date: date
    created_at: datetime


class CreditFacility(BaseModel):
    facility_id: str = Field(..., description="Unique credit facility ID (FAC-YYYY-NNNNNN)")
    applicant_id: str = Field(..., description="Foreign key to Applicant")
    facility_type: FacilityType
    lender_name: str
    credit_limit: float
    outstanding_balance: float
    monthly_payment: float
    facility_status: FacilityStatus
    opened_date: date
    reported_date: date
    created_at: datetime


class LoanProduct(BaseModel):
    product_id: str = Field(..., description="Unique product ID (PROD-NNN)")
    product_name: str
    min_principal: float
    max_principal: float
    min_term_months: int
    max_term_months: int
    base_interest_rate: float
    max_dti_threshold: float
    min_credit_score: int
    is_active: bool = True


class LoanApplication(BaseModel):
    application_id: str = Field(..., description="Unique application identifier (LOAN-YYYY-NNNNNN)")
    applicant_id: str = Field(..., description="Foreign key to Applicant")
    product_id: str = Field(..., description="Foreign key to LoanProduct")
    requested_principal: float
    requested_term_months: int
    purpose: LoanPurpose
    application_status: ApplicationStatus
    credit_score: int
    declared_monthly_income: float
    submission_timestamp: datetime
    updated_at: datetime


class Document(BaseModel):
    document_id: str = Field(..., description="Unique document ID (DOC-<app_id>-NNN)")
    application_id: str = Field(..., description="Foreign key to LoanApplication")
    applicant_id: str = Field(..., description="Foreign key to Applicant")
    document_type: DocumentType
    document_status: DocumentStatus
    file_hash: str
    uploaded_at: datetime
    verified_at: Optional[datetime] = None


class AffordabilityCheck(BaseModel):
    check_id: str = Field(..., description="Unique affordability check ID (AFF-<app_id>-NN)")
    application_id: str = Field(..., description="Foreign key to LoanApplication")
    total_verified_monthly_income: float
    existing_monthly_debt_obligations: float
    estimated_living_expenses: float
    proposed_loan_monthly_payment: float
    calculated_dti: float
    calculated_total_dti: float
    net_disposable_income: float
    affordability_result: AffordabilityResult
    check_timestamp: datetime


class Decision(BaseModel):
    decision_id: str = Field(..., description="Unique decision ID (DEC-<app_id>-NN)")
    application_id: str = Field(..., description="Foreign key to LoanApplication")
    outcome: DecisionOutcome
    approved_principal: float
    approved_term_months: int
    approved_interest_rate: float
    decision_reason_codes: str
    decision_notes: str
    reviewer_role: ReviewerRole
    decision_timestamp: datetime


class RepaymentSchedule(BaseModel):
    schedule_id: str = Field(..., description="Unique schedule entry ID (SCH-<app_id>-NN)")
    application_id: str = Field(..., description="Foreign key to LoanApplication")
    installment_number: int
    due_date: date
    payment_amount: float
    principal_component: float
    interest_component: float
    remaining_balance: float
    status: ScheduleStatus


class ApplicationEvent(BaseModel):
    event_id: str = Field(..., description="Unique event identifier (EVT-<app_id>-NN)")
    application_id: str = Field(..., description="Foreign key to LoanApplication")
    from_status: str
    to_status: str
    event_type: EventType
    actor: ReviewerRole
    timestamp: datetime
    details: str


class GroundTruthEntry(BaseModel):
    application_id: str
    entity_type: str
    record_id: str
    issue_type: IssueType
    is_anomaly: bool
    expected_decision: DecisionOutcome
    rule_triggered: str
    description: str

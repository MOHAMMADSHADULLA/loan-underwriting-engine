"""Explicit rule-based underwriting decision engine with traceable rule audits."""

from datetime import datetime
from typing import List, Tuple
from src.domain.enums import (
    AffordabilityResult,
    DecisionOutcome,
    DocumentStatus,
    DocumentType,
    EmploymentType,
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
from src.rules.compliance import assert_no_protected_attributes


def evaluate_loan_application(
    application: LoanApplication,
    product: LoanProduct,
    affordability: AffordabilityCheck,
    documents: List[Document],
    employments: List[Employment],
    decision_timestamp: datetime,
    is_decision_preceded_anomaly: bool = False,
) -> Tuple[Decision, List[str]]:
    """
    Evaluates loan underwriting policy based on explicit rules:
    1. Term range
    2. Principal range
    3. Credit score thresholds
    4. Affordability and DTI
    5. Document completeness (KYC and Income)
    6. Employment stability
    7. Income consistency

    Protected demographic attributes are strictly forbidden from input access.
    """
    # Fair Lending verification: inspect application fields passed
    assert_no_protected_attributes(list(application.model_dump().keys()))

    reasons: List[str] = []
    hard_rejects: List[str] = []
    review_triggers: List[str] = []

    # 1. Product Term Bounds Check
    if (
        application.requested_term_months < product.min_term_months
        or application.requested_term_months > product.max_term_months
    ):
        hard_rejects.append("ERR_TERM_OUT_OF_BOUNDS")

    # 2. Product Principal Bounds Check
    if (
        application.requested_principal < product.min_principal
        or application.requested_principal > product.max_principal
    ):
        hard_rejects.append("ERR_PRINCIPAL_OUT_OF_BOUNDS")

    # 3. Credit Score Check
    min_score = product.min_credit_score
    if application.credit_score < (min_score - 20):
        hard_rejects.append("FAIL_CREDIT_SCORE_BELOW_MIN")
    elif (min_score - 20) <= application.credit_score < min_score:
        review_triggers.append("BORDERLINE_CREDIT_SCORE")

    # 4. Affordability Check
    if affordability.affordability_result == AffordabilityResult.FAIL:
        hard_rejects.append("FAIL_AFFORDABILITY_DTI_EXCEEDED")
    elif affordability.affordability_result == AffordabilityResult.MARGINAL:
        review_triggers.append("MARGINAL_AFFORDABILITY_BUFFER")

    # 5. Document Verification (KYC & Income)
    doc_map = {doc.document_type: doc.document_status for doc in documents}
    
    # Proof of identity
    id_status = doc_map.get(DocumentType.PROOF_OF_IDENTITY, DocumentStatus.MISSING)
    if id_status in (DocumentStatus.MISSING, DocumentStatus.REJECTED):
        hard_rejects.append("FAIL_KYC_IDENTITY_UNVERIFIED")
    elif id_status == DocumentStatus.PENDING:
        review_triggers.append("PENDING_IDENTITY_VERIFICATION")

    # Proof of income or bank statements
    income_status = doc_map.get(DocumentType.PROOF_OF_INCOME, DocumentStatus.MISSING)
    bank_status = doc_map.get(DocumentType.BANK_STATEMENTS, DocumentStatus.MISSING)
    if income_status == DocumentStatus.MISSING and bank_status == DocumentStatus.MISSING:
        hard_rejects.append("FAIL_INCOME_DOCUMENTS_MISSING")
    elif (
        income_status in (DocumentStatus.PENDING, DocumentStatus.EXPIRED)
        or bank_status in (DocumentStatus.PENDING, DocumentStatus.EXPIRED)
    ):
        review_triggers.append("PENDING_INCOME_DOCUMENT_VERIFICATION")

    # 6. Employment Stability Check
    current_emp = next((e for e in employments if e.is_current), None)
    if not current_emp or current_emp.employment_type == EmploymentType.UNEMPLOYED:
        if affordability.total_verified_monthly_income < 2000.0:
            hard_rejects.append("FAIL_UNSTABLE_EMPLOYMENT_NO_INCOME")
        else:
            review_triggers.append("UNEMPLOYED_WITH_INDEPENDENT_INCOME")
    elif current_emp.tenure_months < 6:
        review_triggers.append("SHORT_EMPLOYMENT_TENURE_UNDER_6M")

    # 7. Income Consistency Check (Declared vs Verified)
    if affordability.total_verified_monthly_income > 0:
        variance = abs(
            application.declared_monthly_income - affordability.total_verified_monthly_income
        ) / affordability.total_verified_monthly_income
        if variance > 0.40:
            review_triggers.append("INCOME_DECLARED_VERIFIED_DISCREPANCY")

    # Determine final outcome
    if hard_rejects:
        outcome = DecisionOutcome.REJECTED
        reasons = hard_rejects + review_triggers
        approved_principal = 0.0
        approved_term = 0
        approved_rate = 0.0
        reviewer = ReviewerRole.AUTOMATED_RULES_ENGINE
        notes = f"Rejected due to policy threshold failures: {', '.join(hard_rejects)}."
    elif review_triggers:
        outcome = DecisionOutcome.MANUAL_REVIEW
        reasons = review_triggers
        approved_principal = 0.0
        approved_term = 0
        approved_rate = 0.0
        reviewer = ReviewerRole.OPERATIONS_ANALYST
        notes = f"Referred for human manual review: {', '.join(review_triggers)}."
    else:
        outcome = DecisionOutcome.APPROVED
        reasons = ["PASS_ALL_UNDERWRITING_CRITERIA"]
        approved_principal = application.requested_principal
        approved_term = application.requested_term_months
        
        # Risk-based pricing tier:
        if application.credit_score >= 740:
            rate_delta = -0.5
        elif application.credit_score >= 680:
            rate_delta = 0.5
        else:
            rate_delta = 2.0
            
        approved_rate = round(max(product.base_interest_rate + rate_delta, 3.5), 2)
        reviewer = ReviewerRole.AUTOMATED_RULES_ENGINE
        notes = "Auto-approved with standard underwriting criteria satisfied."

    decision_id = f"DEC-{application.application_id}-01"
    
    # If edge case where decision precedes checks, timestamp is adjusted
    ts = decision_timestamp
    if is_decision_preceded_anomaly:
        # Intentionally placed earlier
        ts = application.submission_timestamp

    decision = Decision(
        decision_id=decision_id,
        application_id=application.application_id,
        outcome=outcome,
        approved_principal=approved_principal,
        approved_term_months=approved_term,
        approved_interest_rate=approved_rate,
        decision_reason_codes="|".join(reasons),
        decision_notes=notes,
        reviewer_role=reviewer,
        decision_timestamp=ts,
    )
    return decision, reasons

"""Affordability assessment and Debt-to-Income (DTI) metrics calculation."""

from datetime import datetime
from typing import List
from src.domain.enums import AffordabilityResult, FacilityStatus, VerificationStatus
from src.domain.models import AffordabilityCheck, CreditFacility, IncomeRecord, LoanProduct


def calculate_affordability(
    application_id: str,
    product: LoanProduct,
    requested_principal: float,
    requested_term_months: int,
    income_records: List[IncomeRecord],
    credit_facilities: List[CreditFacility],
    check_timestamp: datetime,
) -> AffordabilityCheck:
    """
    Computes debt-to-income and net disposable income strictly from master records.
    """
    # 1. Sum verified net monthly income
    verified_income = sum(
        inc.net_monthly_amount
        for inc in income_records
        if inc.verification_status == VerificationStatus.VERIFIED
    )

    # 2. Sum active debt obligations
    existing_debt = sum(
        fac.monthly_payment
        for fac in credit_facilities
        if fac.facility_status == FacilityStatus.ACTIVE
    )

    # 3. Model living expenses: $1,100 baseline plus 15% of verified income
    living_expenses = round(1100.0 + (0.15 * verified_income), 2)

    # 4. Compute proposed monthly installment (French amortization estimate)
    if requested_term_months > 0 and requested_principal > 0:
        monthly_rate = (product.base_interest_rate / 100.0) / 12.0
        if monthly_rate > 0:
            factor = (1.0 + monthly_rate) ** requested_term_months
            proposed_payment = round(
                requested_principal * (monthly_rate * factor) / (factor - 1.0), 2
            )
        else:
            proposed_payment = round(requested_principal / requested_term_months, 2)
    else:
        proposed_payment = 0.0

    # 5. Ratios
    if verified_income > 0:
        calculated_dti = round(existing_debt / verified_income, 4)
        calculated_total_dti = round((existing_debt + proposed_payment) / verified_income, 4)
    else:
        calculated_dti = 1.0
        calculated_total_dti = 1.0

    net_disposable = round(
        verified_income - existing_debt - living_expenses - proposed_payment, 2
    )

    # 6. Evaluation outcome against product thresholds
    if verified_income <= 0:
        result = AffordabilityResult.FAIL
    elif calculated_total_dti <= product.max_dti_threshold and net_disposable >= 250.0:
        result = AffordabilityResult.PASS
    elif calculated_total_dti <= (product.max_dti_threshold + 0.06) and net_disposable >= 50.0:
        result = AffordabilityResult.MARGINAL
    else:
        result = AffordabilityResult.FAIL

    check_id = f"AFF-{application_id}-01"
    return AffordabilityCheck(
        check_id=check_id,
        application_id=application_id,
        total_verified_monthly_income=round(verified_income, 2),
        existing_monthly_debt_obligations=round(existing_debt, 2),
        estimated_living_expenses=living_expenses,
        proposed_loan_monthly_payment=proposed_payment,
        calculated_dti=calculated_dti,
        calculated_total_dti=calculated_total_dti,
        net_disposable_income=net_disposable,
        affordability_result=result,
        check_timestamp=check_timestamp,
    )

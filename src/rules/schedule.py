"""Amortization schedule calculation with penny-accurate reconciliation."""

from datetime import date, timedelta
from typing import List, Tuple
from src.domain.enums import ScheduleStatus
from src.domain.models import RepaymentSchedule


def calculate_repayment_schedule(
    application_id: str,
    principal: float,
    annual_interest_rate: float,
    term_months: int,
    start_date: date,
    corrupt_reconciliation: bool = False,
) -> List[RepaymentSchedule]:
    """
    Computes an exact French amortization schedule.
    Reconciles principal rounding on the terminal payment so the sum of principal
    components equals the original loan principal exactly.
    """
    if term_months <= 0 or principal <= 0:
        return []

    monthly_rate = (annual_interest_rate / 100.0) / 12.0
    
    # Calculate fixed monthly EMI
    if monthly_rate > 0:
        factor = (1.0 + monthly_rate) ** term_months
        emi = round(principal * (monthly_rate * factor) / (factor - 1.0), 2)
    else:
        emi = round(principal / term_months, 2)

    schedule: List[RepaymentSchedule] = []
    remaining_balance = round(principal, 2)
    current_date = start_date

    for i in range(1, term_months + 1):
        # Approximate monthly increment (30 days)
        # Advance approximately 1 month
        month = current_date.month + 1
        year = current_date.year
        if month > 12:
            month = 1
            year += 1
        day = min(current_date.day, 28)
        due_date = date(year, month, day)
        current_date = due_date

        if i == term_months:
            # Final month: principal component absorbs remainder to reconcile to zero
            interest_component = round(remaining_balance * monthly_rate, 2)
            principal_component = round(remaining_balance, 2)
            payment_amount = round(principal_component + interest_component, 2)
            remaining_balance = 0.0
        else:
            interest_component = round(remaining_balance * monthly_rate, 2)
            principal_component = round(emi - interest_component, 2)
            # Safeguard in case interest exceeds EMI
            if principal_component < 0:
                principal_component = 0.0
            remaining_balance = round(remaining_balance - principal_component, 2)
            payment_amount = round(principal_component + interest_component, 2)

        # Deliberate edge case injection for reconciliation failure
        if corrupt_reconciliation and i == term_months:
            principal_component = round(principal_component + 150.00, 2)
            payment_amount = round(payment_amount + 150.00, 2)
            remaining_balance = -150.00

        schedule_id = f"SCH-{application_id}-{i:02d}"
        schedule.append(
            RepaymentSchedule(
                schedule_id=schedule_id,
                application_id=application_id,
                installment_number=i,
                due_date=due_date,
                payment_amount=payment_amount,
                principal_component=principal_component,
                interest_component=interest_component,
                remaining_balance=remaining_balance,
                status=ScheduleStatus.SCHEDULED,
            )
        )

    return schedule


def verify_schedule_reconciliation(
    principal: float,
    schedule: List[RepaymentSchedule],
    tolerance_cents: float = 0.01,
) -> Tuple[bool, float, float]:
    """
    Validates that the sum of principal components matches the original principal.
    Returns (is_reconciled, total_principal_scheduled, discrepancy).
    """
    total_principal = sum(item.principal_component for item in schedule)
    discrepancy = round(abs(total_principal - principal), 2)
    is_valid = discrepancy <= tolerance_cents
    return is_valid, round(total_principal, 2), discrepancy

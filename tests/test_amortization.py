"""Unit tests for loan amortization and schedule reconciliation."""

from datetime import date
import pytest
from src.rules.schedule import calculate_repayment_schedule, verify_schedule_reconciliation


def test_standard_amortization_reconciliation():
    """Verify that an amortization schedule reconciles to the exact penny."""
    principal = 25000.00
    annual_rate = 8.5
    term = 36
    start_date = date(2026, 3, 1)

    schedule = calculate_repayment_schedule(
        application_id="LOAN-TEST-001",
        principal=principal,
        annual_interest_rate=annual_rate,
        term_months=term,
        start_date=start_date,
        corrupt_reconciliation=False,
    )

    assert len(schedule) == term
    is_valid, total_scheduled, diff = verify_schedule_reconciliation(principal, schedule)
    assert is_valid is True
    assert total_scheduled == principal
    assert diff == 0.0


def test_corrupted_schedule_detection():
    """Verify that deliberate reconciliation discrepancies are caught."""
    principal = 15000.00
    annual_rate = 6.5
    term = 24
    start_date = date(2026, 3, 1)

    corrupted_schedule = calculate_repayment_schedule(
        application_id="LOAN-TEST-002",
        principal=principal,
        annual_interest_rate=annual_rate,
        term_months=term,
        start_date=start_date,
        corrupt_reconciliation=True,
    )

    is_valid, total_scheduled, diff = verify_schedule_reconciliation(principal, corrupted_schedule)
    assert is_valid is False
    assert diff > 0.0

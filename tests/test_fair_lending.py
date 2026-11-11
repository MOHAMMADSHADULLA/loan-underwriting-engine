"""Unit tests asserting complete Fair Lending isolation of protected attributes."""

import pytest
from src.rules.compliance import (
    FairLendingViolation,
    assert_no_protected_attributes,
    sanitize_underwriting_inputs,
)


def test_no_protected_attributes_allowed():
    """Ensure accessing protected attributes raises FairLendingViolation."""
    dirty_features = ["credit_score", "dti", "gender", "income"]
    with pytest.raises(FairLendingViolation):
        assert_no_protected_attributes(dirty_features)


def test_clean_features_pass():
    """Ensure non-protected features pass seamlessly."""
    clean_features = ["credit_score", "dti", "monthly_income", "requested_principal"]
    assert assert_no_protected_attributes(clean_features) is True


def test_sanitize_underwriting_inputs():
    """Verify input sanitizer strips all demographic protected variables."""
    raw_payload = {
        "credit_score": 710,
        "dti": 0.28,
        "gender": "Female",
        "ethnicity": "Hispanic",
        "religion": "None",
        "monthly_income": 6200.0,
    }
    sanitized = sanitize_underwriting_inputs(raw_payload)
    assert "gender" not in sanitized
    assert "ethnicity" not in sanitized
    assert "religion" not in sanitized
    assert sanitized["credit_score"] == 710
    assert sanitized["monthly_income"] == 6200.0

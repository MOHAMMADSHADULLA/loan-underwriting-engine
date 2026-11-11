"""Compliance and Fair Lending attribute protection guards."""

from typing import Any, Dict, List, Set

PROTECTED_ATTRIBUTES: Set[str] = {
    "gender",
    "sex",
    "ethnicity",
    "race",
    "religion",
    "marital_status",
    "sexual_orientation",
    "nationality",
}


class FairLendingViolation(Exception):
    """Raised when a protected demographic attribute is introduced into underwriting evaluation."""
    pass


def sanitize_underwriting_inputs(inputs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Strips any protected attributes before feeding into the automated underwriting engine.
    Ensures complete compliance with Fair Lending regulations (e.g. ECOA / Reg B).
    """
    clean_inputs = {}
    for key, value in inputs.items():
        if key.lower() in PROTECTED_ATTRIBUTES:
            continue
        clean_inputs[key] = value
    return clean_inputs


def assert_no_protected_attributes(feature_keys: List[str]) -> bool:
    """
    Validates that a feature set does not contain forbidden protected demographic variables.
    """
    violations = [k for k in feature_keys if k.lower() in PROTECTED_ATTRIBUTES]
    if violations:
        raise FairLendingViolation(
            f"Underwriting model accessed protected attributes: {violations}"
        )
    return True

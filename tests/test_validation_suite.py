"""Validation suite tests verifying integrity and ground truth correlation."""

from pathlib import Path
from src.generator.engine import generate_dataset
from src.validator.engine import run_full_validation_suite


def test_starter_validation_suite(tmp_path: Path):
    """Verify validation suite execution on generated starter dataset."""
    dataset = generate_dataset(
        num_applicants=50,
        num_applications=30,
        seed=20261022,
        num_edge_cases_per_type=2,
    )

    report = run_full_validation_suite(dataset, tmp_path)

    # Core integrity must pass
    assert report["primary_key_uniqueness"]["overall_passed"] is True
    assert report["foreign_key_integrity"]["overall_passed"] is True
    assert report["fair_lending_compliance"]["passed"] is True
    # Ground truth parity must match exactly
    assert report["ground_truth_reconciliation"]["match"] is True

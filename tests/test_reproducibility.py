"""Tests for fixed-seed bitwise reproducibility."""

from src.reproducibility.verifier import verify_reproducibility


def test_reproducibility_bit_parity():
    """Validates that two separate generations with the same seed are bitwise identical."""
    res = verify_reproducibility(
        seed=20261022,
        num_applicants=40,
        num_applications=20,
        num_edge_cases=1,
    )
    assert res["overall_reproducible"] is True
    for entity, details in res["tables"].items():
        assert details["reproducible"] is True
        assert details["counts_match"] is True
        assert details["hashes_match"] is True

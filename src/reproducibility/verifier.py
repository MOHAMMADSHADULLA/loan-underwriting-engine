"""Reproducibility verification: executes dual generation runs with identical seeds and verifies hash parity."""

import hashlib
import json
from pathlib import Path
from typing import Any, Dict, Optional

from src.generator.engine import generate_dataset


def _hash_object(obj: Any) -> str:
    serialized = json.dumps(obj, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def verify_reproducibility(
    seed: int = 20261022,
    num_applicants: int = 100,
    num_applications: int = 60,
    num_edge_cases: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Generates two separate runs with identical seed and compares row counts and SHA-256 checksums.
    """
    if num_edge_cases is None:
        num_edge_cases = 10 if num_applications >= 1000 else 2

    # Run 1
    ds1 = generate_dataset(
        num_applicants=num_applicants,
        num_applications=num_applications,
        seed=seed,
        num_edge_cases_per_type=num_edge_cases,
    )

    # Run 2
    ds2 = generate_dataset(
        num_applicants=num_applicants,
        num_applications=num_applications,
        seed=seed,
        num_edge_cases_per_type=num_edge_cases,
    )

    entities = [
        "products",
        "applicants",
        "employments",
        "income_records",
        "credit_facilities",
        "applications",
        "documents",
        "affordability_checks",
        "decisions",
        "repayment_schedules",
        "application_events",
        "ground_truth",
    ]

    table_comparisons = {}
    all_matched = True

    for entity in entities:
        records1 = [r.model_dump(mode="json") for r in getattr(ds1, entity)]
        records2 = [r.model_dump(mode="json") for r in getattr(ds2, entity)]

        count1 = len(records1)
        count2 = len(records2)
        hash1 = _hash_object(records1)
        hash2 = _hash_object(records2)

        match = (count1 == count2) and (hash1 == hash2)
        if not match:
            all_matched = False

        table_comparisons[entity] = {
            "run_1_count": count1,
            "run_2_count": count2,
            "run_1_sha256": hash1,
            "run_2_sha256": hash2,
            "counts_match": count1 == count2,
            "hashes_match": hash1 == hash2,
            "reproducible": match,
        }

    return {
        "seed": seed,
        "overall_reproducible": all_matched,
        "tables": table_comparisons,
    }

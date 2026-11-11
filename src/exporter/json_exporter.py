"""JSON Exporter for relational entities and ground truth."""

import json
from pathlib import Path
from typing import Dict
from src.generator.engine import GeneratedDataset


def export_dataset_to_json(dataset: GeneratedDataset, output_dir: Path) -> Dict[str, Path]:
    """
    Exports all dataset entities to JSON format.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    json_dir = output_dir / "json"
    json_dir.mkdir(parents=True, exist_ok=True)

    tables = {
        "loan_products": [p.model_dump(mode="json") for p in dataset.products],
        "applicants": [a.model_dump(mode="json") for a in dataset.applicants],
        "employments": [e.model_dump(mode="json") for e in dataset.employments],
        "income_records": [i.model_dump(mode="json") for i in dataset.income_records],
        "credit_facilities": [f.model_dump(mode="json") for f in dataset.credit_facilities],
        "loan_applications": [app.model_dump(mode="json") for app in dataset.applications],
        "documents": [d.model_dump(mode="json") for d in dataset.documents],
        "affordability_checks": [c.model_dump(mode="json") for c in dataset.affordability_checks],
        "decisions": [dec.model_dump(mode="json") for dec in dataset.decisions],
        "repayment_schedules": [s.model_dump(mode="json") for s in dataset.repayment_schedules],
        "application_events": [evt.model_dump(mode="json") for evt in dataset.application_events],
        "ground_truth": [gt.model_dump(mode="json") for gt in dataset.ground_truth],
    }

    exported_files: Dict[str, Path] = {}

    for table_name, rows in tables.items():
        file_path = json_dir / f"{table_name}.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(rows, f, indent=2, default=str)
        exported_files[table_name] = file_path

    return exported_files

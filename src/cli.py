"""Command-Line Interface (CLI) for Loan Underwriting & Decisioning Engine."""

import argparse
import json
from pathlib import Path
import sys

from src.exporter.csv_exporter import export_dataset_to_csv
from src.exporter.json_exporter import export_dataset_to_json
from src.exporter.sql_exporter import export_dataset_to_sql
from src.generator.engine import generate_dataset
from src.reproducibility.verifier import verify_reproducibility
from src.validator.engine import run_full_validation_suite


def main():
    parser = argparse.ArgumentParser(
        description="Loan Underwriting & Decisioning Engine (YottaFlex Coding Challenge)"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # Command: generate
    gen_parser = subparsers.add_parser("generate", help="Generate synthetic loan dataset")
    gen_parser.add_argument(
        "--scale",
        choices=["starter", "full"],
        default="starter",
        help="Scale preset: starter (100 applicants / 60 loans) or full (10,000 applicants / 6,000 loans)",
    )
    gen_parser.add_argument("--applicants", type=int, default=None, help="Explicit applicant count override")
    gen_parser.add_argument("--applications", type=int, default=None, help="Explicit application count override")
    gen_parser.add_argument("--seed", type=int, default=20261022, help="Fixed random seed for deterministic generation")
    gen_parser.add_argument("--out-dir", type=str, default="output", help="Destination output folder")
    gen_parser.add_argument(
        "--format",
        choices=["all", "csv", "json", "sql"],
        default="all",
        help="Export format(s)",
    )

    # Command: validate
    val_parser = subparsers.add_parser("validate", help="Validate generated dataset integrity")
    val_parser.add_argument(
        "--scale",
        choices=["starter", "full"],
        default="starter",
        help="Scale preset to validate",
    )
    val_parser.add_argument("--seed", type=int, default=20261022, help="Seed used for generation")
    val_parser.add_argument("--out-dir", type=str, default="output", help="Output directory for reports")

    # Command: verify-reproducibility
    rep_parser = subparsers.add_parser(
        "verify-reproducibility",
        help="Generate twice with same seed and compare row counts and SHA-256 hashes",
    )
    rep_parser.add_argument("--seed", type=int, default=20261022, help="Seed to test reproducibility")
    rep_parser.add_argument("--applicants", type=int, default=100, help="Test applicant count")
    rep_parser.add_argument("--applications", type=int, default=60, help="Test application count")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "generate":
        if args.scale == "full":
            num_applicants = args.applicants or 10000
            num_applications = args.applications or 6000
            edge_cases = 10
        else:
            num_applicants = args.applicants or 100
            num_applications = args.applications or 60
            edge_cases = 2

        print(f"Generating dataset [Scale: {args.scale}, Seed: {args.seed}]...")
        print(f"Applicants: {num_applicants}, Applications: {num_applications} across 4 products.")

        dataset = generate_dataset(
            num_applicants=num_applicants,
            num_applications=num_applications,
            seed=args.seed,
            num_edge_cases_per_type=edge_cases,
        )

        out_path = Path(args.out_dir)
        print("Exporting data files...")
        if args.format in ("all", "csv"):
            csv_files = export_dataset_to_csv(dataset, out_path)
            print(f"  [+] CSV exported: {len(csv_files)} files in {out_path / 'csv'}")
        if args.format in ("all", "json"):
            json_files = export_dataset_to_json(dataset, out_path)
            print(f"  [+] JSON exported: {len(json_files)} files in {out_path / 'json'}")
        if args.format in ("all", "sql"):
            sql_file = export_dataset_to_sql(dataset, out_path)
            print(f"  [+] SQL schema & seed exported to {sql_file}")

        print("Running validation suite on generated data...")
        val_report = run_full_validation_suite(dataset, out_path)
        print(f"  [+] Validation report generated in {out_path / 'VALIDATION_SUMMARY.md'}")
        print("\nGeneration summary:")
        for k, v in dataset.summary().items():
            print(f"  - {k}: {v}")

    elif args.command == "validate":
        if args.scale == "full":
            num_applicants = 10000
            num_applications = 6000
            edge_cases = 10
        else:
            num_applicants = 100
            num_applications = 60
            edge_cases = 2

        print(f"Validating dataset [Scale: {args.scale}, Seed: {args.seed}]...")
        dataset = generate_dataset(
            num_applicants=num_applicants,
            num_applications=num_applications,
            seed=args.seed,
            num_edge_cases_per_type=edge_cases,
        )
        out_path = Path(args.out_dir)
        report = run_full_validation_suite(dataset, out_path)
        print("\nValidation Results Summary:")
        print(f"  - Primary Key Uniqueness: {'PASSED' if report['primary_key_uniqueness']['overall_passed'] else 'FAILED'}")
        print(f"  - Foreign Key Integrity:  {'PASSED' if report['foreign_key_integrity']['overall_passed'] else 'FAILED'}")
        print(f"  - Fair Lending Guardrail: {'PASSED' if report['fair_lending_compliance']['passed'] else 'FAILED'}")
        print(f"  - Ground Truth Parity:    {'PASSED' if report['ground_truth_reconciliation']['match'] else 'FAILED'}")
        print(f"Detailed report saved to: {out_path / 'VALIDATION_SUMMARY.md'}")

    elif args.command == "verify-reproducibility":
        print(f"Verifying reproducibility for Seed {args.seed} across dual independent generation cycles...")
        rep_res = verify_reproducibility(
            seed=args.seed,
            num_applicants=args.applicants,
            num_applications=args.applications,
        )

        print("\n" + "=" * 80)
        print(f"REPRODUCIBILITY VERIFICATION REPORT (Seed: {args.seed})")
        print("=" * 80)
        print(f"{'Entity':<24} | {'Run 1 Rows':<10} | {'Run 2 Rows':<10} | {'SHA-256 Match':<14} | {'Status'}")
        print("-" * 80)
        for entity, info in rep_res["tables"].items():
            status = "PASS" if info["reproducible"] else "FAIL"
            sha_match = "IDENTICAL" if info["hashes_match"] else "MISMATCH"
            print(f"{entity:<24} | {info['run_1_count']:<10} | {info['run_2_count']:<10} | {sha_match:<14} | {status}")
        print("-" * 80)
        print(f"OVERALL REPRODUCIBILITY RESULT: {'SUCCESS (100% BIT-FOR-BIT IDENTICAL)' if rep_res['overall_reproducible'] else 'FAILED'}")


if __name__ == "__main__":
    main()

"""Synthetic Data Generator Engine orchestrator with deterministic seeding."""

from dataclasses import dataclass
import random
from typing import List

from src.domain.models import (
    AffordabilityCheck,
    Applicant,
    ApplicationEvent,
    CreditFacility,
    Decision,
    Document,
    Employment,
    GroundTruthEntry,
    IncomeRecord,
    LoanApplication,
    LoanProduct,
    RepaymentSchedule,
)
from src.generator.edge_cases import EdgeCaseRegistry
from src.generator.master_data import generate_master_dataset
from src.generator.transactions import generate_transactional_dataset


@dataclass
class GeneratedDataset:
    products: List[LoanProduct]
    applicants: List[Applicant]
    employments: List[Employment]
    income_records: List[IncomeRecord]
    credit_facilities: List[CreditFacility]
    applications: List[LoanApplication]
    documents: List[Document]
    affordability_checks: List[AffordabilityCheck]
    decisions: List[Decision]
    repayment_schedules: List[RepaymentSchedule]
    application_events: List[ApplicationEvent]
    ground_truth: List[GroundTruthEntry]

    def summary(self) -> dict:
        return {
            "products": len(self.products),
            "applicants": len(self.applicants),
            "employments": len(self.employments),
            "income_records": len(self.income_records),
            "credit_facilities": len(self.credit_facilities),
            "applications": len(self.applications),
            "documents": len(self.documents),
            "affordability_checks": len(self.affordability_checks),
            "decisions": len(self.decisions),
            "repayment_schedules": len(self.repayment_schedules),
            "application_events": len(self.application_events),
            "ground_truth_entries": len(self.ground_truth),
        }


def generate_dataset(
    num_applicants: int = 10000,
    num_applications: int = 6000,
    seed: int = 20261022,
    num_edge_cases_per_type: int = 10,
    reference_year: int = 2026,
) -> GeneratedDataset:
    """
    Deterministic end-to-end dataset generation.
    Given the same seed and scale parameters, produces bit-for-bit identical outputs.
    """
    rng = random.Random(seed)
    edge_case_registry = EdgeCaseRegistry()

    # Step 1: Master Data First
    products, applicants, employments, income_records, credit_facilities = generate_master_dataset(
        num_applicants=num_applicants,
        rng=rng,
        reference_year=reference_year,
    )

    # Step 2: Transactions & Dependent Records
    (
        applications,
        documents,
        affordability_checks,
        decisions,
        repayment_schedules,
        application_events,
    ) = generate_transactional_dataset(
        num_applications=num_applications,
        products=products,
        applicants=applicants,
        employments=employments,
        income_records=income_records,
        credit_facilities=credit_facilities,
        rng=rng,
        edge_case_registry=edge_case_registry,
        reference_year=reference_year,
        num_edge_cases_per_type=num_edge_cases_per_type,
    )

    return GeneratedDataset(
        products=products,
        applicants=applicants,
        employments=employments,
        income_records=income_records,
        credit_facilities=credit_facilities,
        applications=applications,
        documents=documents,
        affordability_checks=affordability_checks,
        decisions=decisions,
        repayment_schedules=repayment_schedules,
        application_events=application_events,
        ground_truth=edge_case_registry.ground_truth_entries,
    )

"""Transaction & event generator: Applications, Documents, Affordability, Decisions, Schedules, Events."""

import hashlib
import random
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

from src.domain.enums import (
    ApplicationStatus,
    DecisionOutcome,
    DocumentStatus,
    DocumentType,
    EmploymentType,
    EventType,
    IssueType,
    LoanPurpose,
    ReviewerRole,
    VerificationStatus,
)
from src.domain.models import (
    AffordabilityCheck,
    Applicant,
    ApplicationEvent,
    CreditFacility,
    Decision,
    Document,
    Employment,
    IncomeRecord,
    LoanApplication,
    LoanProduct,
    RepaymentSchedule,
)
from src.generator.distributions import sample_credit_score, sample_datetime_between
from src.generator.edge_cases import EdgeCaseRegistry
from src.rules.affordability import calculate_affordability
from src.rules.decision_engine import evaluate_loan_application
from src.rules.schedule import calculate_repayment_schedule


def generate_transactional_dataset(
    num_applications: int,
    products: List[LoanProduct],
    applicants: List[Applicant],
    employments: List[Employment],
    income_records: List[IncomeRecord],
    credit_facilities: List[CreditFacility],
    rng: random.Random,
    edge_case_registry: EdgeCaseRegistry,
    reference_year: int = 2026,
    num_edge_cases_per_type: int = 10,
) -> Tuple[
    List[LoanApplication],
    List[Document],
    List[AffordabilityCheck],
    List[Decision],
    List[RepaymentSchedule],
    List[ApplicationEvent],
]:
    """
    Generates consistent relational transactions obeying business rules.
    Derives values strictly from parent master records.
    Injects documented, labelled edge cases.
    """
    # Build fast lookups by applicant_id
    emp_by_app: Dict[str, List[Employment]] = defaultdict(list)
    for emp in employments:
        emp_by_app[emp.applicant_id].append(emp)

    inc_by_app: Dict[str, List[IncomeRecord]] = defaultdict(list)
    for inc in income_records:
        inc_by_app[inc.applicant_id].append(inc)

    fac_by_app: Dict[str, List[CreditFacility]] = defaultdict(list)
    for fac in credit_facilities:
        fac_by_app[fac.applicant_id].append(fac)

    product_map = {p.product_id: p for p in products}
    product_keys = list(product_map.keys())

    applications: List[LoanApplication] = []
    documents: List[Document] = []
    affordability_checks: List[AffordabilityCheck] = []
    decisions: List[Decision] = []
    repayment_schedules: List[RepaymentSchedule] = []
    application_events: List[ApplicationEvent] = []

    start_window = datetime(reference_year, 2, 1, 9, 0, 0)
    end_window = datetime(reference_year, 10, 15, 17, 0, 0)

    # Pre-select indices for edge case injection
    # Ensure indices are within bounds and mutually exclusive where appropriate
    step = max(1, num_applications // (num_edge_cases_per_type * 6))
    
    term_anomaly_indices = set(range(10, 10 + num_edge_cases_per_type * step, step)[:num_edge_cases_per_type])
    income_conflict_indices = set(range(15, 15 + num_edge_cases_per_type * step, step)[:num_edge_cases_per_type])
    temporal_anomaly_indices = set(range(20, 20 + num_edge_cases_per_type * step, step)[:num_edge_cases_per_type])
    reconciliation_anomaly_indices = set(range(25, 25 + num_edge_cases_per_type * step, step)[:num_edge_cases_per_type])
    duplicate_disburse_indices = set(range(30, 30 + num_edge_cases_per_type * step, step)[:num_edge_cases_per_type])

    doc_counter = 1

    for app_idx in range(1, num_applications + 1):
        app_id = f"LOAN-{reference_year}-{app_idx:06d}"
        
        # Pick applicant deterministically
        applicant = applicants[(app_idx - 1) % len(applicants)]
        product = product_map[product_keys[(app_idx - 1) % len(product_keys)]]
        
        applicant_incs = list(inc_by_app.get(applicant.applicant_id, []))
        applicant_facs = list(fac_by_app.get(applicant.applicant_id, []))
        applicant_emps = list(emp_by_app.get(applicant.applicant_id, []))

        is_approval_dependent_anomaly = (
            app_idx in reconciliation_anomaly_indices or app_idx in duplicate_disburse_indices
        )

        if is_approval_dependent_anomaly:
            # Ensure applicant has stable verified income and clean profile
            for inc in applicant_incs:
                inc.verification_status = VerificationStatus.VERIFIED
                inc.net_monthly_amount = max(inc.net_monthly_amount, 6500.0)
                inc.gross_monthly_amount = max(inc.gross_monthly_amount, 8500.0)
            for fac in applicant_facs:
                if fac.monthly_payment > 400.0:
                    fac.monthly_payment = 150.0
            for emp in applicant_emps:
                emp.employment_type = EmploymentType.FULL_TIME
                emp.is_current = True
                emp.tenure_months = max(emp.tenure_months, 24)

        total_net_inc = sum(inc.net_monthly_amount for inc in applicant_incs)

        # Baseline requested principal & term
        if is_approval_dependent_anomaly:
            # Calibrate features to guarantee standard approval prerequisites
            req_principal = round(product.min_principal + 2000.0, -2)
            credit_score = max(sample_credit_score(rng), 750)
            req_term = product.min_term_months + 12
        else:
            step_factor = rng.uniform(0.15, 0.85)
            req_principal = round(
                product.min_principal + step_factor * (product.max_principal - product.min_principal), -2
            )
            # Choose term in 12-month increments within allowed range
            allowed_terms = [
                t for t in range(product.min_term_months, product.max_term_months + 1, 12)
            ]
            if not allowed_terms:
                allowed_terms = [product.min_term_months]
            req_term = rng.choice(allowed_terms)
            credit_score = sample_credit_score(rng)

        submission_time = sample_datetime_between(rng, start_window, end_window)
        purpose = rng.choice(list(LoanPurpose))

        # Declared income: normally within 5% of total income
        declared_income = round(total_net_inc * rng.uniform(0.95, 1.05), 2)

        application = LoanApplication(
            application_id=app_id,
            applicant_id=applicant.applicant_id,
            product_id=product.product_id,
            requested_principal=req_principal,
            requested_term_months=req_term,
            purpose=purpose,
            application_status=ApplicationStatus.SUBMITTED,
            credit_score=credit_score,
            declared_monthly_income=declared_income,
            submission_timestamp=submission_time,
            updated_at=submission_time,
        )

        # Event: Submitted
        evt_1 = ApplicationEvent(
            event_id=f"EVT-{app_id}-01",
            application_id=app_id,
            from_status="NONE",
            to_status=ApplicationStatus.SUBMITTED.value,
            event_type=EventType.APPLICATION_SUBMITTED,
            actor=ReviewerRole.OPERATIONS_ANALYST,
            timestamp=submission_time,
            details="Loan application formally submitted by applicant.",
        )
        application_events.append(evt_1)

        # Inject Edge Case 1: Term out of bounds
        if app_idx in term_anomaly_indices:
            application = edge_case_registry.inject_term_out_of_bounds(application, product)

        # Inject Edge Case 4: Income source conflict
        if app_idx in income_conflict_indices:
            application = edge_case_registry.inject_income_source_conflict(
                application, total_net_inc
            )

        # Generate Documents
        app_docs: List[Document] = []
        doc_types = [
            DocumentType.PROOF_OF_IDENTITY,
            DocumentType.PROOF_OF_INCOME,
            DocumentType.BANK_STATEMENTS,
            DocumentType.PROOF_OF_ADDRESS,
        ]
        
        doc_upload_time = submission_time + timedelta(minutes=rng.randint(5, 30))
        for d_type in doc_types:
            doc_id = f"DOC-{app_id}-{len(app_docs) + 1:03d}"
            if is_approval_dependent_anomaly:
                d_status = DocumentStatus.VERIFIED
            else:
                # 92% verified, 5% pending, 3% missing
                d_status = rng.choices(
                    [DocumentStatus.VERIFIED, DocumentStatus.PENDING, DocumentStatus.MISSING],
                    weights=[0.92, 0.05, 0.03],
                    k=1,
                )[0]
            
            verified_time = (
                doc_upload_time + timedelta(minutes=rng.randint(15, 60))
                if d_status == DocumentStatus.VERIFIED
                else None
            )
            file_hash = hashlib.sha256(f"{doc_id}-{d_type}".encode("utf-8")).hexdigest()

            doc = Document(
                document_id=doc_id,
                application_id=app_id,
                applicant_id=applicant.applicant_id,
                document_type=d_type,
                document_status=d_status,
                file_hash=file_hash,
                uploaded_at=doc_upload_time,
                verified_at=verified_time,
            )
            app_docs.append(doc)
            documents.append(doc)

        # Event: Documents Verified
        evt_2 = ApplicationEvent(
            event_id=f"EVT-{app_id}-02",
            application_id=app_id,
            from_status=ApplicationStatus.SUBMITTED.value,
            to_status=ApplicationStatus.UNDER_REVIEW.value,
            event_type=EventType.DOCUMENTS_VERIFIED,
            actor=ReviewerRole.OPERATIONS_ANALYST,
            timestamp=doc_upload_time + timedelta(minutes=45),
            details="Mandatory KYC and income documents collected and reviewed.",
        )
        application_events.append(evt_2)

        # Affordability Check
        aff_time = doc_upload_time + timedelta(minutes=50)
        affordability = calculate_affordability(
            application_id=app_id,
            product=product,
            requested_principal=application.requested_principal,
            requested_term_months=application.requested_term_months,
            income_records=applicant_incs,
            credit_facilities=applicant_facs,
            check_timestamp=aff_time,
        )
        affordability_checks.append(affordability)

        # Event: Affordability Check Evaluated
        evt_3 = ApplicationEvent(
            event_id=f"EVT-{app_id}-03",
            application_id=app_id,
            from_status=ApplicationStatus.UNDER_REVIEW.value,
            to_status=ApplicationStatus.UNDER_REVIEW.value,
            event_type=EventType.AFFORDABILITY_EVALUATED,
            actor=ReviewerRole.AUTOMATED_RULES_ENGINE,
            timestamp=aff_time,
            details=f"DTI calculated: {affordability.calculated_total_dti:.2%}, Net disposable: ${affordability.net_disposable_income:.2f}, Result: {affordability.affordability_result.value}",
        )
        application_events.append(evt_3)

        # Decision Evaluation
        decision_time = aff_time + timedelta(minutes=20)
        decision, reasons = evaluate_loan_application(
            application=application,
            product=product,
            affordability=affordability,
            documents=app_docs,
            employments=applicant_emps,
            decision_timestamp=decision_time,
        )

        # Inject Edge Case 3: Decision precedes checks
        if app_idx in temporal_anomaly_indices:
            decision = edge_case_registry.inject_decision_precedes_checks(decision, affordability)

        decisions.append(decision)

        # Update application status
        if decision.outcome == DecisionOutcome.APPROVED:
            application.application_status = ApplicationStatus.APPROVED
        elif decision.outcome == DecisionOutcome.MANUAL_REVIEW:
            application.application_status = ApplicationStatus.MANUAL_REVIEW
        else:
            application.application_status = ApplicationStatus.REJECTED

        application.updated_at = decision.decision_timestamp

        # Event: Decision Rendered
        evt_4 = ApplicationEvent(
            event_id=f"EVT-{app_id}-04",
            application_id=app_id,
            from_status=ApplicationStatus.UNDER_REVIEW.value,
            to_status=application.application_status.value,
            event_type=EventType.DECISION_RENDERED,
            actor=decision.reviewer_role,
            timestamp=decision.decision_timestamp,
            details=f"Decision rendered: {decision.outcome.value}. Reasons: {decision.decision_reason_codes}",
        )
        application_events.append(evt_4)

        # If Approved: Generate Repayment Schedule & Disbursement Event
        if decision.outcome == DecisionOutcome.APPROVED:
            corrupt_schedule = (app_idx in reconciliation_anomaly_indices)
            
            schedule = calculate_repayment_schedule(
                application_id=app_id,
                principal=decision.approved_principal,
                annual_interest_rate=decision.approved_interest_rate,
                term_months=decision.approved_term_months,
                start_date=decision.decision_timestamp.date() + timedelta(days=30),
                corrupt_reconciliation=corrupt_schedule,
            )
            repayment_schedules.extend(schedule)

            if corrupt_schedule:
                edge_case_registry.log_ground_truth(
                    application_id=app_id,
                    entity_type="RepaymentSchedule",
                    record_id=schedule[-1].schedule_id,
                    issue_type=IssueType.SCHEDULE_RECONCILIATION_MISMATCH,
                    is_anomaly=True,
                    expected_decision=DecisionOutcome.APPROVED,
                    rule_triggered="SCHEDULE_ARITHMETIC_RECONCILIATION_MISMATCH",
                    description=f"Repayment schedule for loan {app_id} does not sum to approved principal ${decision.approved_principal:.2f}.",
                )

            # Disbursement Event
            disburse_time = decision.decision_timestamp + timedelta(hours=24)
            application.application_status = ApplicationStatus.DISBURSED
            application.updated_at = disburse_time

            evt_5 = ApplicationEvent(
                event_id=f"EVT-{app_id}-05",
                application_id=app_id,
                from_status=ApplicationStatus.APPROVED.value,
                to_status=ApplicationStatus.DISBURSED.value,
                event_type=EventType.FUNDS_DISBURSED,
                actor=ReviewerRole.OPERATIONS_ANALYST,
                timestamp=disburse_time,
                details=f"Disbursement completed. Amount: ${decision.approved_principal:.2f} transferred to applicant account.",
            )
            application_events.append(evt_5)

            # Inject Edge Case 5: Duplicate disbursement
            if app_idx in duplicate_disburse_indices:
                application_events = edge_case_registry.inject_duplicate_disbursement(
                    application_id=app_id,
                    events=application_events,
                    base_timestamp=disburse_time,
                )

        # Log clean baseline records into ground truth
        if (
            app_idx not in term_anomaly_indices
            and app_idx not in income_conflict_indices
            and app_idx not in temporal_anomaly_indices
            and app_idx not in reconciliation_anomaly_indices
            and app_idx not in duplicate_disburse_indices
        ):
            edge_case_registry.log_ground_truth(
                application_id=app_id,
                entity_type="LoanApplication",
                record_id=app_id,
                issue_type=IssueType.NONE,
                is_anomaly=False,
                expected_decision=decision.outcome,
                rule_triggered=decision.decision_reason_codes,
                description="Valid standard workflow application obeying all domain rules.",
            )

        applications.append(application)

    return (
        applications,
        documents,
        affordability_checks,
        decisions,
        repayment_schedules,
        application_events,
    )

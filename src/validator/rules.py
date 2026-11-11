"""Detailed validation rules for data integrity, arithmetic reconciliation, and lifecycle."""

from collections import Counter, defaultdict
from datetime import datetime
from typing import Any, Dict, List, Set, Tuple

from src.domain.enums import (
    ApplicationStatus,
    DecisionOutcome,
    EventType,
    IssueType,
    VerificationStatus,
)
from src.generator.engine import GeneratedDataset
from src.rules.compliance import PROTECTED_ATTRIBUTES


def check_primary_key_uniqueness(dataset: GeneratedDataset) -> Dict[str, Any]:
    """Validates that primary keys are strictly unique in all tables, including ground truth."""
    checks = {
        "loan_products": [p.product_id for p in dataset.products],
        "applicants": [a.applicant_id for a in dataset.applicants],
        "employments": [e.employment_id for e in dataset.employments],
        "income_records": [i.income_id for i in dataset.income_records],
        "credit_facilities": [f.facility_id for f in dataset.credit_facilities],
        "loan_applications": [app.application_id for app in dataset.applications],
        "documents": [d.document_id for d in dataset.documents],
        "affordability_checks": [c.check_id for c in dataset.affordability_checks],
        "decisions": [dec.decision_id for dec in dataset.decisions],
        "repayment_schedules": [s.schedule_id for s in dataset.repayment_schedules],
        "application_events": [evt.event_id for evt in dataset.application_events],
        "ground_truth": [
            f"{gt.application_id}:{gt.record_id}:{gt.issue_type.value}"
            for gt in dataset.ground_truth
        ],
    }

    results = {}
    passed = True
    for table, keys in checks.items():
        total = len(keys)
        unique = len(set(keys))
        is_ok = (total == unique)
        results[table] = {
            "total_records": total,
            "unique_keys": unique,
            "duplicates": total - unique,
            "passed": is_ok,
        }
        if not is_ok:
            passed = False

    return {"overall_passed": passed, "details": results}


def check_foreign_key_integrity(dataset: GeneratedDataset) -> Dict[str, Any]:
    """Validates that all foreign key references resolve to an existing parent primary key."""
    applicant_ids = {a.applicant_id for a in dataset.applicants}
    product_ids = {p.product_id for p in dataset.products}
    application_ids = {app.application_id for app in dataset.applications}

    fk_checks = [
        ("employments.applicant_id", [e.applicant_id for e in dataset.employments], applicant_ids),
        ("income_records.applicant_id", [i.applicant_id for i in dataset.income_records], applicant_ids),
        ("credit_facilities.applicant_id", [f.applicant_id for f in dataset.credit_facilities], applicant_ids),
        ("loan_applications.applicant_id", [app.applicant_id for app in dataset.applications], applicant_ids),
        ("loan_applications.product_id", [app.product_id for app in dataset.applications], product_ids),
        ("documents.application_id", [d.application_id for d in dataset.documents], application_ids),
        ("documents.applicant_id", [d.applicant_id for d in dataset.documents], applicant_ids),
        ("affordability_checks.application_id", [c.application_id for c in dataset.affordability_checks], application_ids),
        ("decisions.application_id", [dec.application_id for dec in dataset.decisions], application_ids),
        ("repayment_schedules.application_id", [s.application_id for s in dataset.repayment_schedules], application_ids),
        ("application_events.application_id", [evt.application_id for evt in dataset.application_events], application_ids),
    ]

    results = {}
    passed = True
    for relation, fk_values, valid_parent_ids in fk_checks:
        missing = [fk for fk in fk_values if fk not in valid_parent_ids]
        is_ok = (len(missing) == 0)
        results[relation] = {
            "total_fk_refs": len(fk_values),
            "missing_parent_refs": len(missing),
            "passed": is_ok,
        }
        if not is_ok:
            passed = False

    return {"overall_passed": passed, "details": results}


def check_date_ordering(dataset: GeneratedDataset) -> Dict[str, Any]:
    """
    Validates temporal sequence across the complete application lifecycle:
    1. application.submission_timestamp <= document.uploaded_at
    2. document.uploaded_at <= document.verified_at (when verified_at is present)
    3. application.submission_timestamp <= affordability_check.check_timestamp
    4. affordability_check.check_timestamp <= decision.decision_timestamp (DECISION_PRECEDES_CHECKS)
    5. decision.decision_timestamp <= disbursement_event.timestamp

    Detects temporal inversions across all transitions.
    """
    app_map = {a.application_id: a for a in dataset.applications}
    aff_map = {c.application_id: c for c in dataset.affordability_checks}
    dec_map = {d.application_id: d for d in dataset.decisions}

    temporal_inversions = []
    total_audited = len(dataset.applications)

    # 1 & 2: Document upload and verification ordering
    for doc in dataset.documents:
        app = app_map.get(doc.application_id)
        if app and doc.uploaded_at < app.submission_timestamp:
            temporal_inversions.append({
                "application_id": doc.application_id,
                "rule": "DOCUMENT_UPLOAD_PRECEDES_SUBMISSION",
                "document_id": doc.document_id,
                "submission_time": str(app.submission_timestamp),
                "upload_time": str(doc.uploaded_at),
                "delta_minutes": round((app.submission_timestamp - doc.uploaded_at).total_seconds() / 60.0, 1),
                "details": f"Document {doc.document_id} uploaded before application submission",
            })
        if doc.verified_at and doc.verified_at < doc.uploaded_at:
            temporal_inversions.append({
                "application_id": doc.application_id,
                "rule": "DOCUMENT_VERIFICATION_PRECEDES_UPLOAD",
                "document_id": doc.document_id,
                "upload_time": str(doc.uploaded_at),
                "verified_time": str(doc.verified_at),
                "delta_minutes": round((doc.uploaded_at - doc.verified_at).total_seconds() / 60.0, 1),
                "details": f"Document {doc.document_id} verified before upload",
            })

    # 3: Affordability check vs submission
    for aff in dataset.affordability_checks:
        app = app_map.get(aff.application_id)
        if app and aff.check_timestamp < app.submission_timestamp:
            temporal_inversions.append({
                "application_id": aff.application_id,
                "rule": "AFFORDABILITY_PRECEDES_SUBMISSION",
                "check_id": aff.check_id,
                "submission_time": str(app.submission_timestamp),
                "affordability_time": str(aff.check_timestamp),
                "delta_minutes": round((app.submission_timestamp - aff.check_timestamp).total_seconds() / 60.0, 1),
                "details": f"Affordability check {aff.check_id} precedes application submission",
            })

    # 4: Decision vs Affordability check (detects DECISION_PRECEDES_CHECKS)
    for app_id, dec in dec_map.items():
        aff = aff_map.get(app_id)
        if not aff:
            continue
        if dec.decision_timestamp < aff.check_timestamp:
            temporal_inversions.append({
                "application_id": app_id,
                "rule": "DECISION_PRECEDES_AFFORDABILITY",
                "affordability_time": str(aff.check_timestamp),
                "decision_time": str(dec.decision_timestamp),
                "delta_minutes": round((aff.check_timestamp - dec.decision_timestamp).total_seconds() / 60.0, 1),
                "details": f"Decision {dec.decision_id} rendered before affordability check {aff.check_id}",
            })

    # 5: Disbursement vs Decision
    for evt in dataset.application_events:
        if evt.event_type == EventType.FUNDS_DISBURSED:
            dec = dec_map.get(evt.application_id)
            if dec and evt.timestamp < dec.decision_timestamp:
                temporal_inversions.append({
                    "application_id": evt.application_id,
                    "rule": "DISBURSEMENT_PRECEDES_DECISION",
                    "event_id": evt.event_id,
                    "decision_time": str(dec.decision_timestamp),
                    "disbursement_time": str(evt.timestamp),
                    "delta_minutes": round((dec.decision_timestamp - evt.timestamp).total_seconds() / 60.0, 1),
                    "details": f"Disbursement event {evt.event_id} precedes decision {dec.decision_id}",
                })

    return {
        "total_audited": total_audited,
        "temporal_inversions_count": len(temporal_inversions),
        "inversions": temporal_inversions,
        "passed": len(temporal_inversions) == 0,
    }


def check_schedule_arithmetic_reconciliation(dataset: GeneratedDataset) -> Dict[str, Any]:
    """
    Validates that the sum of principal components in repayment schedules
    reconciles to the approved principal within 1 cent.
    """
    dec_map = {d.application_id: d for d in dataset.decisions}
    schedule_by_app: Dict[str, List[float]] = defaultdict(list)
    for s in dataset.repayment_schedules:
        schedule_by_app[s.application_id].append(s.principal_component)

    discrepancies = []
    audited_count = len(schedule_by_app)

    for app_id, principals in schedule_by_app.items():
        dec = dec_map.get(app_id)
        if not dec or dec.outcome != DecisionOutcome.APPROVED:
            continue

        total_scheduled = round(sum(principals), 2)
        diff = round(abs(total_scheduled - dec.approved_principal), 2)
        if diff > 0.01:
            discrepancies.append({
                "application_id": app_id,
                "approved_principal": dec.approved_principal,
                "scheduled_total": total_scheduled,
                "discrepancy": diff,
            })

    return {
        "audited_schedules_count": audited_count,
        "discrepancies_count": len(discrepancies),
        "discrepancies": discrepancies,
        "passed": len(discrepancies) == 0,
    }


def check_disbursement_integrity(dataset: GeneratedDataset) -> Dict[str, Any]:
    """
    Validates disbursement prerequisites:
    1. Only approved loans can be disbursed.
    2. No application should have more than 1 disbursement event (duplicate disbursements).
    """
    dec_map = {d.application_id: d for d in dataset.decisions}
    disbursed_events = [
        e for e in dataset.application_events if e.event_type == EventType.FUNDS_DISBURSED
    ]

    event_counts = Counter(e.application_id for e in disbursed_events)
    duplicates = [app_id for app_id, count in event_counts.items() if count > 1]

    unapproved_disbursements = []
    for e in disbursed_events:
        dec = dec_map.get(e.application_id)
        if not dec or dec.outcome != DecisionOutcome.APPROVED:
            unapproved_disbursements.append(e.application_id)

    passed = (len(duplicates) == 0) and (len(unapproved_disbursements) == 0)

    return {
        "total_disbursement_events": len(disbursed_events),
        "duplicate_disbursements": duplicates,
        "duplicate_disbursements_count": len(duplicates),
        "unapproved_disbursements": unapproved_disbursements,
        "unapproved_disbursements_count": len(unapproved_disbursements),
        "passed": passed,
    }


def check_fair_lending_compliance(dataset: GeneratedDataset) -> Dict[str, Any]:
    """
    Verifies that no protected demographic attributes were utilized in decision reason codes.
    """
    violations = []
    for d in dataset.decisions:
        text = (d.decision_reason_codes + " " + d.decision_notes).lower()
        for attr in PROTECTED_ATTRIBUTES:
            if attr in text:
                violations.append({
                    "decision_id": d.decision_id,
                    "protected_attribute": attr,
                })

    return {
        "audited_decisions": len(dataset.decisions),
        "violations_found": len(violations),
        "violations": violations,
        "passed": len(violations) == 0,
    }


def check_term_bounds(dataset: GeneratedDataset) -> Dict[str, Any]:
    """
    Validates that requested_term_months for each loan application
    is within the associated loan product's min_term_months and max_term_months.
    Detects TERM_OUT_OF_BOUNDS edge cases.
    """
    product_map = {p.product_id: p for p in dataset.products}
    violations = []
    total_audited = len(dataset.applications)

    for app in dataset.applications:
        product = product_map.get(app.product_id)
        if not product:
            # Missing product references are handled separately by foreign-key integrity validation
            continue

        if (
            app.requested_term_months < product.min_term_months
            or app.requested_term_months > product.max_term_months
        ):
            violations.append({
                "application_id": app.application_id,
                "product_id": app.product_id,
                "requested_term_months": app.requested_term_months,
                "min_term_months": product.min_term_months,
                "max_term_months": product.max_term_months,
                "violation_type": (
                    "EXCEEDS_MAX_TERM"
                    if app.requested_term_months > product.max_term_months
                    else "BELOW_MIN_TERM"
                ),
            })

    return {
        "total_audited": total_audited,
        "violations_count": len(violations),
        "violations": violations,
        "passed": len(violations) == 0,
    }


def check_income_source_conflicts(
    dataset: GeneratedDataset,
    discrepancy_threshold: float = 0.40,
) -> Dict[str, Any]:
    """
    Validates that declared monthly income on each loan application
    does not conflict with the applicant's verified monthly income.
    
    Uses the exact verified-income definition from affordability calculation:
    sum of net_monthly_amount for records with verification_status == VERIFIED.
    Matches applications strictly to their own applicant's income records.
    Safely handles zero or missing verified income without division-by-zero.
    Detects INCOME_SOURCE_CONFLICT edge cases.
    """
    income_by_applicant: Dict[str, List[Any]] = defaultdict(list)
    for inc in dataset.income_records:
        income_by_applicant[inc.applicant_id].append(inc)

    violations = []
    total_audited = len(dataset.applications)

    for app in dataset.applications:
        applicant_incs = income_by_applicant.get(app.applicant_id, [])
        verified_monthly_income = sum(
            inc.net_monthly_amount
            for inc in applicant_incs
            if inc.verification_status == VerificationStatus.VERIFIED
        )

        # Safe handling for zero or unverified income
        if verified_monthly_income <= 0:
            continue

        discrepancy_ratio = round(
            abs(app.declared_monthly_income - verified_monthly_income) / verified_monthly_income,
            4,
        )

        if discrepancy_ratio > discrepancy_threshold:
            violations.append({
                "application_id": app.application_id,
                "applicant_id": app.applicant_id,
                "declared_monthly_income": app.declared_monthly_income,
                "verified_monthly_income": round(verified_monthly_income, 2),
                "discrepancy_ratio": discrepancy_ratio,
            })

    return {
        "total_audited": total_audited,
        "discrepancy_threshold": discrepancy_threshold,
        "violations_count": len(violations),
        "violations": violations,
        "passed": len(violations) == 0,
    }


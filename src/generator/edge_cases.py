"""Edge case injector and ground truth record keeper."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from src.domain.enums import (
    ApplicationStatus,
    DecisionOutcome,
    EventType,
    IssueType,
    ReviewerRole,
)
from src.domain.models import (
    AffordabilityCheck,
    ApplicationEvent,
    Decision,
    Document,
    GroundTruthEntry,
    LoanApplication,
    LoanProduct,
    RepaymentSchedule,
)


class EdgeCaseRegistry:
    """Manages injection of deliberate anomalies with strict ground-truth isolation."""

    def __init__(self):
        self.ground_truth_entries: List[GroundTruthEntry] = []

    def log_ground_truth(
        self,
        application_id: str,
        entity_type: str,
        record_id: str,
        issue_type: IssueType,
        is_anomaly: bool,
        expected_decision: DecisionOutcome,
        rule_triggered: str,
        description: str,
    ) -> GroundTruthEntry:
        entry = GroundTruthEntry(
            application_id=application_id,
            entity_type=entity_type,
            record_id=record_id,
            issue_type=issue_type,
            is_anomaly=is_anomaly,
            expected_decision=expected_decision,
            rule_triggered=rule_triggered,
            description=description,
        )
        self.ground_truth_entries.append(entry)
        return entry

    def inject_term_out_of_bounds(
        self,
        application: LoanApplication,
        product: LoanProduct,
    ) -> LoanApplication:
        """Injects a term strictly exceeding the product maximum or sub-minimum."""
        corrupt_term = product.max_term_months + 24  # e.g., 84 or 96 months
        application.requested_term_months = corrupt_term
        self.log_ground_truth(
            application_id=application.application_id,
            entity_type="LoanApplication",
            record_id=application.application_id,
            issue_type=IssueType.TERM_OUT_OF_BOUNDS,
            is_anomaly=True,
            expected_decision=DecisionOutcome.REJECTED,
            rule_triggered="ERR_TERM_OUT_OF_BOUNDS",
            description=f"Requested term {corrupt_term}m exceeds product maximum {product.max_term_months}m.",
        )
        return application

    def inject_income_source_conflict(
        self,
        application: LoanApplication,
        verified_income: float,
    ) -> LoanApplication:
        """Injects extreme divergence between declared income and verified records."""
        # Intentionally inflate declared income 3x
        inflated = round((verified_income if verified_income > 0 else 3000.0) * 3.2, 2)
        application.declared_monthly_income = inflated
        self.log_ground_truth(
            application_id=application.application_id,
            entity_type="LoanApplication",
            record_id=application.application_id,
            issue_type=IssueType.INCOME_SOURCE_CONFLICT,
            is_anomaly=True,
            expected_decision=DecisionOutcome.MANUAL_REVIEW,
            rule_triggered="INCOME_DECLARED_VERIFIED_DISCREPANCY",
            description=f"Declared income ${inflated} diverges > 200% from verified income ${verified_income}.",
        )
        return application

    def inject_decision_precedes_checks(
        self,
        decision: Decision,
        affordability: AffordabilityCheck,
    ) -> Decision:
        """Backdates the decision timestamp to precede the affordability check timestamp."""
        corrupt_timestamp = affordability.check_timestamp - timedelta(hours=3, minutes=15)
        decision.decision_timestamp = corrupt_timestamp
        self.log_ground_truth(
            application_id=decision.application_id,
            entity_type="Decision",
            record_id=decision.decision_id,
            issue_type=IssueType.DECISION_PRECEDES_CHECKS,
            is_anomaly=True,
            expected_decision=decision.outcome,
            rule_triggered="TEMPORAL_SEQUENCE_VIOLATION",
            description=f"Decision timestamp {corrupt_timestamp} occurred before affordability check {affordability.check_timestamp}.",
        )
        return decision

    def inject_duplicate_disbursement(
        self,
        application_id: str,
        events: List[ApplicationEvent],
        base_timestamp: datetime,
    ) -> List[ApplicationEvent]:
        """Injects a second unauthorized disbursement event for the same application."""
        evt_id = f"EVT-{application_id}-{len(events) + 1:02d}"
        duplicate_event = ApplicationEvent(
            event_id=evt_id,
            application_id=application_id,
            from_status=ApplicationStatus.DISBURSED.value,
            to_status=ApplicationStatus.DISBURSED.value,
            event_type=EventType.FUNDS_DISBURSED,
            actor=ReviewerRole.SYSTEM_ADMIN,
            timestamp=base_timestamp + timedelta(hours=12),
            details="DUPLICATE DISBURSEMENT DETECTED: Secondary funds payout triggered in error.",
        )
        events.append(duplicate_event)
        self.log_ground_truth(
            application_id=application_id,
            entity_type="ApplicationEvent",
            record_id=evt_id,
            issue_type=IssueType.DUPLICATE_DISBURSEMENT,
            is_anomaly=True,
            expected_decision=DecisionOutcome.APPROVED,
            rule_triggered="DUPLICATE_DISBURSEMENT_VIOLATION",
            description=f"Application {application_id} received duplicate disbursement event {evt_id}.",
        )
        return events

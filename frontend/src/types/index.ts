/**
 * Type definitions matching Python models in src/domain/models.py and src/domain/enums.py
 */

export type HousingStatus = 'OWN' | 'RENT' | 'MORTGAGE' | 'OTHER';

export type EmploymentType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'SELF_EMPLOYED'
  | 'CONTRACT'
  | 'UNEMPLOYED';

export type IncomeSource =
  | 'PRIMARY_SALARY'
  | 'SECONDARY_SALARY'
  | 'BUSINESS_REVENUE'
  | 'INVESTMENT'
  | 'GOVERNMENT_BENEFIT'
  | 'PENSION';

export type VerificationStatus =
  | 'VERIFIED'
  | 'UNVERIFIED'
  | 'PENDING_DOCUMENTS'
  | 'DISCREPANCY';

export type VerificationMethod =
  | 'PAYSLIP'
  | 'BANK_STATEMENT'
  | 'TAX_RETURN'
  | 'EMPLOYER_CONFIRMATION';

export type FacilityType =
  | 'MORTGAGE'
  | 'AUTO_LOAN'
  | 'STUDENT_LOAN'
  | 'CREDIT_CARD'
  | 'PERSONAL_LOAN';

export type FacilityStatus =
  | 'ACTIVE'
  | 'CLOSED'
  | 'DEFAULT'
  | 'DELINQUENT_30'
  | 'DELINQUENT_60_PLUS';

export type LoanPurpose =
  | 'DEBT_CONSOLIDATION'
  | 'HOME_IMPROVEMENT'
  | 'BUSINESS_EXPANSION'
  | 'VEHICLE_PURCHASE'
  | 'EMERGENCY_EXPENSE';

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'MANUAL_REVIEW'
  | 'DISBURSED'
  | 'CANCELLED';

export type DocumentType =
  | 'PROOF_OF_IDENTITY'
  | 'PROOF_OF_INCOME'
  | 'PROOF_OF_ADDRESS'
  | 'BANK_STATEMENTS';

export type DocumentStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'MISSING';

export type AffordabilityResult = 'PASS' | 'FAIL' | 'MARGINAL';

export type DecisionOutcome = 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';

export type ReviewerRole =
  | 'AUTOMATED_RULES_ENGINE'
  | 'OPERATIONS_ANALYST'
  | 'RISK_COMPLIANCE_REVIEWER'
  | 'SYSTEM_ADMIN';

export type ScheduleStatus = 'SCHEDULED' | 'PAID' | 'LATE' | 'DEFAULTED';

export type EventType =
  | 'APPLICATION_SUBMITTED'
  | 'DOCUMENTS_UPLOADED'
  | 'DOCUMENTS_VERIFIED'
  | 'AFFORDABILITY_EVALUATED'
  | 'DECISION_RENDERED'
  | 'FUNDS_DISBURSED'
  | 'STATUS_CHANGED';

export type IssueType =
  | 'NONE'
  | 'TERM_OUT_OF_BOUNDS'
  | 'SCHEDULE_RECONCILIATION_MISMATCH'
  | 'DECISION_PRECEDES_CHECKS'
  | 'INCOME_SOURCE_CONFLICT'
  | 'DUPLICATE_DISBURSEMENT';

// Domain Entities
export interface Applicant {
  applicant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  housing_status: HousingStatus;
  national_id_hash: string;
  created_at: string;
  gender?: string | null;
  ethnicity?: string | null;
}

export interface Employment {
  employment_id: string;
  applicant_id: string;
  employer_name: string;
  employment_type: EmploymentType;
  job_title: string;
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
  tenure_months: number;
  created_at: string;
}

export interface IncomeRecord {
  income_id: string;
  applicant_id: string;
  income_source: IncomeSource;
  gross_monthly_amount: number;
  net_monthly_amount: number;
  verification_status: VerificationStatus;
  verification_method: VerificationMethod;
  effective_date: string;
  created_at: string;
}

export interface CreditFacility {
  facility_id: string;
  applicant_id: string;
  facility_type: FacilityType;
  lender_name: string;
  credit_limit: number;
  outstanding_balance: number;
  monthly_payment: number;
  facility_status: FacilityStatus;
  opened_date: string;
  reported_date: string;
  created_at: string;
}

export interface LoanProduct {
  product_id: string;
  product_name: string;
  min_principal: number;
  max_principal: number;
  min_term_months: number;
  max_term_months: number;
  base_interest_rate: number;
  max_dti_threshold: number;
  min_credit_score: number;
  is_active: boolean;
}

export interface LoanApplication {
  application_id: string;
  applicant_id: string;
  product_id: string;
  requested_principal: number;
  requested_term_months: number;
  purpose: LoanPurpose;
  application_status: ApplicationStatus;
  credit_score: number;
  declared_monthly_income: number;
  submission_timestamp: string;
  updated_at: string;
}

export interface DocumentRecord {
  document_id: string;
  application_id: string;
  applicant_id: string;
  document_type: DocumentType;
  document_status: DocumentStatus;
  file_hash: string;
  uploaded_at: string;
  verified_at?: string | null;
}

export interface AffordabilityCheck {
  check_id: string;
  application_id: string;
  total_verified_monthly_income: number;
  existing_monthly_debt_obligations: number;
  estimated_living_expenses: number;
  proposed_loan_monthly_payment: number;
  calculated_dti: number;
  calculated_total_dti: number;
  net_disposable_income: number;
  affordability_result: AffordabilityResult;
  check_timestamp: string;
}

export interface DecisionRecord {
  decision_id: string;
  application_id: string;
  outcome: DecisionOutcome;
  approved_principal: number;
  approved_term_months: number;
  approved_interest_rate: number;
  decision_reason_codes: string;
  decision_notes: string;
  reviewer_role: ReviewerRole;
  decision_timestamp: string;
}

export interface RepaymentSchedule {
  schedule_id: string;
  application_id: string;
  installment_number: number;
  due_date: string;
  payment_amount: number;
  principal_component: number;
  interest_component: number;
  remaining_balance: number;
  status: ScheduleStatus;
}

export interface ApplicationEvent {
  event_id: string;
  application_id: string;
  from_status: string;
  to_status: string;
  event_type: EventType;
  actor: ReviewerRole;
  timestamp: string;
  details: string;
}

export interface GroundTruthEntry {
  application_id: string;
  entity_type: string;
  record_id: string;
  issue_type: IssueType;
  is_anomaly: boolean;
  expected_decision: DecisionOutcome;
  rule_triggered: string;
  description: string;
}

// Complete In-Memory Database Bundle
export interface LoanDataset {
  applicants: Applicant[];
  employments: Employment[];
  income_records: IncomeRecord[];
  credit_facilities: CreditFacility[];
  loan_products: LoanProduct[];
  loan_applications: LoanApplication[];
  documents: DocumentRecord[];
  affordability_checks: AffordabilityCheck[];
  decisions: DecisionRecord[];
  repayment_schedules: RepaymentSchedule[];
  application_events: ApplicationEvent[];
  ground_truth: GroundTruthEntry[];
  validation_report?: ValidationReport;
}

// Validation Report Structures
export interface ValidationReport {
  generated_at: string;
  dataset_summary: Record<string, number>;
  primary_key_uniqueness: {
    overall_passed: boolean;
    details: Record<string, { total_records: number; unique_keys: number; duplicates: number; passed: boolean }>;
  };
  foreign_key_integrity: {
    overall_passed: boolean;
    details: Record<string, { total_fk_refs: number; missing_parent_refs: number; passed: boolean }>;
  };
  date_ordering: {
    total_audited: number;
    temporal_inversions_count: number;
    inversions: Array<{
      application_id: string;
      rule: string;
      affordability_time?: string;
      decision_time?: string;
      delta_minutes?: number;
      details: string;
    }>;
    passed: boolean;
  };
  schedule_reconciliation: {
    audited_schedules_count: number;
    discrepancies_count: number;
    discrepancies: Array<{
      application_id: string;
      approved_principal: number;
      scheduled_total: number;
      discrepancy: number;
    }>;
    passed: boolean;
  };
  disbursement_integrity: {
    total_disbursement_events: number;
    duplicate_disbursements: string[];
    duplicate_disbursements_count: number;
    unapproved_disbursements: string[];
    unapproved_disbursements_count: number;
    passed: boolean;
  };
  fair_lending_compliance: {
    audited_decisions: number;
    violations_found: number;
    violations: any[];
    passed: boolean;
  };
  term_bounds: {
    total_audited: number;
    violations_count: number;
    violations: Array<{
      application_id: string;
      product_id: string;
      requested_term_months: number;
      min_term_months: number;
      max_term_months: number;
      violation_type: string;
    }>;
    passed: boolean;
  };
  income_source_conflicts: {
    total_audited: number;
    discrepancy_threshold: number;
    violations_count: number;
    violations: Array<{
      application_id: string;
      applicant_id: string;
      declared_monthly_income: number;
      verified_monthly_income: number;
      discrepancy_ratio: number;
    }>;
    passed: boolean;
  };
  ground_truth_reconciliation: {
    expected_temporal_inversions: number;
    detected_temporal_inversions: number;
    expected_schedule_discrepancies: number;
    detected_schedule_discrepancies: number;
    expected_duplicate_disbursements: number;
    detected_duplicate_disbursements: number;
    expected_term_out_of_bounds: number;
    detected_term_out_of_bounds: number;
    expected_income_source_conflicts: number;
    detected_income_source_conflicts: number;
    match: boolean;
  };
}

// Aggregated Application Detail View
export interface EnrichedApplication {
  application: LoanApplication;
  applicant: Applicant | null;
  product: LoanProduct | null;
  employment: Employment | null;
  incomeRecords: IncomeRecord[];
  creditFacilities: CreditFacility[];
  documents: DocumentRecord[];
  affordabilityCheck: AffordabilityCheck | null;
  decision: DecisionRecord | null;
  repaymentSchedules: RepaymentSchedule[];
  events: ApplicationEvent[];
  // Ground truth evaluation strictly in validation context
  groundTruth?: GroundTruthEntry | null;
}

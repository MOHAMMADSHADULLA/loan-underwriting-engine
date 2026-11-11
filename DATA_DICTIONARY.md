# Data Dictionary: Loan Underwriting & Decisioning Engine

This document provides the authoritative data dictionary for all core relational entities, event logs, and ground truth tracking tables in the system.

---

## 1. LoanProduct (`loan_products`)
Defines the credit products offered, including minimum and maximum borrowing limits, terms, risk thresholds, and interest rates.

| Field Name | Type | Req/Opt | Allowed Values / Format | Units | Uniqueness | Foreign Key | Validation Rule / Business Constraints |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| `product_id` | `VARCHAR(32)` | Req | `PROD-001` .. `PROD-999` | N/A | **Primary Key** | None | Must follow `PROD-NNN` pattern. |
| `product_name` | `VARCHAR(128)` | Req | Non-empty string | N/A | Unique | None | Name describing loan category (e.g., Personal, Auto). |
| `min_principal` | `DECIMAL(12, 2)`| Req | Floating-point > 0 | USD ($) | Non-unique | None | `min_principal > 0` and `<= max_principal`. |
| `max_principal` | `DECIMAL(12, 2)`| Req | Floating-point >= min | USD ($) | Non-unique | None | Must be >= `min_principal`. |
| `min_term_months` | `INTEGER` | Req | Integer >= 6 | Months | Non-unique | None | Minimum repayment horizon. |
| `max_term_months` | `INTEGER` | Req | Integer >= min_term | Months | Non-unique | None | Must be >= `min_term_months`. |
| `base_interest_rate`| `DECIMAL(5, 2)` | Req | 0.00 to 45.00 | % Annual | Non-unique | None | Baseline annual APR. |
| `max_dti_threshold` | `DECIMAL(4, 3)` | Req | 0.100 to 0.700 | Ratio | Non-unique | None | Maximum allowable Total DTI ratio. |
| `min_credit_score` | `INTEGER` | Req | 300 to 850 | FICO | Non-unique | None | Minimum qualifying credit score. |
| `is_active` | `BOOLEAN` | Req | `0`, `1` | Flag | Non-unique | None | Product availability flag. |

---

## 2. Applicant (`applicants`)
Master entity for prospective and existing borrowers.

| Field Name | Type | Req/Opt | Allowed Values / Format | Units | Uniqueness | Foreign Key | Validation Rule / Business Constraints |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| `applicant_id` | `VARCHAR(32)` | Req | `APP-YYYY-NNNNNN` | N/A | **Primary Key** | None | Immutable identifier zero-padded to 6 digits. |
| `first_name` | `VARCHAR(64)` | Req | Alphabetic string | N/A | Non-unique | None | Length >= 2 chars. |
| `last_name` | `VARCHAR(64)` | Req | Alphabetic string | N/A | Non-unique | None | Length >= 2 chars. |
| `email` | `VARCHAR(128)` | Req | RFC 5322 Email Format | N/A | Unique | None | Valid email format. |
| `phone` | `VARCHAR(32)` | Req | `+1-555-NNN-NNNN` | N/A | Non-unique | None | E.164 compliant phone string. |
| `date_of_birth` | `DATE` | Req | `YYYY-MM-DD` | Date | Non-unique | None | Age must be between 18 and 100 years. |
| `housing_status` | `VARCHAR(32)` | Req | `OWN`, `RENT`, `MORTGAGE`, `OTHER` | Enum | Non-unique | None | Must match `HousingStatus` enum. |
| `national_id_hash`| `VARCHAR(64)` | Req | 16-hex alphanumeric | Hash | Unique | None | SHA-256 pseudonymized national ID. |
| `created_at` | `TIMESTAMP` | Req | ISO 8601 UTC | DateTime | Non-unique | None | Master registration timestamp. |
| `gender` | `VARCHAR(32)` | Opt | `MALE`, `FEMALE`, `OTHER`, `NULL` | Enum | Non-unique | None | **Fair Lending Protected**: Stripped from Underwriting Engine. |
| `ethnicity` | `VARCHAR(32)` | Opt | Standard demographic strings | Enum | Non-unique | None | **Fair Lending Protected**: Stripped from Underwriting Engine. |

---

## 3. Employment (`employments`)
Tracks employment history, tenure, and current occupation.

| Field Name | Type | Req/Opt | Allowed Values / Format | Units | Uniqueness | Foreign Key | Validation Rule / Business Constraints |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| `employment_id` | `VARCHAR(32)` | Req | `EMP-YYYY-NNNNNN` | N/A | **Primary Key** | None | Unique sequential employment ID. |
| `applicant_id` | `VARCHAR(32)` | Req | `APP-YYYY-NNNNNN` | N/A | Non-unique | `applicants.applicant_id` | Must resolve to existing applicant (1:N). |
| `employer_name` | `VARCHAR(128)` | Req | Non-empty string | N/A | Non-unique | None | Registered company or employer. |
| `employment_type`| `VARCHAR(32)` | Req | `FULL_TIME`, `PART_TIME`, `SELF_EMPLOYED`, `CONTRACT`, `UNEMPLOYED` | Enum | Non-unique | None | Must match `EmploymentType` enum. |
| `job_title` | `VARCHAR(128)` | Req | Non-empty string | N/A | Non-unique | None | Role title. |
| `start_date` | `DATE` | Req | `YYYY-MM-DD` | Date | Non-unique | None | Must be <= `end_date` (if ended) and <= today. |
| `end_date` | `DATE` | Opt | `YYYY-MM-DD` or `NULL` | Date | Non-unique | None | Nullable if `is_current` is true. |
| `is_current` | `BOOLEAN` | Req | `0`, `1` | Flag | Non-unique | None | Indicates active employment. |
| `tenure_months` | `INTEGER` | Req | Integer >= 0 | Months | Non-unique | None | Derived from start_date and effective date. |
| `created_at` | `TIMESTAMP` | Req | ISO 8601 UTC | DateTime | Non-unique | None | Record creation audit timestamp. |

---

## 4. IncomeRecord (`income_records`)
Granular income records documenting sources, gross/net amounts, and document verification states.

| Field Name | Type | Req/Opt | Allowed Values / Format | Units | Uniqueness | Foreign Key | Validation Rule / Business Constraints |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| `income_id` | `VARCHAR(32)` | Req | `INC-YYYY-NNNNNN` | N/A | **Primary Key** | None | Unique income record ID. |
| `applicant_id` | `VARCHAR(32)` | Req | `APP-YYYY-NNNNNN` | N/A | Non-unique | `applicants.applicant_id` | Must resolve to existing applicant (1:N). |
| `income_source` | `VARCHAR(32)` | Req | `PRIMARY_SALARY`, `SECONDARY_SALARY`, `BUSINESS_REVENUE`, `INVESTMENT`, `GOVERNMENT_BENEFIT`, `PENSION` | Enum | Non-unique | None | Must match `IncomeSource` enum. |
| `gross_monthly_amount` | `DECIMAL(12, 2)` | Req | Float >= 0 | USD ($) | Non-unique | None | Pre-tax monthly earnings. |
| `net_monthly_amount` | `DECIMAL(12, 2)` | Req | Float >= 0 | USD ($) | Non-unique | None | `net_monthly_amount <= gross_monthly_amount`. |
| `verification_status` | `VARCHAR(32)` | Req | `VERIFIED`, `UNVERIFIED`, `PENDING_DOCUMENTS`, `DISCREPANCY` | Enum | Non-unique | None | Must match `VerificationStatus` enum. |
| `verification_method` | `VARCHAR(32)` | Req | `PAYSLIP`, `BANK_STATEMENT`, `TAX_RETURN`, `EMPLOYER_CONFIRMATION` | Enum | Non-unique | None | Evidentiary source mechanism. |
| `effective_date` | `DATE` | Req | `YYYY-MM-DD` | Date | Non-unique | None | Date of statement / tax period. |
| `created_at` | `TIMESTAMP` | Req | ISO 8601 UTC | DateTime | Non-unique | None | System insertion timestamp. |

---

## 5. CreditFacility (`credit_facilities`)
Existing credit obligations, limits, outstanding balances, and payment history reported by bureaus.

| Field Name | Type | Req/Opt | Allowed Values / Format | Units | Uniqueness | Foreign Key | Validation Rule / Business Constraints |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| `facility_id` | `VARCHAR(32)` | Req | `FAC-YYYY-NNNNNN` | N/A | **Primary Key** | None | Unique trade-line facility ID. |
| `applicant_id` | `VARCHAR(32)` | Req | `APP-YYYY-NNNNNN` | N/A | Non-unique | `applicants.applicant_id` | Must resolve to existing applicant (1:N). |
| `facility_type` | `VARCHAR(32)` | Req | `MORTGAGE`, `AUTO_LOAN`, `STUDENT_LOAN`, `CREDIT_CARD`, `PERSONAL_LOAN` | Enum | Non-unique | None | Must match `FacilityType` enum. |
| `lender_name` | `VARCHAR(128)` | Req | Non-empty string | N/A | Non-unique | None | Name of creditor institution. |
| `credit_limit` | `DECIMAL(12, 2)` | Req | Float >= 0 | USD ($) | Non-unique | None | Total sanctioned line. |
| `outstanding_balance` | `DECIMAL(12, 2)` | Req | Float >= 0 | USD ($) | Non-unique | None | Current unpaid balance. |
| `monthly_payment`| `DECIMAL(12, 2)` | Req | Float >= 0 | USD ($) | Non-unique | None | Required monthly amortization/minimum payment. |
| `facility_status`| `VARCHAR(32)` | Req | `ACTIVE`, `CLOSED`, `DEFAULT`, `DELINQUENT_30`, `DELINQUENT_60_PLUS` | Enum | Non-unique | None | Must match `FacilityStatus` enum. |
| `opened_date` | `DATE` | Req | `YYYY-MM-DD` | Date | Non-unique | None | Date credit opened. |
| `reported_date` | `DATE` | Req | `YYYY-MM-DD` | Date | Non-unique | None | Bureau update timestamp. |
| `created_at` | `TIMESTAMP` | Req | ISO 8601 UTC | DateTime | Non-unique | None | Record audit timestamp. |

---

## 6. LoanApplication (`loan_applications`)
Core transactional entity representing a request for financing.

| Field Name | Type | Req/Opt | Allowed Values / Format | Units | Uniqueness | Foreign Key | Validation Rule / Business Constraints |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| `application_id` | `VARCHAR(32)` | Req | `LOAN-YYYY-NNNNNN` | N/A | **Primary Key** | None | Immutable application identifier. |
| `applicant_id` | `VARCHAR(32)` | Req | `APP-YYYY-NNNNNN` | N/A | Non-unique | `applicants.applicant_id` | Must resolve to existing applicant. |
| `product_id` | `VARCHAR(32)` | Req | `PROD-NNN` | N/A | Non-unique | `loan_products.product_id` | Must resolve to existing loan product. |
| `requested_principal` | `DECIMAL(12, 2)` | Req | Float > 0 | USD ($) | Non-unique | None | Must normally be between product min/max principal. |
| `requested_term_months` | `INTEGER` | Req | Integer > 0 | Months | Non-unique | None | Must normally be between product min/max term. |
| `purpose` | `VARCHAR(64)` | Req | `DEBT_CONSOLIDATION`, `HOME_IMPROVEMENT`, `BUSINESS_EXPANSION`, `VEHICLE_PURCHASE`, `EMERGENCY_EXPENSE` | Enum | Non-unique | None | Must match `LoanPurpose` enum. |
| `application_status` | `VARCHAR(32)` | Req | `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `MANUAL_REVIEW`, `DISBURSED`, `CANCELLED` | Enum | Non-unique | None | Obey lifecycle state machine transitions. |
| `credit_score` | `INTEGER` | Req | 300 to 850 | FICO | Non-unique | None | Bureau credit score at origination pull. |
| `declared_monthly_income` | `DECIMAL(12, 2)` | Req | Float >= 0 | USD ($) | Non-unique | None | Self-reported monthly gross/net income. |
| `submission_timestamp` | `TIMESTAMP` | Req | ISO 8601 UTC | DateTime | Non-unique | None | Timestamp application received. |
| `updated_at` | `TIMESTAMP` | Req | ISO 8601 UTC | DateTime | Non-unique | None | Must be >= `submission_timestamp`. |

---

## 7. Document (`documents`)
Evidentiary files and verification statuses attached to loan applications.

| Field Name | Type | Req/Opt | Allowed Values / Format | Units | Uniqueness | Foreign Key | Validation Rule / Business Constraints |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| `document_id` | `VARCHAR(64)` | Req | `DOC-<application_id>-NNN` | N/A | **Primary Key** | None | Structured ID with application prefix. |
| `application_id` | `VARCHAR(32)` | Req | `LOAN-YYYY-NNNNNN` | N/A | Non-unique | `loan_applications.application_id` | Must resolve to existing loan application. |
| `applicant_id` | `VARCHAR(32)` | Req | `APP-YYYY-NNNNNN` | N/A | Non-unique | `applicants.applicant_id` | Must match application's applicant ID. |
| `document_type` | `VARCHAR(32)` | Req | `PROOF_OF_IDENTITY`, `PROOF_OF_INCOME`, `PROOF_OF_ADDRESS`, `BANK_STATEMENTS` | Enum | Non-unique | None | Must match `DocumentType` enum. |
| `document_status`| `VARCHAR(32)` | Req | `PENDING`, `VERIFIED`, `REJECTED`, `EXPIRED`, `MISSING` | Enum | Non-unique | None | Current document review state. |
| `file_hash` | `VARCHAR(128)` | Req | 64-char Hex SHA-256 | Hash | Non-unique | None | Content checksum for file integrity. |
| `uploaded_at` | `TIMESTAMP` | Req | ISO 8601 UTC | DateTime | Non-unique | None | Must be >= application submission time. |
| `verified_at` | `TIMESTAMP` | Opt | ISO 8601 UTC or `NULL` | DateTime | Non-unique | None | Must be >= `uploaded_at`. |

---

## 8. AffordabilityCheck (`affordability_checks`)
Derived financial metrics, DTI calculations, living expense allowances, and disposable income checks.

| Field Name | Type | Req/Opt | Allowed Values / Format | Units | Uniqueness | Foreign Key | Validation Rule / Business Constraints |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| `check_id` | `VARCHAR(64)` | Req | `AFF-<application_id>-01` | N/A | **Primary Key** | None | Unique assessment ID per application. |
| `application_id` | `VARCHAR(32)` | Req | `LOAN-YYYY-NNNNNN` | N/A | Unique (1:1) | `loan_applications.application_id` | Must resolve to existing application. |
| `total_verified_monthly_income` | `DECIMAL(12, 2)` | Req | Float >= 0 | USD ($) | Non-unique | None | Sum of verified net income records. |
| `existing_monthly_debt_obligations` | `DECIMAL(12, 2)` | Req | Float >= 0 | USD ($) | Non-unique | None | Sum of active trade-line monthly payments. |
| `estimated_living_expenses` | `DECIMAL(12, 2)` | Req | Float >= 0 | USD ($) | Non-unique | None | Base living cost + proportional buffer. |
| `proposed_loan_monthly_payment` | `DECIMAL(12, 2)` | Req | Float >= 0 | USD ($) | Non-unique | None | Estimated EMI based on requested loan terms. |
| `calculated_dti` | `DECIMAL(6, 4)` | Req | 0.0000 to 1.0000 | Ratio | Non-unique | None | `existing_debt / verified_income`. |
| `calculated_total_dti` | `DECIMAL(6, 4)` | Req | 0.0000 to 1.0000 | Ratio | Non-unique | None | `(existing_debt + proposed_payment) / verified_income`. |
| `net_disposable_income` | `DECIMAL(12, 2)` | Req | Float (can be negative) | USD ($) | Non-unique | None | `income - debt - expenses - proposed_payment`. |
| `affordability_result` | `VARCHAR(32)` | Req | `PASS`, `FAIL`, `MARGINAL` | Enum | Non-unique | None | Evaluated against product DTI policy. |
| `check_timestamp` | `TIMESTAMP` | Req | ISO 8601 UTC | DateTime | Non-unique | None | Timestamp calculation was performed. |

---

## 9. Decision (`decisions`)
Official underwriting determination with policy rule citations and risk pricing.

| Field Name | Type | Req/Opt | Allowed Values / Format | Units | Uniqueness | Foreign Key | Validation Rule / Business Constraints |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| `decision_id` | `VARCHAR(64)` | Req | `DEC-<application_id>-01` | N/A | **Primary Key** | None | Structured decision ID. |
| `application_id` | `VARCHAR(32)` | Req | `LOAN-YYYY-NNNNNN` | N/A | Unique (1:1) | `loan_applications.application_id` | Must resolve to existing application. |
| `outcome` | `VARCHAR(32)` | Req | `APPROVED`, `REJECTED`, `MANUAL_REVIEW` | Enum | Non-unique | None | Must match `DecisionOutcome` enum. |
| `approved_principal` | `DECIMAL(12, 2)` | Req | Float >= 0 | USD ($) | Non-unique | None | `> 0` only if approved, else `0.00`. |
| `approved_term_months` | `INTEGER` | Req | Integer >= 0 | Months | Non-unique | None | `> 0` only if approved, else `0`. |
| `approved_interest_rate` | `DECIMAL(5, 2)` | Req | Float >= 0 | % Annual | Non-unique | None | Risk-adjusted APR if approved, else `0.00`. |
| `decision_reason_codes` | `TEXT` | Req | Pipe-separated rule strings | Codes | Non-unique | None | Explicit rule codes (e.g. `PASS_ALL_CRITERIA`). |
| `decision_notes` | `TEXT` | Req | Descriptive prose | N/A | Non-unique | None | Human/automated explanation. |
| `reviewer_role` | `VARCHAR(64)` | Req | `AUTOMATED_RULES_ENGINE`, `OPERATIONS_ANALYST`, `RISK_COMPLIANCE_REVIEWER` | Enum | Non-unique | None | Actor executing determination. |
| `decision_timestamp` | `TIMESTAMP` | Req | ISO 8601 UTC | DateTime | Non-unique | None | Must be >= affordability check timestamp. |

---

## 10. RepaymentSchedule (`repayment_schedules`)
Monthly installment schedule for approved credit facilities, detailing principal and interest components.

| Field Name | Type | Req/Opt | Allowed Values / Format | Units | Uniqueness | Foreign Key | Validation Rule / Business Constraints |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| `schedule_id` | `VARCHAR(64)` | Req | `SCH-<application_id>-NN` | N/A | **Primary Key** | None | Sequential installment ID. |
| `application_id` | `VARCHAR(32)` | Req | `LOAN-YYYY-NNNNNN` | N/A | Non-unique | `loan_applications.application_id` | Must resolve to an `APPROVED` application. |
| `installment_number` | `INTEGER` | Req | 1 to `approved_term_months` | Month # | Non-unique | None | Sequential integer incrementing by 1. |
| `due_date` | `DATE` | Req | `YYYY-MM-DD` | Date | Non-unique | None | Monthly installment maturity date. |
| `payment_amount` | `DECIMAL(12, 2)` | Req | Float > 0 | USD ($) | Non-unique | None | Total monthly payment = `principal + interest`. |
| `principal_component` | `DECIMAL(12, 2)` | Req | Float >= 0 | USD ($) | Non-unique | None | Sum over all installments must equal `approved_principal`. |
| `interest_component` | `DECIMAL(12, 2)` | Req | Float >= 0 | USD ($) | Non-unique | None | Interest component of payment. |
| `remaining_balance` | `DECIMAL(12, 2)` | Req | Float >= 0 | USD ($) | Non-unique | None | Amortized unpaid principal (0.00 at terminal). |
| `status` | `VARCHAR(32)` | Req | `SCHEDULED`, `PAID`, `LATE`, `DEFAULTED` | Enum | Non-unique | None | Repayment status. |

---

## 11. ApplicationEvent (`application_events`)
Immutable audit log tracking every state change, document upload, check, decision, and disbursement event.

| Field Name | Type | Req/Opt | Allowed Values / Format | Units | Uniqueness | Foreign Key | Validation Rule / Business Constraints |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| `event_id` | `VARCHAR(64)` | Req | `EVT-<application_id>-NN` | N/A | **Primary Key** | None | Sequential event ID per application. |
| `application_id` | `VARCHAR(32)` | Req | `LOAN-YYYY-NNNNNN` | N/A | Non-unique | `loan_applications.application_id` | Associated loan application. |
| `from_status` | `VARCHAR(32)` | Req | `NONE`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, etc. | Enum | Non-unique | None | Pre-transition state. |
| `to_status` | `VARCHAR(32)` | Req | `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, etc. | Enum | Non-unique | None | Post-transition state. |
| `event_type` | `VARCHAR(64)` | Req | `APPLICATION_SUBMITTED`, `DOCUMENTS_VERIFIED`, `DECISION_RENDERED`, `FUNDS_DISBURSED`, etc. | Enum | Non-unique | None | Lifecycle event category. |
| `actor` | `VARCHAR(64)` | Req | System or User role | Enum | Non-unique | None | Initiator of event. |
| `timestamp` | `TIMESTAMP` | Req | ISO 8601 UTC | DateTime | Non-unique | None | Immutable audit event timestamp. |
| `details` | `TEXT` | Req | Free-form event narrative | N/A | Non-unique | None | Contextual audit notes. |

---

## 12. GroundTruthEntry (`ground_truth`)
Isolated manifest documenting all deliberate edge cases, expected outcomes, and labels. **Strictly excluded from model input features.**

| Field Name | Type | Req/Opt | Allowed Values / Format | Units | Uniqueness | Foreign Key | Validation Rule / Business Constraints |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| `application_id` | `VARCHAR(32)` | Req | `LOAN-YYYY-NNNNNN` | N/A | Non-unique | None | Associated loan application. |
| `entity_type` | `VARCHAR(64)` | Req | Entity model name | String | Non-unique | None | Target entity (e.g. `LoanApplication`, `Decision`). |
| `record_id` | `VARCHAR(64)` | Req | Entity primary key | String | Non-unique | None | Exact PK of affected row. |
| `issue_type` | `VARCHAR(64)` | Req | `NONE`, `TERM_OUT_OF_BOUNDS`, `SCHEDULE_RECONCILIATION_MISMATCH`, `DECISION_PRECEDES_CHECKS`, `INCOME_SOURCE_CONFLICT`, `DUPLICATE_DISBURSEMENT` | Enum | Non-unique | None | Labelled anomaly classification. |
| `is_anomaly` | `BOOLEAN` | Req | `0`, `1` | Flag | Non-unique | None | `1` if deliberate edge case, else `0`. |
| `expected_decision`| `VARCHAR(32)` | Req | `APPROVED`, `REJECTED`, `MANUAL_REVIEW` | Enum | Non-unique | None | Expected ground truth decision outcome. |
| `rule_triggered` | `VARCHAR(128)` | Req | Expected rule identifier | Code | Non-unique | None | Rule code that catches or governs this row. |
| `description` | `TEXT` | Req | Contextual explanation | String | Non-unique | None | Clear description of injected behavior. |

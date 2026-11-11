# Entity-Relationship Diagram (ERD) & Architecture

This document describes the relational architecture, cardinalities, lifecycle states, and state transition event model.

---

## 1. Entity-Relationship Model (Mermaid Diagram)

```mermaid
erDiagram
    LOAN_PRODUCT ||--o{ LOAN_APPLICATION : "governs (1:N)"
    APPLICANT ||--o{ EMPLOYMENT : "has history (1:N)"
    APPLICANT ||--o{ INCOME_RECORD : "earns (1:N)"
    APPLICANT ||--o{ CREDIT_FACILITY : "holds lines (1:N)"
    APPLICANT ||--o{ LOAN_APPLICATION : "submits (1:N)"
    
    LOAN_APPLICATION ||--o{ DOCUMENT : "attaches (1:N)"
    LOAN_APPLICATION ||--|| AFFORDABILITY_CHECK : "evaluates (1:1)"
    LOAN_APPLICATION ||--|| DECISION : "receives (1:1)"
    LOAN_APPLICATION ||--o{ REPAYMENT_SCHEDULE : "amortizes (1:N)"
    LOAN_APPLICATION ||--o{ APPLICATION_EVENT : "audits state (1:N)"

    LOAN_PRODUCT {
        string product_id PK
        string product_name
        decimal min_principal
        decimal max_principal
        int min_term_months
        int max_term_months
        decimal base_interest_rate
        decimal max_dti_threshold
        int min_credit_score
    }

    APPLICANT {
        string applicant_id PK
        string first_name
        string last_name
        string email
        string phone
        date date_of_birth
        string housing_status
        string national_id_hash
        timestamp created_at
        string gender "Protected - isolated"
        string ethnicity "Protected - isolated"
    }

    EMPLOYMENT {
        string employment_id PK
        string applicant_id FK
        string employer_name
        string employment_type
        string job_title
        date start_date
        date end_date
        boolean is_current
        int tenure_months
    }

    INCOME_RECORD {
        string income_id PK
        string applicant_id FK
        string income_source
        decimal gross_monthly_amount
        decimal net_monthly_amount
        string verification_status
        string verification_method
        date effective_date
    }

    CREDIT_FACILITY {
        string facility_id PK
        string applicant_id FK
        string facility_type
        string lender_name
        decimal credit_limit
        decimal outstanding_balance
        decimal monthly_payment
        string facility_status
        date opened_date
        date reported_date
    }

    LOAN_APPLICATION {
        string application_id PK
        string applicant_id FK
        string product_id FK
        decimal requested_principal
        int requested_term_months
        string purpose
        string application_status
        int credit_score
        decimal declared_monthly_income
        timestamp submission_timestamp
        timestamp updated_at
    }

    DOCUMENT {
        string document_id PK
        string application_id FK
        string applicant_id FK
        string document_type
        string document_status
        string file_hash
        timestamp uploaded_at
        timestamp verified_at
    }

    AFFORDABILITY_CHECK {
        string check_id PK
        string application_id FK
        decimal total_verified_monthly_income
        decimal existing_monthly_debt_obligations
        decimal estimated_living_expenses
        decimal proposed_loan_monthly_payment
        decimal calculated_dti
        decimal calculated_total_dti
        decimal net_disposable_income
        string affordability_result
        timestamp check_timestamp
    }

    DECISION {
        string decision_id PK
        string application_id FK
        string outcome
        decimal approved_principal
        int approved_term_months
        decimal approved_interest_rate
        string decision_reason_codes
        text decision_notes
        string reviewer_role
        timestamp decision_timestamp
    }

    REPAYMENT_SCHEDULE {
        string schedule_id PK
        string application_id FK
        int installment_number
        date due_date
        decimal payment_amount
        decimal principal_component
        decimal interest_component
        decimal remaining_balance
        string status
    }

    APPLICATION_EVENT {
        string event_id PK
        string application_id FK
        string from_status
        string to_status
        string event_type
        string actor
        timestamp timestamp
        text details
    }
```

---

## 2. Cardinality & Relationship Matrix

| Parent Entity | Child Entity | Cardinality | Optionality | Description |
| :--- | :--- | :---: | :---: | :--- |
| `Applicant` | `Employment` | **1 : N** | Optional (0..N) | An applicant may have 0 (unemployed) or multiple employments (e.g. current + historical). |
| `Applicant` | `IncomeRecord` | **1 : N** | Mandatory (1..N) | An applicant has 1 or more income streams (salary, secondary, investments). |
| `Applicant` | `CreditFacility` | **1 : N** | Optional (0..N) | An applicant may have 0 to multiple credit lines on bureau file. |
| `Applicant` | `LoanApplication` | **1 : N** | Optional (0..N) | An applicant can submit multiple loan applications over time. |
| `LoanProduct` | `LoanApplication` | **1 : N** | Mandatory (1..N) | Every application references exactly one active loan product. |
| `LoanApplication`| `Document` | **1 : N** | Mandatory (2..N) | An application requires KYC and income documentation attached. |
| `LoanApplication`| `AffordabilityCheck`| **1 : 1** | Mandatory (1..1) | Every application has an evaluated affordability record. |
| `LoanApplication`| `Decision` | **1 : 1** | Mandatory (1..1) | Every application receives an underwriting decision. |
| `LoanApplication`| `RepaymentSchedule` | **1 : N** | Conditional (0..N) | Populated only for `APPROVED` loans (N = approved term months). |
| `LoanApplication`| `ApplicationEvent` | **1 : N** | Mandatory (1..N) | Immutable chronological ledger of all lifecycle events. |

---

## 3. Lifecycle State Machine

The loan origination workflow follows an explicit state transition machine:

```mermaid
flowchart TD
    DRAFT["DRAFT (Pre-submission)"] -->|Submit Application| SUBMITTED["SUBMITTED"]
    SUBMITTED -->|Upload & Verify Documents| UNDER_REVIEW["UNDER_REVIEW"]
    UNDER_REVIEW -->|Affordability Check PASS & Credit Score OK| APPROVED["APPROVED"]
    UNDER_REVIEW -->|Borderline Score or Marginal DTI| MANUAL_REVIEW["MANUAL_REVIEW"]
    UNDER_REVIEW -->|Fails Policy / High DTI / Bad Credit / Fraud| REJECTED["REJECTED"]
    
    MANUAL_REVIEW -->|Senior Underwriter Approves| APPROVED
    MANUAL_REVIEW -->|Senior Underwriter Rejects| REJECTED
    
    APPROVED -->|Loan Agreement Executed & Funds Transferred| DISBURSED["DISBURSED"]
    APPROVED -->|Applicant Declines Offer| CANCELLED["CANCELLED"]
    DISBURSED -->|All Installments Paid| CLOSED["CLOSED"]
```

### State Transition Rules:
1. **`SUBMITTED` -> `UNDER_REVIEW`**: Initiated once applicant submits requested loan parameters and documents are logged.
2. **`UNDER_REVIEW` -> `APPROVED`**: Triggered when all KYC documents are verified, credit score meets product minimum, DTI is within policy thresholds, and disposable income buffer is positive.
3. **`UNDER_REVIEW` -> `MANUAL_REVIEW`**: Triggered when credit score is borderline (within 20 points), DTI is marginal, or minor document discrepancy requires human review.
4. **`UNDER_REVIEW` -> `REJECTED`**: Triggered when any hard policy check fails (DTI exceeded, severe delinquency, term out of product bounds, unverified identity).
5. **`APPROVED` -> `DISBURSED`**: Triggered upon loan closing; creates amortization schedule and initiates payout event.

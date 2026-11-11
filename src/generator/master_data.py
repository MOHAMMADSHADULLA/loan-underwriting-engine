"""Master data generator: Products, Applicants, Employments, Incomes, and Credit Facilities."""

import hashlib
import random
from datetime import date, datetime, timedelta
from typing import Dict, List, Tuple

from src.domain.enums import (
    EmploymentType,
    FacilityStatus,
    FacilityType,
    HousingStatus,
    IncomeSource,
    VerificationMethod,
    VerificationStatus,
)
from src.domain.models import (
    Applicant,
    CreditFacility,
    Employment,
    IncomeRecord,
    LoanProduct,
)
from src.generator.distributions import (
    EMPLOYERS,
    FIRST_NAMES,
    JOB_TITLES,
    LAST_NAMES,
    LENDERS,
    sample_date_between,
    sample_gross_monthly_income,
)


def get_standard_loan_products() -> List[LoanProduct]:
    """Generates the canonical 4 loan products with predefined policy parameters."""
    return [
        LoanProduct(
            product_id="PROD-001",
            product_name="Personal Unsecured Loan",
            min_principal=1000.0,
            max_principal=35000.0,
            min_term_months=12,
            max_term_months=60,
            base_interest_rate=8.50,
            max_dti_threshold=0.45,
            min_credit_score=620,
            is_active=True,
        ),
        LoanProduct(
            product_id="PROD-002",
            product_name="Debt Consolidation Loan",
            min_principal=5000.0,
            max_principal=60000.0,
            min_term_months=24,
            max_term_months=84,
            base_interest_rate=7.25,
            max_dti_threshold=0.50,
            min_credit_score=640,
            is_active=True,
        ),
        LoanProduct(
            product_id="PROD-003",
            product_name="Small Business Micro-Loan",
            min_principal=10000.0,
            max_principal=100000.0,
            min_term_months=12,
            max_term_months=72,
            base_interest_rate=10.50,
            max_dti_threshold=0.40,
            min_credit_score=660,
            is_active=True,
        ),
        LoanProduct(
            product_id="PROD-004",
            product_name="Auto & Vehicle Loan",
            min_principal=5000.0,
            max_principal=75000.0,
            min_term_months=24,
            max_term_months=72,
            base_interest_rate=5.75,
            max_dti_threshold=0.48,
            min_credit_score=600,
            is_active=True,
        ),
    ]


def generate_master_dataset(
    num_applicants: int,
    rng: random.Random,
    reference_year: int = 2026,
) -> Tuple[
    List[LoanProduct],
    List[Applicant],
    List[Employment],
    List[IncomeRecord],
    List[CreditFacility],
]:
    """
    Deterministically generates master data entities:
    - Products (4 standard)
    - Applicants (num_applicants)
    - Employments (1 to 2 per applicant)
    - IncomeRecords (1 to 3 per applicant)
    - CreditFacilities (0 to 5 per applicant)
    """
    products = get_standard_loan_products()
    applicants: List[Applicant] = []
    employments: List[Employment] = []
    income_records: List[IncomeRecord] = []
    credit_facilities: List[CreditFacility] = []

    base_date = date(reference_year, 1, 15)
    emp_counter = 1
    inc_counter = 1
    fac_counter = 1

    housing_choices = [
        HousingStatus.RENT,
        HousingStatus.OWN,
        HousingStatus.MORTGAGE,
        HousingStatus.OTHER,
    ]
    housing_weights = [0.45, 0.25, 0.25, 0.05]

    emp_choices = [
        EmploymentType.FULL_TIME,
        EmploymentType.SELF_EMPLOYED,
        EmploymentType.PART_TIME,
        EmploymentType.CONTRACT,
        EmploymentType.UNEMPLOYED,
    ]
    emp_weights = [0.76, 0.12, 0.06, 0.04, 0.02]

    for i in range(1, num_applicants + 1):
        app_id = f"APP-{reference_year}-{i:06d}"
        first_name = rng.choice(FIRST_NAMES)
        last_name = rng.choice(LAST_NAMES)
        email = f"{first_name.lower()}.{last_name.lower()}.{i}@example.com"
        phone = f"+1-555-{rng.randint(100, 999):03d}-{rng.randint(1000, 9999):04d}"

        # Age between 21 and 65
        birth_year = reference_year - rng.randint(21, 65)
        birth_month = rng.randint(1, 12)
        birth_day = rng.randint(1, 28)
        dob = date(birth_year, birth_month, birth_day)

        housing = rng.choices(housing_choices, weights=housing_weights, k=1)[0]
        id_hash = hashlib.sha256(f"NATIONAL-ID-{i}".encode("utf-8")).hexdigest()[:16].upper()
        created_at = datetime(reference_year, 1, 1, 8, 0, 0) + timedelta(
            minutes=rng.randint(0, 30 * 24 * 60)
        )

        applicant = Applicant(
            applicant_id=app_id,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            date_of_birth=dob,
            housing_status=housing,
            national_id_hash=id_hash,
            created_at=created_at,
            gender=None,
            ethnicity=None,
        )
        applicants.append(applicant)

        # Generate Employment
        emp_type = rng.choices(emp_choices, weights=emp_weights, k=1)[0]
        if emp_type == EmploymentType.UNEMPLOYED:
            tenure_months = 0
            start_dt = base_date - timedelta(days=60)
            employer = "None (Unemployed)"
            title = "Unemployed"
        else:
            tenure_months = rng.randint(2, 120)
            start_dt = base_date - timedelta(days=tenure_months * 30)
            employer = rng.choice(EMPLOYERS)
            title = rng.choice(JOB_TITLES)

        emp_record = Employment(
            employment_id=f"EMP-{reference_year}-{emp_counter:06d}",
            applicant_id=app_id,
            employer_name=employer,
            employment_type=emp_type,
            job_title=title,
            start_date=start_dt,
            end_date=None,
            is_current=True,
            tenure_months=tenure_months,
            created_at=created_at,
        )
        employments.append(emp_record)
        emp_counter += 1

        # Generate Income Records
        gross_monthly = sample_gross_monthly_income(rng)
        if emp_type == EmploymentType.UNEMPLOYED:
            # 50% chance of small benefit or 0
            gross_monthly = round(rng.uniform(0.0, 1200.0), 2)
            inc_source = IncomeSource.GOVERNMENT_BENEFIT
        elif emp_type == EmploymentType.SELF_EMPLOYED:
            inc_source = IncomeSource.BUSINESS_REVENUE
        else:
            inc_source = IncomeSource.PRIMARY_SALARY

        net_monthly = round(gross_monthly * rng.uniform(0.72, 0.80), 2)
        
        # 88% verified, 6% pending, 4% unverified, 2% discrepancy
        v_status = rng.choices(
            [
                VerificationStatus.VERIFIED,
                VerificationStatus.PENDING_DOCUMENTS,
                VerificationStatus.UNVERIFIED,
                VerificationStatus.DISCREPANCY,
            ],
            weights=[0.88, 0.06, 0.04, 0.02],
            k=1,
        )[0]
        v_method = rng.choice(
            [
                VerificationMethod.PAYSLIP,
                VerificationMethod.BANK_STATEMENT,
                VerificationMethod.TAX_RETURN,
                VerificationMethod.EMPLOYER_CONFIRMATION,
            ]
        )

        inc_rec = IncomeRecord(
            income_id=f"INC-{reference_year}-{inc_counter:06d}",
            applicant_id=app_id,
            income_source=inc_source,
            gross_monthly_amount=gross_monthly,
            net_monthly_amount=net_monthly,
            verification_status=v_status,
            verification_method=v_method,
            effective_date=base_date,
            created_at=created_at,
        )
        income_records.append(inc_rec)
        inc_counter += 1

        # Optional second income (bonus or investment) for 20% applicants
        if rng.random() < 0.20 and emp_type != EmploymentType.UNEMPLOYED:
            second_gross = round(gross_monthly * rng.uniform(0.15, 0.40), 2)
            second_net = round(second_gross * 0.75, 2)
            inc_records_secondary = IncomeRecord(
                income_id=f"INC-{reference_year}-{inc_counter:06d}",
                applicant_id=app_id,
                income_source=rng.choice([IncomeSource.SECONDARY_SALARY, IncomeSource.INVESTMENT]),
                gross_monthly_amount=second_gross,
                net_monthly_amount=second_net,
                verification_status=VerificationStatus.VERIFIED,
                verification_method=VerificationMethod.BANK_STATEMENT,
                effective_date=base_date,
                created_at=created_at,
            )
            income_records.append(inc_records_secondary)
            inc_counter += 1

        # Generate Existing Credit Facilities (0 to 4 facilities)
        num_facs = rng.choices([0, 1, 2, 3, 4], weights=[0.10, 0.35, 0.30, 0.15, 0.10], k=1)[0]
        for _ in range(num_facs):
            fac_type = rng.choice(
                [
                    FacilityType.CREDIT_CARD,
                    FacilityType.AUTO_LOAN,
                    FacilityType.PERSONAL_LOAN,
                    FacilityType.STUDENT_LOAN,
                ]
            )
            if fac_type == FacilityType.CREDIT_CARD:
                credit_limit = round(rng.uniform(1500.0, 25000.0), 2)
                balance = round(credit_limit * rng.uniform(0.05, 0.75), 2)
                monthly_pmt = round(max(35.0, balance * 0.03), 2)
            elif fac_type == FacilityType.AUTO_LOAN:
                credit_limit = round(rng.uniform(15000.0, 45000.0), 2)
                balance = round(credit_limit * rng.uniform(0.30, 0.90), 2)
                monthly_pmt = round(rng.uniform(320.0, 680.0), 2)
            else:
                credit_limit = round(rng.uniform(5000.0, 30000.0), 2)
                balance = round(credit_limit * rng.uniform(0.20, 0.85), 2)
                monthly_pmt = round(rng.uniform(150.0, 450.0), 2)

            f_status = rng.choices(
                [
                    FacilityStatus.ACTIVE,
                    FacilityStatus.CLOSED,
                    FacilityStatus.DELINQUENT_30,
                ],
                weights=[0.85, 0.12, 0.03],
                k=1,
            )[0]
            if f_status == FacilityStatus.CLOSED:
                balance = 0.0
                monthly_pmt = 0.0

            fac_record = CreditFacility(
                facility_id=f"FAC-{reference_year}-{fac_counter:06d}",
                applicant_id=app_id,
                facility_type=fac_type,
                lender_name=rng.choice(LENDERS),
                credit_limit=credit_limit,
                outstanding_balance=balance,
                monthly_payment=monthly_pmt,
                facility_status=f_status,
                opened_date=base_date - timedelta(days=rng.randint(180, 1800)),
                reported_date=base_date - timedelta(days=rng.randint(5, 30)),
                created_at=created_at,
            )
            credit_facilities.append(fac_record)
            fac_counter += 1

    return products, applicants, employments, income_records, credit_facilities

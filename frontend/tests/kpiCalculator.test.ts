import { describe, it, expect } from 'vitest';
import {
  calculateDashboardKPIs,
  getDecisionDistribution,
  getApplicationsByProduct,
  getMonthlyTrends,
  getDtiDistribution,
} from '../src/services/kpiCalculator';
import { LoanDataset } from '../src/types';

describe('KPI Calculator & Data Transformations', () => {
  const mockDataset: LoanDataset = {
    applicants: [
      {
        applicant_id: 'APP-2026-000001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-0100',
        date_of_birth: '1985-06-15',
        housing_status: 'OWN',
        national_id_hash: 'hash1',
        created_at: '2026-01-01T10:00:00',
      },
      {
        applicant_id: 'APP-2026-000002',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone: '555-0101',
        date_of_birth: '1990-08-20',
        housing_status: 'RENT',
        national_id_hash: 'hash2',
        created_at: '2026-01-02T10:00:00',
      },
    ],
    employments: [],
    income_records: [],
    credit_facilities: [],
    loan_products: [
      {
        product_id: 'PROD-001',
        product_name: 'Prime Personal',
        min_principal: 5000,
        max_principal: 40000,
        min_term_months: 12,
        max_term_months: 60,
        base_interest_rate: 0.0575,
        max_dti_threshold: 0.4,
        min_credit_score: 680,
        is_active: true,
      },
      {
        product_id: 'PROD-002',
        product_name: 'Near-Prime Personal',
        min_principal: 2000,
        max_principal: 25000,
        min_term_months: 12,
        max_term_months: 48,
        base_interest_rate: 0.085,
        max_dti_threshold: 0.45,
        min_credit_score: 600,
        is_active: true,
      },
    ],
    loan_applications: [
      {
        application_id: 'LOAN-2026-000001',
        applicant_id: 'APP-2026-000001',
        product_id: 'PROD-001',
        requested_principal: 15000,
        requested_term_months: 36,
        purpose: 'DEBT_CONSOLIDATION',
        application_status: 'APPROVED',
        credit_score: 720,
        declared_monthly_income: 6000,
        submission_timestamp: '2026-01-15T09:30:00',
        updated_at: '2026-01-15T11:00:00',
      },
      {
        application_id: 'LOAN-2026-000002',
        applicant_id: 'APP-2026-000002',
        product_id: 'PROD-002',
        requested_principal: 10000,
        requested_term_months: 24,
        purpose: 'HOME_IMPROVEMENT',
        application_status: 'REJECTED',
        credit_score: 590,
        declared_monthly_income: 4000,
        submission_timestamp: '2026-02-10T14:15:00',
        updated_at: '2026-02-10T15:00:00',
      },
    ],
    documents: [
      {
        document_id: 'DOC-01',
        application_id: 'LOAN-2026-000001',
        applicant_id: 'APP-2026-000001',
        document_type: 'PROOF_OF_IDENTITY',
        document_status: 'VERIFIED',
        file_hash: 'hash1',
        uploaded_at: '2026-01-15T09:35:00',
      },
      {
        document_id: 'DOC-02',
        application_id: 'LOAN-2026-000002',
        applicant_id: 'APP-2026-000002',
        document_type: 'PROOF_OF_INCOME',
        document_status: 'PENDING',
        file_hash: 'hash2',
        uploaded_at: '2026-02-10T14:20:00',
      },
    ],
    affordability_checks: [
      {
        check_id: 'AFF-01',
        application_id: 'LOAN-2026-000001',
        total_verified_monthly_income: 6000,
        existing_monthly_debt_obligations: 800,
        estimated_living_expenses: 1200,
        proposed_loan_monthly_payment: 450,
        calculated_dti: 0.208,
        calculated_total_dti: 0.408,
        net_disposable_income: 3550,
        affordability_result: 'PASS',
        check_timestamp: '2026-01-15T10:00:00',
      },
      {
        check_id: 'AFF-02',
        application_id: 'LOAN-2026-000002',
        total_verified_monthly_income: 4000,
        existing_monthly_debt_obligations: 1600,
        estimated_living_expenses: 1100,
        proposed_loan_monthly_payment: 450,
        calculated_dti: 0.5125,
        calculated_total_dti: 0.7875,
        net_disposable_income: 850,
        affordability_result: 'FAIL',
        check_timestamp: '2026-02-10T14:45:00',
      },
    ],
    decisions: [
      {
        decision_id: 'DEC-01',
        application_id: 'LOAN-2026-000001',
        outcome: 'APPROVED',
        approved_principal: 15000,
        approved_term_months: 36,
        approved_interest_rate: 0.0575,
        decision_reason_codes: 'MEETS_POLICY',
        decision_notes: 'Approved',
        reviewer_role: 'AUTOMATED_RULES_ENGINE',
        decision_timestamp: '2026-01-15T10:30:00',
      },
      {
        decision_id: 'DEC-02',
        application_id: 'LOAN-2026-000002',
        outcome: 'REJECTED',
        approved_principal: 0,
        approved_term_months: 0,
        approved_interest_rate: 0,
        decision_reason_codes: 'DTI_EXCEEDS_POLICY',
        decision_notes: 'Rejected',
        reviewer_role: 'AUTOMATED_RULES_ENGINE',
        decision_timestamp: '2026-02-10T15:00:00',
      },
    ],
    repayment_schedules: [],
    application_events: [],
    ground_truth: [],
  };

  it('calculates dashboard KPIs accurately from dataset records', () => {
    const kpis = calculateDashboardKPIs(mockDataset);
    expect(kpis.totalApplicants).toBe(2);
    expect(kpis.totalApplications).toBe(2);
    expect(kpis.approvedCount).toBe(1);
    expect(kpis.rejectedCount).toBe(1);
    expect(kpis.manualReviewCount).toBe(0);
    expect(kpis.approvalRate).toBe(50);
    expect(kpis.automatedDecisionRate).toBe(100);
    expect(kpis.totalRequestedCapital).toBe(25000);
    expect(kpis.totalApprovedCapital).toBe(15000);
    expect(kpis.averageCreditScore).toBe(655); // (720 + 590) / 2
    expect(kpis.totalProducts).toBe(2);
    expect(kpis.totalDocuments).toBe(2);
    expect(kpis.verificationRate).toBe(50);
  });

  it('safely handles empty datasets without divide-by-zero errors', () => {
    const emptyDataset: LoanDataset = {
      applicants: [],
      employments: [],
      income_records: [],
      credit_facilities: [],
      loan_products: [],
      loan_applications: [],
      documents: [],
      affordability_checks: [],
      decisions: [],
      repayment_schedules: [],
      application_events: [],
      ground_truth: [],
    };
    const kpis = calculateDashboardKPIs(emptyDataset);
    expect(kpis.totalApplications).toBe(0);
    expect(kpis.approvalRate).toBe(0);
    expect(kpis.averageCreditScore).toBe(0);
    expect(kpis.averageDti).toBe(0);
  });

  it('prepares decision distribution for chart rendering', () => {
    const dist = getDecisionDistribution(mockDataset);
    expect(dist).toHaveLength(3);
    const approved = dist.find((d) => d.name === 'Approved');
    const rejected = dist.find((d) => d.name === 'Rejected');
    expect(approved?.count).toBe(1);
    expect(approved?.percentage).toBe(50);
    expect(rejected?.count).toBe(1);
    expect(rejected?.percentage).toBe(50);
  });

  it('aggregates application volume by loan product', () => {
    const vol = getApplicationsByProduct(mockDataset);
    expect(vol).toHaveLength(2);
    const prod1 = vol.find((p) => p.productId === 'PROD-001');
    expect(prod1?.count).toBe(1);
    expect(prod1?.totalRequested).toBe(15000);
    expect(prod1?.percentage).toBe(50);
  });

  it('prepares monthly trends', () => {
    const trends = getMonthlyTrends(mockDataset);
    expect(trends.length).toBeGreaterThanOrEqual(2);
    const jan = trends.find((t) => t.month === 'Jan');
    const feb = trends.find((t) => t.month === 'Feb');
    expect(jan?.submitted).toBe(1);
    expect(jan?.approved).toBe(1);
    expect(feb?.submitted).toBe(1);
    expect(feb?.rejected).toBe(1);
  });

  it('categorizes DTI distribution into risk brackets', () => {
    const dtiBrackets = getDtiDistribution(mockDataset);
    expect(dtiBrackets).toHaveLength(5);
    const lowDti = dtiBrackets.find((b) => b.range === '20% - 35%');
    const highDti = dtiBrackets.find((b) => b.range === '> 50%');
    expect(lowDti?.count).toBe(1); // 0.208
    expect(highDti?.count).toBe(1); // 0.5125
  });
});

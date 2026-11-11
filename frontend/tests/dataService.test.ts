import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dataService } from '../src/services/dataService';

describe('DataService & Relational Joins', () => {
  beforeEach(() => {
    // Reset service state
    dataService.clearCache();
    dataService.setScale('starter');
  });

  it('verifies that ground truth is isolated unless requested in validation context', async () => {
    // Mock global fetch for starter data
    const mockApps = [
      {
        application_id: 'LOAN-2026-000001',
        applicant_id: 'APP-2026-000001',
        product_id: 'PROD-001',
        requested_principal: 10000,
        requested_term_months: 24,
        purpose: 'DEBT_CONSOLIDATION',
        application_status: 'APPROVED',
        credit_score: 720,
        declared_monthly_income: 5000,
        submission_timestamp: '2026-01-01T10:00:00',
        updated_at: '2026-01-01T10:00:00',
      },
    ];

    const mockGT = [
      {
        application_id: 'LOAN-2026-000001',
        entity_type: 'LoanApplication',
        record_id: 'LOAN-2026-000001',
        issue_type: 'TERM_OUT_OF_BOUNDS',
        is_anomaly: true,
        expected_decision: 'REJECTED',
        rule_triggered: 'TERM_LIMIT',
        description: 'Test anomaly',
      },
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('loan_applications.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockApps) });
      }
      if (url.includes('ground_truth.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGT) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    const dataset = await dataService.loadDataset();
    expect(dataset.loan_applications).toHaveLength(1);
    expect(dataset.ground_truth).toHaveLength(1);

    // Verify application query does not leak ground truth into normal table items
    const query = await dataService.getApplications();
    expect(query.items[0]).not.toHaveProperty('issue_type');
    expect(query.items[0]).not.toHaveProperty('is_anomaly');
  });

  it('paginates applications correctly', async () => {
    const mockList = Array.from({ length: 25 }, (_, i) => ({
      application_id: `LOAN-2026-${String(i + 1).padStart(6, '0')}`,
      applicant_id: `APP-2026-${String(i + 1).padStart(6, '0')}`,
      product_id: 'PROD-001',
      requested_principal: 10000 + i * 1000,
      requested_term_months: 24,
      purpose: 'HOME_IMPROVEMENT',
      application_status: 'SUBMITTED',
      credit_score: 700,
      declared_monthly_income: 5000,
      submission_timestamp: `2026-01-${String((i % 28) + 1).padStart(2, '0')}T10:00:00`,
      updated_at: '2026-01-01T10:00:00',
    }));

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('loan_applications.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockList) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    const page1 = await dataService.getApplications({ page: 1, pageSize: 10 });
    expect(page1.items).toHaveLength(10);
    expect(page1.total).toBe(25);
    expect(page1.totalPages).toBe(3);

    const page3 = await dataService.getApplications({ page: 3, pageSize: 10 });
    expect(page3.items).toHaveLength(5);
  });
});

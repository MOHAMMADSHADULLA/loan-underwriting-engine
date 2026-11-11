import { LoanDataset } from '@/types';

export interface DashboardKPIs {
  totalApplicants: number;
  totalApplications: number;
  approvedCount: number;
  rejectedCount: number;
  manualReviewCount: number;
  approvalRate: number;
  automatedDecisionRate: number;
  totalRequestedCapital: number;
  totalApprovedCapital: number;
  averageDti: number;
  averageCreditScore: number;
  totalProducts: number;
  totalDocuments: number;
  verificationRate: number;
}

export interface DecisionDistributionItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ProductVolumeItem {
  productId: string;
  productName: string;
  count: number;
  percentage: number;
  totalRequested: number;
  color: string;
}

export interface MonthlyTrendItem {
  month: string;
  submitted: number;
  approved: number;
  rejected: number;
}

export interface DtiDistributionItem {
  range: string;
  count: number;
  percentage: number;
}

export function calculateDashboardKPIs(dataset: LoanDataset): DashboardKPIs {
  const totalApplicants = dataset.applicants.length;
  const totalApplications = dataset.loan_applications.length;
  const totalProducts = dataset.loan_products.length;

  let approvedCount = 0;
  let rejectedCount = 0;
  let manualReviewCount = 0;
  let totalApprovedCapital = 0;

  dataset.decisions.forEach((dec) => {
    if (dec.outcome === 'APPROVED') {
      approvedCount++;
      totalApprovedCapital += dec.approved_principal || 0;
    } else if (dec.outcome === 'REJECTED') {
      rejectedCount++;
    } else if (dec.outcome === 'MANUAL_REVIEW') {
      manualReviewCount++;
    }
  });

  const approvalRate = totalApplications > 0 ? (approvedCount / totalApplications) * 100 : 0;
  const automatedDecisionRate =
    totalApplications > 0 ? ((approvedCount + rejectedCount) / totalApplications) * 100 : 0;

  const totalRequestedCapital = dataset.loan_applications.reduce(
    (acc, app) => acc + (app.requested_principal || 0),
    0
  );

  const totalScore = dataset.loan_applications.reduce(
    (acc, app) => acc + (app.credit_score || 0),
    0
  );
  const averageCreditScore = totalApplications > 0 ? Math.round(totalScore / totalApplications) : 0;

  const validDtis = dataset.affordability_checks
    .map((a) => a.calculated_dti)
    .filter((d) => typeof d === 'number' && !isNaN(d) && d >= 0);
  const averageDti =
    validDtis.length > 0
      ? validDtis.reduce((acc, val) => acc + val, 0) / validDtis.length
      : 0;

  const totalDocuments = dataset.documents.length;
  const verifiedDocs = dataset.documents.filter((d) => d.document_status === 'VERIFIED').length;
  const verificationRate = totalDocuments > 0 ? (verifiedDocs / totalDocuments) * 100 : 0;

  return {
    totalApplicants,
    totalApplications,
    approvedCount,
    rejectedCount,
    manualReviewCount,
    approvalRate,
    automatedDecisionRate,
    totalRequestedCapital,
    totalApprovedCapital,
    averageDti,
    averageCreditScore,
    totalProducts,
    totalDocuments,
    verificationRate,
  };
}

export function getDecisionDistribution(dataset: LoanDataset): DecisionDistributionItem[] {
  const total = dataset.decisions.length;
  if (total === 0) return [];

  const counts: Record<string, number> = {
    APPROVED: 0,
    REJECTED: 0,
    MANUAL_REVIEW: 0,
  };

  dataset.decisions.forEach((d) => {
    if (counts[d.outcome] !== undefined) {
      counts[d.outcome]++;
    }
  });

  return [
    {
      name: 'Approved',
      count: counts.APPROVED,
      percentage: Math.round((counts.APPROVED / total) * 100),
      color: '#A3E635', // Brand lime
    },
    {
      name: 'Rejected',
      count: counts.REJECTED,
      percentage: Math.round((counts.REJECTED / total) * 100),
      color: '#0F291E', // Dark forest
    },
    {
      name: 'Manual Review',
      count: counts.MANUAL_REVIEW,
      percentage: Math.round((counts.MANUAL_REVIEW / total) * 100),
      color: '#F59E0B', // Amber
    },
  ];
}

export function getApplicationsByProduct(dataset: LoanDataset): ProductVolumeItem[] {
  const total = dataset.loan_applications.length;
  const productMap = new Map(dataset.loan_products.map((p) => [p.product_id, p.product_name]));

  const counts: Record<string, { count: number; totalRequested: number }> = {};
  dataset.loan_products.forEach((p) => {
    counts[p.product_id] = { count: 0, totalRequested: 0 };
  });

  dataset.loan_applications.forEach((app) => {
    if (!counts[app.product_id]) {
      counts[app.product_id] = { count: 0, totalRequested: 0 };
    }
    counts[app.product_id].count++;
    counts[app.product_id].totalRequested += app.requested_principal || 0;
  });

  const palette = ['#A3E635', '#0F291E', '#3B82F6', '#8B5CF6'];

  return Object.keys(counts).map((prodId, idx) => {
    const item = counts[prodId];
    return {
      productId: prodId,
      productName: productMap.get(prodId) || prodId,
      count: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
      totalRequested: item.totalRequested,
      color: palette[idx % palette.length],
    };
  });
}

export function getMonthlyTrends(dataset: LoanDataset): MonthlyTrendItem[] {
  const monthMap: Record<string, { submitted: number; approved: number; rejected: number }> = {};
  const decisionMap = new Map(dataset.decisions.map((d) => [d.application_id, d.outcome]));

  dataset.loan_applications.forEach((app) => {
    const date = new Date(app.submission_timestamp);
    if (isNaN(date.getTime())) return;
    const monthKey = date.toLocaleString('default', { month: 'short' });

    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { submitted: 0, approved: 0, rejected: 0 };
    }
    monthMap[monthKey].submitted++;
    const dec = decisionMap.get(app.application_id);
    if (dec === 'APPROVED') monthMap[monthKey].approved++;
    if (dec === 'REJECTED') monthMap[monthKey].rejected++;
  });

  // Preserve calendar order for 2026 months
  const calendarOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return calendarOrder
    .filter((m) => monthMap[m] !== undefined)
    .map((m) => ({
      month: m,
      submitted: monthMap[m].submitted,
      approved: monthMap[m].approved,
      rejected: monthMap[m].rejected,
    }));
}

export function getDtiDistribution(dataset: LoanDataset): DtiDistributionItem[] {
  const dtis = dataset.affordability_checks
    .map((a) => a.calculated_dti)
    .filter((d) => typeof d === 'number' && !isNaN(d));

  const total = dtis.length;
  if (total === 0) return [];

  const brackets = [
    { range: '< 20%', min: 0, max: 0.2, count: 0 },
    { range: '20% - 35%', min: 0.2, max: 0.35, count: 0 },
    { range: '35% - 43%', min: 0.35, max: 0.43, count: 0 },
    { range: '43% - 50%', min: 0.43, max: 0.5, count: 0 },
    { range: '> 50%', min: 0.5, max: Infinity, count: 0 },
  ];

  dtis.forEach((d) => {
    for (const b of brackets) {
      if (d >= b.min && d < b.max) {
        b.count++;
        break;
      }
    }
  });

  return brackets.map((b) => ({
    range: b.range,
    count: b.count,
    percentage: Math.round((b.count / total) * 100),
  }));
}

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { dataService } from '@/services/dataService';
import {
  getDecisionDistribution,
  getApplicationsByProduct,
  getMonthlyTrends,
  getDtiDistribution,
} from '@/services/kpiCalculator';
import { LoanDataset } from '@/types';

export const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState<LoanDataset | null>(null);

  useEffect(() => {
    let mounted = true;
    dataService.loadDataset().then((data) => {
      if (!mounted) return;
      setDataset(data);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !dataset) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#B4F04D] border-t-[#0F291E] rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Aggregating Portfolio Analytics...</p>
        </div>
      </div>
    );
  }

  // 1. Decision Distribution
  const decisionData = getDecisionDistribution(dataset);

  // 2. Product Volume
  const productData = getApplicationsByProduct(dataset);

  // 3. Monthly Trends
  const monthlyTrends = getMonthlyTrends(dataset);

  // 4. DTI Distribution
  const dtiData = getDtiDistribution(dataset);

  // 5. Loan Amount Distribution
  const loanAmountBrackets = [
    { range: '< $10k', count: 0 },
    { range: '$10k - $25k', count: 0 },
    { range: '$25k - $50k', count: 0 },
    { range: '$50k - $75k', count: 0 },
    { range: '> $75k', count: 0 },
  ];
  dataset.loan_applications.forEach((app) => {
    const amt = app.requested_principal;
    if (amt < 10000) loanAmountBrackets[0].count++;
    else if (amt <= 25000) loanAmountBrackets[1].count++;
    else if (amt <= 50000) loanAmountBrackets[2].count++;
    else if (amt <= 75000) loanAmountBrackets[3].count++;
    else loanAmountBrackets[4].count++;
  });

  // 6. Term Distribution
  const termCounts: Record<number, number> = {};
  dataset.loan_applications.forEach((app) => {
    const t = app.requested_term_months;
    termCounts[t] = (termCounts[t] || 0) + 1;
  });
  const termData = Object.keys(termCounts)
    .map(Number)
    .sort((a, b) => a - b)
    .map((term) => ({
      term: `${term} mo`,
      count: termCounts[term],
    }));

  // 7. Affordability Result Distribution
  const affCounts = { PASS: 0, MARGINAL: 0, FAIL: 0 };
  dataset.affordability_checks.forEach((a) => {
    if (affCounts[a.affordability_result] !== undefined) {
      affCounts[a.affordability_result]++;
    }
  });
  const affData = [
    { name: 'PASS', count: affCounts.PASS, color: '#A3E635' },
    { name: 'MARGINAL', count: affCounts.MARGINAL, color: '#F59E0B' },
    { name: 'FAIL', count: affCounts.FAIL, color: '#EF4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#EDF0EB]">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F291E] tracking-tight">
            Underwriting & Portfolio Risk Analytics
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Statistical distributions across decision outcomes, loan products, requested terms, and debt burdens
          </p>
        </div>
        <Badge variant="lime" size="sm">
          Deterministic Dataset (Seed 20261022)
        </Badge>
      </div>

      {/* Row 1: Decisions & Monthly Application Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Decisions Donut - 4 cols */}
        <Card variant="white" className="lg:col-span-4 p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0F291E] mb-1">Underwriting Decision Split</h3>
            <p className="text-xs text-gray-400 mb-4">Outcome distribution across audited applications</p>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={decisionData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {decisionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Monthly Application Trends - 8 cols */}
        <Card variant="white" className="lg:col-span-8 p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0F291E] mb-1">Monthly Application Volume (2026)</h3>
            <p className="text-xs text-gray-400 mb-4">Volume submitted, approved, and rejected over chronological calendar originations</p>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2EE" />
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} />
                  <YAxis stroke="#9CA3AF" fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
                  <Legend verticalAlign="top" height={30} iconType="circle" />
                  <Line type="monotone" dataKey="submitted" stroke="#0F291E" strokeWidth={2.5} name="Total Submitted" />
                  <Line type="monotone" dataKey="approved" stroke="#84CC16" strokeWidth={2.5} name="Approved" />
                  <Line type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={2} name="Rejected" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Loan Amount Distribution & Product Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Amount Brackets */}
        <Card variant="white" className="p-5">
          <h3 className="text-sm font-bold text-[#0F291E] mb-1">Requested Loan Amount Distribution</h3>
          <p className="text-xs text-gray-400 mb-4">Count of applications by principal borrowing tranche</p>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loanAmountBrackets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2EE" />
                <XAxis dataKey="range" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#0F291E" radius={[6, 6, 0, 0]} name="Applications" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Product Volume */}
        <Card variant="white" className="p-5">
          <h3 className="text-sm font-bold text-[#0F291E] mb-1">Applications by Loan Product</h3>
          <p className="text-xs text-gray-400 mb-4">Total originations volume allocated per facility</p>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2EE" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={11} />
                <YAxis dataKey="productId" type="category" stroke="#9CA3AF" fontSize={11} width={80} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#A3E635" radius={[0, 6, 6, 0]} name="Loan Applications" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row 3: DTI Distribution & Loan Terms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DTI Brackets */}
        <Card variant="white" className="p-5">
          <h3 className="text-sm font-bold text-[#0F291E] mb-1">Debt-to-Income (DTI) Spread</h3>
          <p className="text-xs text-gray-400 mb-4">Distribution across risk affordability brackets</p>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dtiData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2EE" />
                <XAxis dataKey="range" stroke="#9CA3AF" fontSize={10} />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#183B2C" radius={[6, 6, 0, 0]} name="Applications" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Loan Term Distribution */}
        <Card variant="white" className="p-5">
          <h3 className="text-sm font-bold text-[#0F291E] mb-1">Requested Loan Terms</h3>
          <p className="text-xs text-gray-400 mb-4">Borrowing duration preferences in months</p>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={termData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2EE" />
                <XAxis dataKey="term" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#84CC16" radius={[6, 6, 0, 0]} name="Applications" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Affordability Outcomes */}
        <Card variant="white" className="p-5">
          <h3 className="text-sm font-bold text-[#0F291E] mb-1">Affordability Check Outcomes</h3>
          <p className="text-xs text-gray-400 mb-4">Cash-flow stress test determinations</p>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={affData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {affData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

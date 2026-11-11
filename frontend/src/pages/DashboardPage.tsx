import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  TrendingUp,
  FileCheck2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  DollarSign,
  Percent,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { dataService } from '@/services/dataService';
import {
  calculateDashboardKPIs,
  getDecisionDistribution,
  getApplicationsByProduct,
  DashboardKPIs,
  DecisionDistributionItem,
  ProductVolumeItem,
} from '@/services/kpiCalculator';
import { LoanDataset } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState<LoanDataset | null>(null);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [decisionDist, setDecisionDist] = useState<DecisionDistributionItem[]>([]);
  const [productVolume, setProductVolume] = useState<ProductVolumeItem[]>([]);
  const [balanceVisible, setBalanceVisible] = useState(true);

  useEffect(() => {
    let mounted = true;
    dataService.loadDataset().then((data) => {
      if (!mounted) return;
      setDataset(data);
      setKpis(calculateDashboardKPIs(data));
      setDecisionDist(getDecisionDistribution(data));
      setProductVolume(getApplicationsByProduct(data));
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !dataset || !kpis) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#B4F04D] border-t-[#0F291E] rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Loading Underwriting Engine Datasets...</p>
        </div>
      </div>
    );
  }

  // Format currency helpers
  const formatCur = (num: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  const formatDec = (num: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(num);

  // Recent 5 applications for the transaction card
  const recentApps = dataset.loan_applications.slice(0, 5).map((app) => {
    const applicant = dataset.applicants.find((a) => a.applicant_id === app.applicant_id);
    const decision = dataset.decisions.find((d) => d.application_id === app.application_id);
    return {
      id: app.application_id,
      name: applicant ? `${applicant.first_name} ${applicant.last_name}` : app.applicant_id,
      purpose: app.purpose.replace(/_/g, ' '),
      amount: app.requested_principal,
      decision: decision?.outcome || 'PENDING',
      timestamp: app.submission_timestamp,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Currency & Category Selector matching the reference */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#EDF0EB]">
        <div className="flex items-center gap-2">
          {/* USD Active Base Currency */}
          <button
            type="button"
            className="px-3 py-1 rounded-full text-xs font-bold bg-[#0F291E] text-white shadow-sm flex items-center gap-1.5 cursor-default"
            title="Portfolio Base Currency (All figures generated in USD)"
          >
            <span>USD</span>
            <span className="text-[10px] font-semibold text-[#B4F04D]">(Base)</span>
          </button>

          {/* Inactive Currencies */}
          <button
            type="button"
            disabled
            className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F2F4F1] text-gray-400 border border-gray-200/60 cursor-not-allowed opacity-60"
            title="EUR conversion disabled — underwriting engine operates in USD base currency"
          >
            EUR
          </button>
          <button
            type="button"
            disabled
            className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F2F4F1] text-gray-400 border border-gray-200/60 cursor-not-allowed opacity-60"
            title="GBP conversion disabled — underwriting engine operates in USD base currency"
          >
            GBP
          </button>

          <span className="hidden sm:inline-block text-[11px] text-gray-400 font-medium ml-1">
            • USD Base Currency
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
          <span>Target Reference Period:</span>
          <span className="font-bold text-[#0F291E] bg-[#F2F4F1] px-2.5 py-1 rounded-full">
            CY 2026 Originations
          </span>
        </div>
      </div>

      {/* Row 1: Two Hero Cards directly matching the visual style of the reference image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1 (Active Balance Style) - 7 cols */}
        <Card variant="white" className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Total Requested Capital
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400">Account Pipeline</span>
                <span className="font-mono text-xs font-bold text-[#0F291E] bg-[#F6F8F5] px-2 py-0.5 rounded-lg border border-gray-200">
                  PORTFOLIO-2026
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0F291E]">
                {balanceVisible ? formatDec(kpis.totalRequestedCapital) : '••••••••••'}
              </h2>
              <button
                type="button"
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Toggle visibility"
              >
                {balanceVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/applications')}
                className="px-5 py-2.5 rounded-full bg-[#0F291E] text-white font-semibold text-xs tracking-wide hover:bg-[#183B2C] transition-all shadow-sm flex items-center gap-2"
              >
                <span>View Applications</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/validation')}
                className="px-5 py-2.5 rounded-full bg-white text-[#0F291E] font-semibold text-xs tracking-wide border border-gray-300 hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <span>Audit Validation</span>
              </button>
            </div>

            {/* Circular Lime Arrow Button matching the reference */}
            <button
              type="button"
              onClick={() => navigate('/analytics')}
              className="w-12 h-12 rounded-full bg-[#B4F04D] hover:bg-[#9AE630] text-[#0F291E] flex items-center justify-center transition-all shadow-md group"
              title="Open Underwriting Analytics"
            >
              <ArrowUpRight className="w-6 h-6 stroke-[2.5] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </Card>

        {/* Card 2 (Vivid Lime Priority Card Style) - 5 cols */}
        <Card variant="lime" className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0F291E] text-[#B4F04D] text-[11px] font-extrabold tracking-wider">
                PRIORITY PORTFOLIO +
              </span>
              <span className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center font-bold text-xs">
                ...
              </span>
            </div>

            <div className="space-y-1 mb-6">
              <p className="text-xs font-semibold text-[#0F291E]/70">Approved & Disbursed</p>
              <div className="flex items-baseline gap-3">
                <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F291E]">
                  {formatDec(kpis.totalApprovedCapital)}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white text-[#0F291E] text-[11px] font-bold shadow-sm">
                  {kpis.approvalRate.toFixed(1)}% rate
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#0F291E]/15">
            <div className="bg-white/40 backdrop-blur-sm p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs text-[#0F291E]/80 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-semibold">Avg DTI Ratio</span>
              </div>
              <p className="text-lg font-bold text-[#0F291E]">
                {(kpis.averageDti * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white/40 backdrop-blur-sm p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs text-[#0F291E]/80 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-semibold">Credit Score</span>
              </div>
              <p className="text-lg font-bold text-[#0F291E]">
                {kpis.averageCreditScore} Avg
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Three Cards directly matching row 2 in the reference image */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* Card 3: Decisions Donut Gauge (Spending Donut Style) - 4 cols */}
        <Card variant="white" className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-[#F6F8F5] flex items-center justify-center text-[#0F291E]">
                  <Percent className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-[#0F291E]">Decisions</span>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-[#F6F8F5] px-2 py-0.5 rounded-full">
                {kpis.totalApplications} total
              </span>
            </div>

            {/* Recharts Donut Ring Chart with center metric */}
            <div className="relative h-44 my-2 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={decisionDist}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={70}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {decisionDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number, name: string) => [`${val} loans`, name]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Callout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-[#0F291E]">
                  {kpis.approvedCount}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Approved
                </span>
              </div>
            </div>

            <p className="text-center text-xs font-semibold text-gray-500 mb-4 flex items-center justify-center gap-1">
              <span>✧</span>
              <span>Architectural Guardrail: Protected attributes isolated from decisions</span>
            </p>
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-center">
            {decisionDist.map((item) => (
              <div key={item.name} className="p-1.5 rounded-xl bg-[#F8FAF7]">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-bold text-gray-600">{item.name}</span>
                </div>
                <p className="text-xs font-bold text-[#0F291E]">{item.count} ({item.percentage}%)</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Card 4: Products Horizontal Progress Allocation (Earning Bar Style) - 4 cols */}
        <Card variant="white" className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-[#F6F8F5] flex items-center justify-center text-[#0F291E]">
                  <DollarSign className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-[#0F291E]">Product Volume</span>
              </div>
              <span className="text-xs font-mono font-bold text-[#0F291E] border-b-2 border-[#84CC16] pb-0.5">
                {kpis.totalProducts} Products
              </span>
            </div>

            <div className="mb-4">
              <h4 className="text-3xl font-extrabold text-[#0F291E] tracking-tight">
                {kpis.totalApplications}
              </h4>
              <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                {kpis.automatedDecisionRate.toFixed(0)}% Straight-Through ({kpis.manualReviewCount} manual reviews)
              </p>
            </div>

            {/* Segmented Progress Bars matching reference */}
            <div className="space-y-3.5 my-2">
              {productVolume.map((item) => (
                <div key={item.productId}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-700 truncate max-w-[170px]">
                      {item.productName}
                    </span>
                    <span className="font-mono text-gray-500 font-medium">
                      {formatCur(item.totalRequested)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#F2F4F1] rounded-full overflow-hidden flex relative">
                    <div
                      className="h-full bg-[#B4F04D] rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(item.percentage, 8)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/products')}
            className="w-full mt-4 py-2 text-xs font-bold text-[#0F291E] bg-[#F6F8F5] hover:bg-[#EAECE8] rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Explore All 4 Loan Products</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </Card>

        {/* Card 5: Recent Applications List (Transactions Style) - 4 cols */}
        <Card variant="white" className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-[#0F291E]">Recent Applications</span>
              <button
                type="button"
                onClick={() => navigate('/applications')}
                className="text-xs font-semibold text-gray-400 hover:text-gray-700"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {recentApps.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/applications/${item.id}`)}
                  className="py-2.5 flex items-center justify-between group cursor-pointer hover:bg-[#F9FAF8] px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#F2F4F1] flex items-center justify-center text-xs font-bold text-[#0F291E] shrink-0">
                      {item.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0F291E] truncate group-hover:text-emerald-700">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate font-mono">
                        {item.id} • {item.purpose}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <p className="text-xs font-extrabold text-[#0F291E]">
                        {formatCur(item.amount)}
                      </p>
                    </div>
                    {item.decision === 'APPROVED' ? (
                      <span className="w-6 h-6 rounded-full bg-[#B4F04D] text-[#0F291E] flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                    ) : item.decision === 'REJECTED' ? (
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">
                        ✕
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
                        ◷
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/applications')}
            className="w-full mt-2 py-2 text-xs font-bold text-[#0F291E] bg-[#F6F8F5] hover:bg-[#EAECE8] rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Open Underwriting Queue</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </Card>
      </div>

      {/* Row 3: Synthetic Anomaly Validation Banner */}
      <div className="bg-[#F8FAF6] p-5 rounded-[24px] border border-[#E7EBE4] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#0F291E] flex items-center justify-center text-[#B4F04D] shrink-0">
            <ShieldCheck className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[#0F291E]">
                Synthetic Test Anomaly Monitor (Seed 20261022)
              </h4>
              <Badge variant="lime" size="sm">
                5/5 Reconciled
              </Badge>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Controlled synthetic test cases deterministically injected to evaluate validator rules: Term bounds, Schedule reconciliation, Temporal ordering, Income discrepancy, Duplicate disbursement.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/validation')}
          className="px-4 py-2 rounded-full bg-[#0F291E] hover:bg-[#183B2C] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
        >
          <span>Open Validation Center</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#B4F04D]" />
        </button>
      </div>
    </div>
  );
};

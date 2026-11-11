import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileCheck2,
  Calendar,
  Building2,
  Wallet,
  CreditCard,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  User,
  Info,
  DollarSign,
  TrendingDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { dataService } from '@/services/dataService';
import { EnrichedApplication } from '@/types';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EnrichedApplication | null>(null);

  useEffect(() => {
    let mounted = true;
    if (id) {
      dataService.getEnrichedApplication(id).then((result) => {
        if (!mounted) return;
        setData(result);
        setLoading(false);
      });
    }
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#B4F04D] border-t-[#0F291E] rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Loading Application Dossier...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-bold text-gray-800">Application Not Found</h3>
        <p className="text-xs text-gray-500 mt-1 mb-4">No loan application matches identifier "{id}"</p>
        <button
          type="button"
          onClick={() => navigate('/applications')}
          className="px-4 py-2 rounded-full bg-[#0F291E] text-white text-xs font-bold"
        >
          Back to Applications Queue
        </button>
      </div>
    );
  }

  const {
    application,
    applicant,
    product,
    employment,
    incomeRecords,
    creditFacilities,
    documents,
    affordabilityCheck,
    decision,
    repaymentSchedules,
    events,
    groundTruth,
  } = data;

  const formatCur = (num: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(num);

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#EDF0EB]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/applications')}
            className="p-2 rounded-full bg-[#F6F8F5] hover:bg-gray-200 text-[#0F291E] transition-colors"
            title="Back to Applications"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-[#0F291E] tracking-tight font-mono">
                {application.application_id}
              </h2>
              {decision?.outcome === 'APPROVED' ? (
                <Badge variant="lime" size="sm">
                  Approved
                </Badge>
              ) : decision?.outcome === 'REJECTED' ? (
                <Badge variant="red" size="sm">
                  Rejected
                </Badge>
              ) : (
                <Badge variant="amber" size="sm">
                  Manual Review
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Submitted on {new Date(application.submission_timestamp).toLocaleString()} • Product: {application.product_id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {groundTruth && groundTruth.is_anomaly && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold"
              title={`Controlled test anomaly injected for validation benchmarking: ${groundTruth.description}`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Synthetic Anomaly Benchmark: {groundTruth.issue_type}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hero Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="white" className="p-4">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Requested Principal
          </span>
          <p className="text-2xl font-extrabold text-[#0F291E] mt-1 font-mono">
            {formatCur(application.requested_principal)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Term: {application.requested_term_months} Months
          </p>
        </Card>

        <Card variant="white" className="p-4">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Credit Score & Rating
          </span>
          <p className="text-2xl font-extrabold text-[#0F291E] mt-1 font-mono">
            {application.credit_score}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {application.credit_score >= 720 ? 'Tier 1 Prime' : application.credit_score >= 640 ? 'Tier 2 Near-Prime' : 'Subprime'}
          </p>
        </Card>

        <Card variant="white" className="p-4">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Calculated DTI
          </span>
          <p className="text-2xl font-extrabold text-[#0F291E] mt-1 font-mono">
            {affordabilityCheck ? `${(affordabilityCheck.calculated_dti * 100).toFixed(1)}%` : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Product Limit: {product ? `${(product.max_dti_threshold * 100).toFixed(0)}%` : '—'}
          </p>
        </Card>

        <Card variant="lime" className="p-4">
          <span className="text-[11px] font-bold text-[#0F291E]/70 uppercase tracking-wider">
            Underwriting Decision
          </span>
          <p className="text-2xl font-extrabold text-[#0F291E] mt-1">
            {decision ? decision.outcome : 'PENDING'}
          </p>
          <p className="text-xs text-[#0F291E]/80 mt-1 truncate">
            {decision ? decision.decision_reason_codes : 'Awaiting review'}
          </p>
        </Card>
      </div>

      {/* Main Grid: Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 cols: Core Dossier */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Applicant & Employment Dossier */}
          <Card variant="white" className="p-6">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <User className="w-5 h-5 text-[#0F291E]" />
              <h3 className="text-base font-bold text-[#0F291E]">Applicant & Employment Verification</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6">
              <div>
                <span className="text-gray-400 font-semibold">Full Legal Name:</span>
                <p className="font-bold text-gray-900 text-sm mt-0.5">
                  {applicant ? `${applicant.first_name} ${applicant.last_name}` : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-400 font-semibold">Applicant ID:</span>
                <p className="font-mono font-bold text-gray-800 text-sm mt-0.5">{application.applicant_id}</p>
              </div>
              <div>
                <span className="text-gray-400 font-semibold">Contact Email:</span>
                <p className="font-medium text-gray-700 mt-0.5">{applicant?.email || '—'}</p>
              </div>
              <div>
                <span className="text-gray-400 font-semibold">Housing Status:</span>
                <p className="font-bold text-gray-800 mt-0.5">{applicant?.housing_status || '—'}</p>
              </div>
            </div>

            {/* Employment details */}
            {employment ? (
              <div className="bg-[#F8FAF6] p-4 rounded-2xl border border-[#E7EBE4]">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-gray-600" />
                  <span className="text-xs font-bold text-[#0F291E]">Verified Employment</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 font-medium">Employer</span>
                    <p className="font-bold text-gray-900 mt-0.5">{employment.employer_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Job Title</span>
                    <p className="font-bold text-gray-900 mt-0.5">{employment.job_title}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Tenure</span>
                    <p className="font-bold text-gray-900 mt-0.5">{employment.tenure_months} months</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Type</span>
                    <p className="font-bold text-gray-900 mt-0.5">{employment.employment_type}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No formal employment record attached.</p>
            )}

            {/* Fair lending compliance callout */}
            <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-2 text-[11px] text-blue-900">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Fair Lending Guardrail:</strong> Demographic protected characteristics (gender, ethnicity) are strictly isolated from underwriting decision engine inputs to maintain regulatory neutrality.
              </span>
            </div>
          </Card>

          {/* Section 2: Verified Income Streams */}
          <Card variant="white" className="p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#0F291E]" />
                <h3 className="text-base font-bold text-[#0F291E]">Verified Income Streams ({incomeRecords.length})</h3>
              </div>
            </div>

            {incomeRecords.length > 0 ? (
              <div className="divide-y divide-gray-100 text-xs">
                {incomeRecords.map((inc) => (
                  <div key={inc.income_id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900">{inc.income_source.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        Method: {inc.verification_method} • Eff: {inc.effective_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-gray-400 text-[10px] block">Gross / Net</span>
                        <span className="font-bold font-mono text-[#0F291E]">
                          {formatCur(inc.gross_monthly_amount)} / {formatCur(inc.net_monthly_amount)}
                        </span>
                      </div>
                      <Badge variant={inc.verification_status === 'VERIFIED' ? 'lime' : 'neutral'} size="sm">
                        {inc.verification_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No income stream records attached.</p>
            )}
          </Card>

          {/* Section 3: Existing Credit Facilities */}
          <Card variant="white" className="p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#0F291E]" />
                <h3 className="text-base font-bold text-[#0F291E]">Existing Credit Facilities ({creditFacilities.length})</h3>
              </div>
            </div>

            {creditFacilities.length > 0 ? (
              <div className="divide-y divide-gray-100 text-xs">
                {creditFacilities.map((fac) => (
                  <div key={fac.facility_id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900">{fac.lender_name} ({fac.facility_type.replace(/_/g, ' ')})</p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        Limit: {formatCur(fac.credit_limit)} • Opened: {fac.opened_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-gray-400 text-[10px] block">Balance / Payment</span>
                        <span className="font-bold font-mono text-[#0F291E]">
                          {formatCur(fac.outstanding_balance)} / {formatCur(fac.monthly_payment)}
                        </span>
                      </div>
                      <Badge variant={fac.facility_status === 'ACTIVE' ? 'lime' : 'neutral'} size="sm">
                        {fac.facility_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No prior credit bureau facilities found.</p>
            )}
          </Card>

          {/* Section 4: Affordability & Cash Flow Analysis */}
          <Card variant="white" className="p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#0F291E]" />
                <h3 className="text-base font-bold text-[#0F291E]">Affordability & Cash Flow Stress Test</h3>
              </div>
              {affordabilityCheck && (
                <Badge
                  variant={affordabilityCheck.affordability_result === 'PASS' ? 'lime' : 'red'}
                  size="sm"
                >
                  Result: {affordabilityCheck.affordability_result}
                </Badge>
              )}
            </div>

            {affordabilityCheck ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-[#F8FAF6] rounded-xl border border-gray-200/80">
                  <span className="text-gray-500 font-medium">Verified Monthly Income</span>
                  <p className="text-base font-extrabold text-[#0F291E] mt-1 font-mono">
                    {formatCur(affordabilityCheck.total_verified_monthly_income)}
                  </p>
                </div>
                <div className="p-3 bg-[#F8FAF6] rounded-xl border border-gray-200/80">
                  <span className="text-gray-500 font-medium">Existing Debt Obligations</span>
                  <p className="text-base font-extrabold text-gray-700 mt-1 font-mono">
                    {formatCur(affordabilityCheck.existing_monthly_debt_obligations)}
                  </p>
                </div>
                <div className="p-3 bg-[#F8FAF6] rounded-xl border border-gray-200/80">
                  <span className="text-gray-500 font-medium">Estimated Living Expenses</span>
                  <p className="text-base font-extrabold text-gray-700 mt-1 font-mono">
                    {formatCur(affordabilityCheck.estimated_living_expenses)}
                  </p>
                </div>
                <div className="p-3 bg-[#F8FAF6] rounded-xl border border-gray-200/80">
                  <span className="text-gray-500 font-medium">Proposed Loan Payment</span>
                  <p className="text-base font-extrabold text-[#0F291E] mt-1 font-mono">
                    {formatCur(affordabilityCheck.proposed_loan_monthly_payment)}
                  </p>
                </div>
                <div className="p-3 bg-[#F8FAF6] rounded-xl border border-gray-200/80">
                  <span className="text-gray-500 font-medium">Calculated Debt-to-Income</span>
                  <p className="text-base font-extrabold text-emerald-800 mt-1 font-mono">
                    {(affordabilityCheck.calculated_dti * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-[#F8FAF6] rounded-xl border border-gray-200/80">
                  <span className="text-gray-500 font-medium">Net Disposable Income</span>
                  <p
                    className={`text-base font-extrabold mt-1 font-mono ${
                      affordabilityCheck.net_disposable_income >= 0 ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {formatCur(affordabilityCheck.net_disposable_income)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No affordability evaluation recorded.</p>
            )}
          </Card>

          {/* Section 3: Repayment Amortization Schedule */}
          {repaymentSchedules.length > 0 && (
            <Card variant="white" className="p-6">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#0F291E]" />
                  <h3 className="text-base font-bold text-[#0F291E]">French Amortization Schedule</h3>
                </div>
                <span className="text-xs text-gray-500 font-mono">
                  {repaymentSchedules.length} Installments
                </span>
              </div>

              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#F8FAF7] border-b border-gray-200 font-bold text-gray-500 uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Due Date</th>
                      <th className="py-2 px-3 text-right">Payment</th>
                      <th className="py-2 px-3 text-right">Principal</th>
                      <th className="py-2 px-3 text-right">Interest</th>
                      <th className="py-2 px-3 text-right">Remaining Balance</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono">
                    {repaymentSchedules.map((row) => (
                      <tr key={row.schedule_id} className="hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-500">{row.installment_number}</td>
                        <td className="py-2 px-3 font-sans text-gray-700">{row.due_date}</td>
                        <td className="py-2 px-3 text-right font-bold text-[#0F291E]">
                          {formatCur(row.payment_amount)}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-600">
                          {formatCur(row.principal_component)}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-600">
                          {formatCur(row.interest_component)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-gray-800">
                          {formatCur(row.remaining_balance)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Right 4 cols: Documents, Decision & Chronological Event Ledger */}
        <div className="lg:col-span-4 space-y-6">
          {/* Decision Card */}
          <Card
            variant={decision?.outcome === 'APPROVED' ? 'lime' : 'forest'}
            className="p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                Decision Audit Log
              </span>
              <span className="text-xs font-mono opacity-80">{decision?.decision_id || 'DEC-PENDING'}</span>
            </div>

            <h3 className="text-2xl font-extrabold tracking-tight mb-2">
              {decision?.outcome || 'UNDER_REVIEW'}
            </h3>

            <div className="space-y-2 text-xs opacity-90 border-t border-current/20 pt-3">
              <div className="flex justify-between">
                <span>Reason Codes:</span>
                <span className="font-bold font-mono">{decision?.decision_reason_codes || 'NONE'}</span>
              </div>
              <div className="flex justify-between">
                <span>Approved Principal:</span>
                <span className="font-bold font-mono">{formatCur(decision?.approved_principal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Approved Term:</span>
                <span className="font-bold">{decision?.approved_term_months || 0} Months</span>
              </div>
              <div className="flex justify-between">
                <span>Interest Rate:</span>
                <span className="font-bold">
                  {decision ? `${(decision.approved_interest_rate * 100).toFixed(2)}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Reviewer Role:</span>
                <span className="font-bold">{decision?.reviewer_role}</span>
              </div>
            </div>
          </Card>

          {/* Documents Card */}
          <Card variant="white" className="p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Evidentiary Documents ({documents.length})
            </h4>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.document_id}
                  className="p-2.5 rounded-xl bg-[#F8FAF7] border border-gray-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-gray-800 text-[11px]">{doc.document_type.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-gray-400 font-mono truncate max-w-[150px]">
                      {doc.document_id}
                    </p>
                  </div>
                  <Badge
                    variant={doc.document_status === 'VERIFIED' ? 'lime' : 'neutral'}
                    size="sm"
                  >
                    {doc.document_status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Chronological Event Timeline */}
          <Card variant="white" className="p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
              Chronological Audit Trail
            </h4>

            <div className="relative pl-4 space-y-4 border-l-2 border-gray-200">
              {events.map((evt) => (
                <div key={evt.event_id} className="relative group">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#B4F04D] border-2 border-[#0F291E]" />
                  <div className="text-xs">
                    <span className="text-[10px] font-bold text-gray-400 font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <p className="font-bold text-gray-900 mt-0.5">
                      {evt.event_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{evt.details}</p>
                    <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">
                      {evt.actor}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { dataService } from '@/services/dataService';
import { LoanDataset, LoanApplication } from '@/types';

interface TableApplication extends LoanApplication {
  decisionOutcome?: string;
  calculatedDti?: number;
  applicantName?: string;
}

export const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState<LoanDataset | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<string>('submission_timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [applications, setApplications] = useState<TableApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let mounted = true;
    dataService.loadDataset().then((data) => {
      if (!mounted) return;
      setDataset(data);
      loadTableData();
    });
    return () => {
      mounted = false;
    };
  }, []);

  const loadTableData = async () => {
    setLoading(true);
    const res = await dataService.getApplications({
      search,
      decision: decisionFilter,
      productId: productFilter,
      status: statusFilter,
      sortBy: sortBy as any,
      sortOrder,
      page,
      pageSize,
    });
    setApplications(res.items);
    setTotal(res.total);
    setTotalPages(res.totalPages);
    setLoading(false);
  };

  useEffect(() => {
    loadTableData();
  }, [search, decisionFilter, productFilter, statusFilter, sortBy, sortOrder, page, pageSize]);

  const resetFilters = () => {
    setSearch('');
    setDecisionFilter('ALL');
    setProductFilter('ALL');
    setStatusFilter('ALL');
    setSortBy('submission_timestamp');
    setSortOrder('desc');
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const formatCur = (num: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#EDF0EB]">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F291E] tracking-tight">
            Originations Application Queue
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Full lifecycle applicant evaluations, deterministic decisioning rules, and affordability checks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="lime" size="sm">
            {total} Applications Found
          </Badge>
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F6F8F5] hover:bg-gray-200 text-gray-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar Card matching reference */}
      <Card variant="white" className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by ID or applicant..."
              className="w-full pl-9 pr-3 py-2 bg-[#F6F8F5] border border-[#E7EBE4] rounded-full text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
            />
          </div>

          {/* Decision Filter */}
          <div>
            <select
              value={decisionFilter}
              onChange={(e) => {
                setDecisionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-[#F6F8F5] border border-[#E7EBE4] rounded-full text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
            >
              <option value="ALL">All Decision Outcomes</option>
              <option value="APPROVED">Approved Only</option>
              <option value="REJECTED">Rejected Only</option>
              <option value="MANUAL_REVIEW">Manual Review Only</option>
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <select
              value={productFilter}
              onChange={(e) => {
                setProductFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-[#F6F8F5] border border-[#E7EBE4] rounded-full text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
            >
              <option value="ALL">All Loan Products</option>
              <option value="PROD-001">PROD-001 (Prime Personal)</option>
              <option value="PROD-002">PROD-002 (Near-Prime Personal)</option>
              <option value="PROD-003">PROD-003 (Micro Business)</option>
              <option value="PROD-004">PROD-004 (SME Expansion)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-[#F6F8F5] border border-[#E7EBE4] rounded-full text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
            >
              <option value="ALL">All Lifecycle Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="DISBURSED">DISBURSED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="MANUAL_REVIEW">MANUAL_REVIEW</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Applications Table Card */}
      <Card variant="white" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAF7] border-b border-[#EDF0EB] text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th
                  onClick={() => handleSort('application_id')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#0F291E]"
                >
                  <div className="flex items-center gap-1">
                    <span>Application ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Applicant</th>
                <th className="py-3.5 px-4">Product</th>
                <th
                  onClick={() => handleSort('requested_principal')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#0F291E] text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Requested</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">Term</th>
                <th
                  onClick={() => handleSort('credit_score')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#0F291E] text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Credit Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('dti')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#0F291E] text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>DTI</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('decisionOutcome')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#0F291E] text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Decision</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('submission_timestamp')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#0F291E]"
                >
                  <div className="flex items-center gap-1">
                    <span>Submitted</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF0EB]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400 font-semibold">
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400 font-semibold">
                    No loan applications match your filter criteria.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app.application_id}
                    onClick={() => navigate(`/applications/${app.application_id}`)}
                    className="hover:bg-[#F9FAF7] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0F291E]">
                      {app.application_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-gray-900">{app.applicantName || 'Applicant'}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{app.applicant_id}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-gray-700 bg-[#F2F4F1] px-2 py-0.5 rounded-md">
                        {app.product_id}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#0F291E] font-mono">
                      {formatCur(app.requested_principal)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-gray-600">
                      {app.requested_term_months} mo
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                          app.credit_score >= 720
                            ? 'bg-emerald-50 text-emerald-700'
                            : app.credit_score >= 640
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {app.credit_score}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-gray-700">
                      {typeof app.calculatedDti === 'number'
                        ? `${(app.calculatedDti * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {app.decisionOutcome === 'APPROVED' ? (
                        <Badge variant="lime" size="sm">
                          Approved
                        </Badge>
                      ) : app.decisionOutcome === 'REJECTED' ? (
                        <Badge variant="red" size="sm">
                          Rejected
                        </Badge>
                      ) : app.decisionOutcome === 'MANUAL_REVIEW' ? (
                        <Badge variant="amber" size="sm">
                          Manual Review
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          {app.application_status}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                      {new Date(app.submission_timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/applications/${app.application_id}`);
                        }}
                        className="p-1.5 rounded-full hover:bg-[#B4F04D] text-[#0F291E] transition-colors"
                        title="View Application Details"
                      >
                        <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="p-4 bg-[#F8FAF7] border-t border-[#EDF0EB] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-gray-500 font-medium">
            <span>
              Showing {total > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(page * pageSize, total)} of {total} applications
            </span>
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#84CC16]"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="px-3 py-1.5 rounded-full bg-white border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <span className="font-bold text-gray-700 px-2">
              Page {page} of {Math.max(totalPages, 1)}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="px-3 py-1.5 rounded-full bg-white border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

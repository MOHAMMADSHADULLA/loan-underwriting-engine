import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserCheck, CreditCard, Briefcase, Mail, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { dataService } from '@/services/dataService';
import { LoanDataset, Applicant, Employment, CreditFacility, LoanApplication } from '@/types';

interface EnrichedApplicant extends Applicant {
  employment?: Employment;
  facilitiesCount: number;
  totalDebt: number;
  applicationsCount: number;
}

export const ApplicantsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState<LoanDataset | null>(null);
  const [search, setSearch] = useState('');
  const [housingFilter, setHousingFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

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
          <p className="text-sm font-semibold text-gray-500">Loading Applicant Directory...</p>
        </div>
      </div>
    );
  }

  // Pre-calculate relationships
  const enriched: EnrichedApplicant[] = dataset.applicants.map((app) => {
    const emp = dataset.employments.find((e) => e.applicant_id === app.applicant_id);
    const facs = dataset.credit_facilities.filter((c) => c.applicant_id === app.applicant_id);
    const loans = dataset.loan_applications.filter((l) => l.applicant_id === app.applicant_id);
    const totalDebt = facs.reduce((sum, f) => sum + (f.outstanding_balance || 0), 0);

    return {
      ...app,
      employment: emp,
      facilitiesCount: facs.length,
      totalDebt,
      applicationsCount: loans.length,
    };
  });

  let filtered = enriched;
  if (search) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (a) =>
        a.applicant_id.toLowerCase().includes(q) ||
        `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q)
    );
  }
  if (housingFilter !== 'ALL') {
    filtered = filtered.filter((a) => a.housing_status === housingFilter);
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const formatCur = (num: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#EDF0EB]">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F291E] tracking-tight">
            Applicant Directory & KYC Dossiers
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Verified borrower profiles, housing classifications, and active credit facilities
          </p>
        </div>
        <Badge variant="lime" size="sm">
          {total} Borrowers Registered
        </Badge>
      </div>

      {/* Filter Toolbar */}
      <Card variant="white" className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by applicant name, ID, or email..."
              className="w-full pl-9 pr-3 py-2 bg-[#F6F8F5] border border-[#E7EBE4] rounded-full text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
            />
          </div>

          <div>
            <select
              value={housingFilter}
              onChange={(e) => {
                setHousingFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-[#F6F8F5] border border-[#E7EBE4] rounded-full text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
            >
              <option value="ALL">All Housing Statuses</option>
              <option value="OWN">OWN</option>
              <option value="RENT">RENT</option>
              <option value="MORTGAGE">MORTGAGE</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card variant="white" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAF7] border-b border-[#EDF0EB] text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Applicant ID</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Housing</th>
                <th className="py-3.5 px-4">Current Employer</th>
                <th className="py-3.5 px-4 text-center">Facilities</th>
                <th className="py-3.5 px-4 text-right">Total Debt</th>
                <th className="py-3.5 px-4 text-center">Applications</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF0EB]">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 font-semibold">
                    No applicants found.
                  </td>
                </tr>
              ) : (
                paginated.map((app) => (
                  <tr key={app.applicant_id} className="hover:bg-[#F9FAF7] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0F291E]">
                      {app.applicant_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#F2F4F1] flex items-center justify-center font-bold text-xs text-[#0F291E]">
                          {app.first_name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900">
                          {app.first_name} {app.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                      <div>{app.email}</div>
                      <div className="text-[10px] text-gray-400">{app.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-[#F2F4F1] px-2 py-0.5 rounded-full text-xs font-semibold text-gray-700">
                        {app.housing_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {app.employment ? (
                        <div>
                          <p className="font-bold text-gray-900">{app.employment.employer_name}</p>
                          <p className="text-[10px] text-gray-400">{app.employment.job_title}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-gray-700">
                      {app.facilitiesCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F291E]">
                      {formatCur(app.totalDebt)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-xs bg-[#B4F04D]/30 text-[#0F291E] px-2 py-0.5 rounded-full">
                        {app.applicationsCount}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="p-4 bg-[#F8FAF7] border-t border-[#EDF0EB] flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">
            Showing {total > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, total)} of {total} applicants
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="px-3 py-1.5 rounded-full bg-white border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-gray-700 px-2">
              Page {page} of {Math.max(totalPages, 1)}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="px-3 py-1.5 rounded-full bg-white border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

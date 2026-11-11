import React, { useEffect, useState } from 'react';
import { Database, Search, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { dataService } from '@/services/dataService';
import { LoanDataset } from '@/types';

type EntityKey = keyof Omit<LoanDataset, 'validation_report'>;

export const DataExplorerPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState<LoanDataset | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<EntityKey>('loan_applications');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

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
          <p className="text-sm font-semibold text-gray-500">Loading Relational Data Explorer...</p>
        </div>
      </div>
    );
  }

  const entities: { key: EntityKey; label: string; count: number }[] = [
    { key: 'loan_applications', label: 'Loan Applications', count: dataset.loan_applications.length },
    { key: 'applicants', label: 'Applicants', count: dataset.applicants.length },
    { key: 'employments', label: 'Employments', count: dataset.employments.length },
    { key: 'income_records', label: 'Income Records', count: dataset.income_records.length },
    { key: 'credit_facilities', label: 'Credit Facilities', count: dataset.credit_facilities.length },
    { key: 'loan_products', label: 'Loan Products', count: dataset.loan_products.length },
    { key: 'documents', label: 'Documents', count: dataset.documents.length },
    { key: 'affordability_checks', label: 'Affordability Checks', count: dataset.affordability_checks.length },
    { key: 'decisions', label: 'Decisions', count: dataset.decisions.length },
    { key: 'repayment_schedules', label: 'Repayment Schedules', count: dataset.repayment_schedules.length },
    { key: 'application_events', label: 'Application Events', count: dataset.application_events.length },
    { key: 'ground_truth', label: 'Ground Truth (Evaluation)', count: dataset.ground_truth.length },
  ];

  const rawList: any[] = dataset[selectedEntity] || [];

  // Filter by generic string search
  let filtered = rawList;
  if (search) {
    const q = search.toLowerCase().trim();
    filtered = rawList.filter((item) =>
      Object.values(item).some((val) =>
        String(val ?? '').toLowerCase().includes(q)
      )
    );
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const columns = rawList.length > 0 ? Object.keys(rawList[0]) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#EDF0EB]">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F291E] tracking-tight">
            Relational Data Explorer
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Inspect raw relational table records, foreign keys, and underlying schema structures
          </p>
        </div>
        <Badge variant="lime" size="sm">
          12 Core Relational Tables
        </Badge>
      </div>

      {/* Warning when viewing ground truth */}
      {selectedEntity === 'ground_truth' && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>Ground Truth Isolation:</strong> Ground-truth labels are isolated from the underwriting decision engine and validator inputs. They are displayed here solely for audit evaluation and verification.
          </span>
        </div>
      )}

      {/* Entity Pill Selector matching reference design */}
      <div className="flex flex-wrap gap-2">
        {entities.map((e) => (
          <button
            key={e.key}
            type="button"
            onClick={() => {
              setSelectedEntity(e.key);
              setSearch('');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
              selectedEntity === e.key
                ? 'bg-[#0F291E] text-[#B4F04D] shadow-sm'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <span>{e.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedEntity === e.key ? 'bg-[#183B2C] text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {e.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <Card variant="white" className="p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={`Search records in ${selectedEntity}...`}
            className="w-full pl-9 pr-3 py-2 bg-[#F6F8F5] border border-[#E7EBE4] rounded-full text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
          />
        </div>
      </Card>

      {/* Raw Table Card */}
      <Card variant="white" className="p-0 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-[#F8FAF7] border-b border-[#EDF0EB] text-gray-500 font-bold uppercase text-[10px] tracking-wider z-10">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="py-3 px-4 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF0EB] font-mono">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length || 1} className="py-12 text-center text-gray-400 font-semibold font-sans">
                    No matching records in {selectedEntity}.
                  </td>
                </tr>
              ) : (
                paginated.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#F9FAF7] transition-colors">
                    {columns.map((col) => {
                      const val = row[col];
                      let display = val === null || val === undefined ? '—' : String(val);
                      if (typeof val === 'boolean') display = val ? 'true' : 'false';
                      return (
                        <td key={col} className="py-2.5 px-4 whitespace-nowrap text-gray-700">
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="p-4 bg-[#F8FAF7] border-t border-[#EDF0EB] flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium font-sans">
            Showing {total > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, total)} of {total} rows
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
            <span className="font-bold text-gray-700 px-2 font-sans">
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

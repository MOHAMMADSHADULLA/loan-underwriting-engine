import React, { useEffect, useState } from 'react';
import { Package, Percent, Calendar, ShieldCheck, ArrowUpRight, DollarSign, Users } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { dataService } from '@/services/dataService';
import { LoanDataset, LoanProduct } from '@/types';

export const LoanProductsPage: React.FC = () => {
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
          <p className="text-sm font-semibold text-gray-500">Loading Product Catalog...</p>
        </div>
      </div>
    );
  }

  const formatCur = (num: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#EDF0EB]">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F291E] tracking-tight">
            Loan Product Catalog & Policy Thresholds
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Credit limits, allowable borrowing terms, base interest rates, and automated DTI caps
          </p>
        </div>
        <Badge variant="lime" size="sm">
          4 Active Credit Facilities
        </Badge>
      </div>

      {/* 4 Products Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dataset.loan_products.map((prod, idx) => {
          // Calculate product specific stats from dataset
          const apps = dataset.loan_applications.filter((a) => a.product_id === prod.product_id);
          const totalRequested = apps.reduce((sum, a) => sum + (a.requested_principal || 0), 0);
          const approved = apps.filter((a) => {
            const dec = dataset.decisions.find((d) => d.application_id === a.application_id);
            return dec?.outcome === 'APPROVED';
          });
          const approvalRate = apps.length > 0 ? (approved.length / apps.length) * 100 : 0;

          return (
            <Card
              key={prod.product_id}
              variant={idx === 0 ? 'white' : 'white'}
              className="p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-[#0F291E] text-[#B4F04D]">
                    {prod.product_id}
                  </span>
                  <Badge variant="lime" size="sm">
                    Active Facility
                  </Badge>
                </div>

                <h3 className="text-xl font-extrabold text-[#0F291E] tracking-tight mb-2">
                  {prod.product_name}
                </h3>

                {/* Main Specs Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs my-4 p-4 bg-[#F8FAF6] rounded-2xl border border-[#E7EBE4]">
                  <div>
                    <span className="text-gray-400 font-medium">Principal Bounds</span>
                    <p className="font-mono font-bold text-gray-900 mt-0.5">
                      {formatCur(prod.min_principal)} – {formatCur(prod.max_principal)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Allowable Term</span>
                    <p className="font-mono font-bold text-gray-900 mt-0.5">
                      {prod.min_term_months} to {prod.max_term_months} Months
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Base APR</span>
                    <p className="font-mono font-extrabold text-emerald-800 mt-0.5">
                      {(prod.base_interest_rate * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Max DTI Threshold</span>
                    <p className="font-mono font-extrabold text-[#0F291E] mt-0.5">
                      {(prod.max_dti_threshold * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Min Credit Score</span>
                    <p className="font-mono font-bold text-gray-900 mt-0.5">
                      {prod.min_credit_score}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Risk Appetite</span>
                    <p className="font-bold text-gray-900 mt-0.5">
                      {prod.product_id === 'PROD-001'
                        ? 'Low (Prime)'
                        : prod.product_id === 'PROD-002'
                        ? 'Medium (Near-Prime)'
                        : prod.product_id === 'PROD-003'
                        ? 'Commercial Micro'
                        : 'Commercial SME'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Portfolio Performance stats for this product */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-400 font-medium">Volume Received</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">
                    {apps.length} Loans ({formatCur(totalRequested)})
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 font-medium">Approval Rate</span>
                  <p className="font-extrabold text-emerald-700 text-sm mt-0.5">
                    {approvalRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

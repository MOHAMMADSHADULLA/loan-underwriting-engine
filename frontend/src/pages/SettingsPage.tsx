import React from 'react';
import { Sliders, Sparkles, Database, Palette, ShieldCheck, Check } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

interface SettingsPageProps {
  scale: 'starter' | 'full';
  onScaleChange: (scale: 'starter' | 'full') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ scale, onScaleChange }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#EDF0EB]">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F291E] tracking-tight">
            System & Engine Settings
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Dataset scale, reproducibility seed parameters, architecture stack, and design tokens
          </p>
        </div>
        <Badge variant="lime" size="sm">
          v1.0.0 Production
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dataset Scale Settings */}
        <Card variant="white" className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <Database className="w-5 h-5 text-[#0F291E]" />
            <h3 className="text-base font-bold text-[#0F291E]">Dataset Scale Configuration</h3>
          </div>

          <p className="text-xs text-gray-600 mb-4 leading-relaxed">
            Select the active dataset scale loaded by the frontend. Both datasets were generated deterministically using seed <code>20261022</code>.
          </p>

          <div className="space-y-3">
            <div
              onClick={() => onScaleChange('starter')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                scale === 'starter'
                  ? 'bg-[#B4F04D]/15 border-[#84CC16] shadow-sm'
                  : 'bg-[#F8FAF7] border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#0F291E]">Starter Scale (Default)</span>
                    <Badge variant="lime" size="sm">Fast</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    100 Applicants • 60 Applications • 4 Products • Instant client-side loading
                  </p>
                </div>
                {scale === 'starter' && (
                  <span className="w-6 h-6 rounded-full bg-[#B4F04D] text-[#0F291E] flex items-center justify-center font-bold text-xs">
                    ✓
                  </span>
                )}
              </div>
            </div>

            <div
              onClick={() => onScaleChange('full')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                scale === 'full'
                  ? 'bg-[#0F291E]/10 border-[#0F291E] shadow-sm'
                  : 'bg-[#F8FAF7] border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#0F291E]">Full Scale Portfolio</span>
                    <Badge variant="forest" size="sm">Comprehensive</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    10,000 Applicants • 6,000 Applications • 24,000 Documents • Full enterprise volume
                  </p>
                </div>
                {scale === 'full' && (
                  <span className="w-6 h-6 rounded-full bg-[#0F291E] text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Reproducibility & Architecture Parameters */}
        <Card variant="white" className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <Sparkles className="w-5 h-5 text-[#0F291E]" />
            <h3 className="text-base font-bold text-[#0F291E]">Engine Parameters</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#F8FAF7] rounded-xl flex justify-between items-center">
              <span className="text-gray-500 font-medium">Deterministic Seed</span>
              <span className="font-mono font-bold text-[#0F291E] bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                20261022
              </span>
            </div>
            <div className="p-3 bg-[#F8FAF7] rounded-xl flex justify-between items-center">
              <span className="text-gray-500 font-medium">Target Reference Period</span>
              <span className="font-bold text-gray-800">CY 2026 Originations</span>
            </div>
            <div className="p-3 bg-[#F8FAF7] rounded-xl flex justify-between items-center">
              <span className="text-gray-500 font-medium">Underwriting Policy</span>
              <span className="font-bold text-emerald-800">DTI & NDI Multi-Factor Rules</span>
            </div>
            <div className="p-3 bg-[#F8FAF7] rounded-xl flex justify-between items-center">
              <span className="text-gray-500 font-medium">Amortization Convention</span>
              <span className="font-bold text-gray-800">French Amortization with Penny Rounding</span>
            </div>
            <div className="p-3 bg-[#F8FAF7] rounded-xl flex justify-between items-center">
              <span className="text-gray-500 font-medium">Fair Lending Compliance</span>
              <span className="font-bold text-emerald-800">Architectural Attribute Isolation</span>
            </div>
          </div>
        </Card>

        {/* UI Theme & Design Tokens */}
        <Card variant="white" className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <Palette className="w-5 h-5 text-[#0F291E]" />
            <h3 className="text-base font-bold text-[#0F291E]">UI Design System Tokens (From User Reference)</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-2xl bg-[#B4F04D] text-[#0F291E] font-bold">
              <p className="text-sm">Primary Lime</p>
              <p className="font-mono text-[11px] opacity-80">#B4F04D</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#0F291E] text-white font-bold">
              <p className="text-sm">Dark Forest</p>
              <p className="font-mono text-[11px] opacity-80">#0F291E</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#ECEEEB] text-[#0F291E] font-bold border border-gray-300">
              <p className="text-sm">Canvas Neutral</p>
              <p className="font-mono text-[11px] opacity-80">#ECEEEB</p>
            </div>
            <div className="p-3 rounded-2xl bg-white text-[#0F291E] font-bold border border-gray-200 shadow-sm">
              <p className="text-sm">Card Surface</p>
              <p className="font-mono text-[11px] opacity-80">#FFFFFF</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

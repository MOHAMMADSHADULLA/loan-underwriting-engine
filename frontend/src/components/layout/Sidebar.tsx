import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart3,
  ShieldCheck,
  Database,
  Sliders,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  scale: 'starter' | 'full';
  onScaleChange: (scale: 'starter' | 'full') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  scale,
  onScaleChange,
}) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/applications', label: 'Applications', icon: FileText },
    { to: '/applicants', label: 'Applicants', icon: Users },
    { to: '/products', label: 'Loan Products', icon: Package },
    { to: '/analytics', label: 'Underwriting Analytics', icon: BarChart3 },
    { to: '/validation', label: 'Validation Center', icon: ShieldCheck, badge: '5 Rules' },
    { to: '/explorer', label: 'Data Explorer', icon: Database },
    { to: '/settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-[#E7EBE4] p-6 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0F291E] flex items-center justify-center text-[#B4F04D] font-bold text-xl shadow-soft">
                Y
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-[#0F291E]">
                    YottaFlex<span className="text-[#84CC16]">.ai</span>
                  </span>
                </div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  Underwriting Engine
                </p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-[#84CC16] animate-pulse" title="System Live" />
          </div>

          {/* Dataset Scale Selector Switch */}
          <div className="mb-6 p-2 bg-[#F6F8F5] rounded-2xl border border-[#E7EBE4]">
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Dataset Scale
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white text-[#0F291E] font-medium border border-gray-200">
                {scale === 'starter' ? '60 Apps' : '6,000 Apps'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl border border-gray-200/80">
              <button
                type="button"
                onClick={() => onScaleChange('starter')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  scale === 'starter'
                    ? 'bg-[#B4F04D] text-[#0F291E] shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Starter Scale
              </button>
              <button
                type="button"
                onClick={() => onScaleChange('full')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  scale === 'full'
                    ? 'bg-[#0F291E] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Full Scale
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#B4F04D] text-[#0F291E] shadow-sm'
                        : 'text-gray-600 hover:bg-[#F4F6F2] hover:text-[#0F291E]'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0F291E] text-[#B4F04D]">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Banner Card */}
        <div className="mt-6 pt-4 border-t border-[#EEF1EB]">
          <div className="bg-[#0F291E] text-white p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B4F04D] text-[#0F291E]">
                <Sparkles className="w-3 h-3" />
                Seed 20261022
              </span>
              <ArrowUpRight className="w-4 h-4 text-[#B4F04D]" />
            </div>
            <h4 className="text-xs font-bold text-white mb-0.5">Bitwise Deterministic</h4>
            <p className="text-[11px] text-gray-300 leading-tight">
              100% reproducible synthetic underwriting portfolio
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

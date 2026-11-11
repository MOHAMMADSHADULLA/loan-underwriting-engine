import React from 'react';
import { Menu, Search, Bell, Sparkles } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
  scale: 'starter' | 'full';
  title?: string;
  subtitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onMenuClick,
  scale,
  title = 'Hello, Underwriting Team',
  subtitle = 'Originations Portfolio 2026',
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#E7EBE4] px-6 py-4 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + User Greeting */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            {/* Avatar matching reference */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0F291E] to-[#1E4D38] p-0.5 shadow-sm hidden sm:block">
              <div className="w-full h-full rounded-full bg-[#ECEEEB] flex items-center justify-center text-xs font-bold text-[#0F291E]">
                YF
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#0F291E] tracking-tight">{title}</h1>
              <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Center: Search pill */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications, applicants, rules..."
              className="w-full pl-10 pr-4 py-2 bg-[#F6F8F5] border border-[#E7EBE4] rounded-full text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#84CC16] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Right: Quick actions & notification */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Scale pill badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F6F8F5] text-[#0F291E] border border-[#E7EBE4]">
            <span className="w-2 h-2 rounded-full bg-[#84CC16]"></span>
            <span>{scale === 'starter' ? 'Starter Dataset (60)' : 'Full Dataset (6,000)'}</span>
          </div>

          {/* Seed indicator */}
          <div className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#B4F04D]/30 text-[#0F291E] border border-[#9AE630]/50">
            <Sparkles className="w-3.5 h-3.5 text-[#84CC16]" />
            <span>Seed 20261022</span>
          </div>

          {/* Notification bell pill matching the reference with badge 24 */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F6F8F5] hover:bg-[#EDF0EB] text-gray-700 font-semibold text-xs border border-[#E7EBE4] transition-colors"
            title="5 Synthetic Validation Anomalies Monitored"
          >
            <Bell className="w-4 h-4 text-gray-600" />
            <span className="text-[11px] font-bold text-[#0F291E]">5</span>
          </button>
        </div>
      </div>
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Info, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { dataService } from '@/services/dataService';

interface LayoutProps {
  scale: 'starter' | 'full';
  onScaleChange: (scale: 'starter' | 'full') => void;
}

export const Layout: React.FC<LayoutProps> = ({ scale, onScaleChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(dataService.getFullScaleNotice());

  useEffect(() => {
    const unsubscribe = dataService.onNoticeChange((newNotice) => {
      setNotice(newNotice);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#ECEEEB] text-gray-900 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        scale={scale}
        onScaleChange={onScaleChange}
      />

      {/* Main Container */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          scale={scale}
        />

        {/* Outer Canvas padding matching reference design container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {/* Professional Full Scale Availability Banner */}
          {notice && (
            <div className="mb-6 p-4 rounded-2xl bg-[#0F291E] text-white border border-[#B4F04D]/30 shadow-md flex items-start justify-between gap-4 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#B4F04D]/20 text-[#B4F04D] flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-[#B4F04D]">Full Scale Dataset Notice</p>
                  <p className="text-xs text-gray-200 mt-1 leading-relaxed">
                    {notice}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dataService.clearFullScaleNotice()}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Main White App Surface Container with rounded-3xl and soft shadow */}
          <div className="bg-white rounded-[32px] p-4 sm:p-6 lg:p-8 border border-[#E5E9E2] shadow-sm min-h-[calc(100vh-140px)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

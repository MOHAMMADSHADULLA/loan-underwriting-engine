import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

interface LayoutProps {
  scale: 'starter' | 'full';
  onScaleChange: (scale: 'starter' | 'full') => void;
}

export const Layout: React.FC<LayoutProps> = ({ scale, onScaleChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          {/* Main White App Surface Container with rounded-3xl and soft shadow */}
          <div className="bg-white rounded-[32px] p-4 sm:p-6 lg:p-8 border border-[#E5E9E2] shadow-sm min-h-[calc(100vh-140px)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

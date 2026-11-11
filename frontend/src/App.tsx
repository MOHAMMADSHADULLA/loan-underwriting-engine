import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { ApplicationDetailPage } from '@/pages/ApplicationDetailPage';
import { ApplicantsPage } from '@/pages/ApplicantsPage';
import { LoanProductsPage } from '@/pages/LoanProductsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { ValidationPage } from '@/pages/ValidationPage';
import { DataExplorerPage } from '@/pages/DataExplorerPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { dataService } from '@/services/dataService';

export const App: React.FC = () => {
  const [scale, setScale] = useState<'starter' | 'full'>(dataService.getScale());

  const handleScaleChange = async (newScale: 'starter' | 'full') => {
    if (newScale === 'full') {
      const isAvailable = await dataService.isFullScaleAvailable();
      if (!isAvailable) {
        dataService.setFullScaleNotice(
          'Full Scale dataset (~75 MB) is excluded from cloud deployment to optimize static delivery. The dashboard has defaulted to Starter Scale (60 loans). To inspect Full Scale locally, run "python -m src.cli generate --scale full" and "npm run prepare-data".'
        );
        dataService.setScale('starter');
        setScale('starter');
        return;
      }
    }
    dataService.setScale(newScale);
    setScale(newScale);
    window.location.reload();
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout scale={scale} onScaleChange={handleScaleChange} />}>
          <Route index element={<DashboardPage />} />
          <Route path="overview" element={<Navigate to="/" replace />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="applications/:id" element={<ApplicationDetailPage />} />
          <Route path="applicants" element={<ApplicantsPage />} />
          <Route path="products" element={<LoanProductsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="validation" element={<ValidationPage />} />
          <Route path="explorer" element={<DataExplorerPage />} />
          <Route
            path="settings"
            element={<SettingsPage scale={scale} onScaleChange={handleScaleChange} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ColorModeProvider } from './app/ColorMode';
import { AuthProvider } from './features/auth/AuthContext';
import { WalletProvider } from './features/wallet/WalletProvider';
import AppShell from './layout/AppShell';
import EventsPage from './features/events/EventsPage';
import MyTicketsPage from './features/tickets/MyTicketsPage';
import DashboardPage from './features/dashboard/DashboardPage';
import ScannerPage from './features/scanner/ScannerPage';

const App: React.FC = () => (
  <ColorModeProvider>
    <AuthProvider>
      <WalletProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/events" replace />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="tickets" element={<MyTicketsPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="scanner" element={<ScannerPage />} />
              <Route path="*" element={<Navigate to="/events" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </AuthProvider>
  </ColorModeProvider>
);

export default App;

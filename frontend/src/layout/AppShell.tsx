import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';
import TopBar from './TopBar';

const AppShell: React.FC = () => (
  <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', color: 'text.primary' }}>
    <TopBar />
    <Container component="main" maxWidth="lg" sx={{ flexGrow: 1, py: 5 }}>
      <Outlet />
    </Container>
    <Box component="footer" sx={{ py: 3, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} Progressive Music Philippines · Blockchain-based Digital Ticketing and Event Management System
      </Typography>
    </Box>
  </Box>
);

export default AppShell;

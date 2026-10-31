import React from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import { useAuth } from '../features/auth/AuthContext';
import { canScanTickets, canViewDashboard } from '../lib/roles';

const NavLinks: React.FC = () => {
  const { user } = useAuth();

  const links = [
    { to: '/events', label: 'Events', visible: true },
    { to: '/tickets', label: 'My tickets', visible: true },
    { to: '/dashboard', label: 'Dashboard', visible: canViewDashboard(user?.role) },
    { to: '/scanner', label: 'Scanner', visible: canScanTickets(user?.role) },
  ].filter((link) => link.visible);

  return (
    <Box component="nav" aria-label="Main navigation" sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
      {links.map((link) => (
        <Button
          key={link.to}
          component={NavLink}
          to={link.to}
          color="inherit"
          sx={{ borderRadius: 999, px: 2, '&.active': { bgcolor: 'action.selected', color: 'secondary.main' } }}
        >
          {link.label}
        </Button>
      ))}
    </Box>
  );
};

export default NavLinks;

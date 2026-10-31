import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { alpha, AppBar, Box, Button, Chip, IconButton, Toolbar, Tooltip, Typography, useTheme } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NavLinks from './NavLinks';
import { useColorMode } from '../app/ColorMode';
import { useAuth } from '../features/auth/AuthContext';
import LoginRegisterModal from '../features/auth/LoginRegisterModal';
import { useWallet } from '../features/wallet/WalletProvider';
import NotificationBell from '../features/notifications/NotificationBell';
import { formatEth, shortAddress } from '../lib/format';

const TopBar: React.FC = () => {
  const theme = useTheme();
  const { mode, toggle } = useColorMode();
  const { user, isAuthenticated, logout } = useAuth();
  const wallet = useWallet();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        backdropFilter: 'blur(10px)',
        bgcolor: alpha(theme.palette.background.default, 0.88),
      }}
    >
      <Toolbar sx={{ gap: 2, flexWrap: 'wrap', py: 1 }}>
        <Box
          component={RouterLink}
          to="/events"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'inherit', textDecoration: 'none' }}
        >
          <MusicNoteIcon color="secondary" />
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            Progressive Music Philippines
          </Typography>
        </Box>

        <NavLinks />
        <Box sx={{ flexGrow: 1 }} />

        {wallet.isConnected ? (
          <Chip
            icon={<AccountBalanceWalletIcon />}
            variant="outlined"
            label={`${shortAddress(wallet.account)} · ${formatEth(wallet.balance)}${wallet.isOrganizer ? ' · owner' : ''}`}
          />
        ) : (
          <Button
            variant="outlined"
            startIcon={<AccountBalanceWalletIcon />}
            onClick={wallet.connect}
            disabled={wallet.connecting}
          >
            Connect wallet
          </Button>
        )}

        {isAuthenticated ? (
          <>
            <NotificationBell />
            <Chip size="small" label={`${user?.email ?? 'Signed in'} · ${user?.role ?? ''}`} />
            <Button size="small" variant="outlined" onClick={logout}>
              Log out
            </Button>
          </>
        ) : (
          <Button variant="contained" color="secondary" onClick={() => setLoginOpen(true)}>
            Log in / Register
          </Button>
        )}

        <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          <IconButton onClick={toggle} aria-label="Toggle color mode">
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
      </Toolbar>
      <LoginRegisterModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </AppBar>
  );
};

export default TopBar;

import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from './app/theme';

export interface FakeAuth {
  user: { id: string; email: string; full_name: string; role: string } | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: ReturnType<typeof vi.fn>;
  register: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
}

export function fakeAuth(role: string | null): FakeAuth {
  return {
    user: role ? { id: 'u1', email: `${role}@example.com`, full_name: 'Test User', role } : null,
    accessToken: role ? 'token-123' : null,
    isAuthenticated: !!role,
    loading: false,
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
  };
}

/** Renders inside the theme and a router, the two things every screen needs. */
export function renderScreen(ui: React.ReactElement, route = '/') {
  return render(
    <ThemeProvider theme={createAppTheme('light')}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </ThemeProvider>
  );
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

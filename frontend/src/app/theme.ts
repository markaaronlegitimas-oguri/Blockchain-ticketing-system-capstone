import { createTheme, Theme } from '@mui/material/styles';

export type ColorMode = 'light' | 'dark';

const brand = {
  night: '#12132a',
  nightRaised: '#1b1d3a',
  paper: '#f6f4ef',
  pink: '#ff4d8d',
  pinkDeep: '#d6004f',
  indigo: '#7c8cff',
  indigoDeep: '#3b45c4',
};

export function createAppTheme(mode: ColorMode): Theme {
  const dark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: dark ? brand.indigo : brand.indigoDeep },
      secondary: { main: dark ? brand.pink : brand.pinkDeep },
      background: {
        default: dark ? brand.night : brand.paper,
        paper: dark ? brand.nightRaised : '#ffffff',
      },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: '"Helvetica Neue", Helvetica, Arial, system-ui, sans-serif',
      h4: { fontWeight: 800, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: ({ theme }) => ({ border: `1px solid ${theme.palette.divider}`, backgroundImage: 'none' }),
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiButton: { defaultProps: { disableElevation: true } },
    },
  });
}

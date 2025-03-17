import { memo } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ErrorAlert from './components/ErrorAlert';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Memoized routes component to prevent unnecessary re-renders
const AppRoutes = memo(() => (
  <Routes>
    <Route path="/" element={<HomePage />} />
  </Routes>
));

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <Router>
          <Header />
          <ErrorAlert />
          <AppRoutes />
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
};

export default memo(App);

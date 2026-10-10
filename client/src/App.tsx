import type {} from '@mui/x-data-grid/themeAugmentation';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Sidebar from './components/Sidebar';
import TopStatusBar from './components/TopStatusBar';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Inventory from './pages/Inventory';
import CheckoutWizard from './pages/CheckoutWizard';
import Operations from './pages/Operations';
import Parameters from './pages/Parameters';
import SqliteStudio from './pages/SqliteStudio';
import Staff from './pages/Staff';
import FirebirdSync from './pages/FirebirdSync';
import OperationsAnalytics from './pages/OperationsAnalytics';
import Scheduling from './pages/Scheduling';
import StaffPayouts from './pages/StaffPayouts';
import DaemonTestDataManager from './pages/DaemonTestDataManager';
import UserGuide from './pages/UserGuide';
import ServicesBiAnalytics from './pages/ServicesBiAnalytics';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0F3C64', // Deep Navy Blue
      light: '#235A8C',
      dark: '#082540',
    },
    secondary: {
      main: '#156C9C', // Lighter Blue
      light: '#2D8BC0',
      dark: '#0E4E73',
    },
    background: {
      default: '#F4F7FA', // Very soft modern grey-blue background
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A2027',
      secondary: '#4A5568',
    }
  },
  shape: {
    borderRadius: 12, // Modern rounded corners
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 700, letterSpacing: '-0.5px' },
    h4: { fontWeight: 600, letterSpacing: '-0.5px', color: '#0F3C64' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 }, // No uppercase on buttons
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          padding: '8px 24px',
          boxShadow: '0 4px 14px 0 rgba(15, 60, 100, 0.15)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 6px 20px 0 rgba(15, 60, 100, 0.25)',
            transform: 'translateY(-1px)',
          }
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.04)', // Ultra soft shadow
          border: '1px solid rgba(226, 232, 240, 0.8)', // Subtle border
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(226, 232, 240, 1)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
        }
      }
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          margin: '4px 8px',
          padding: '8px 16px',
          width: 'calc(100% - 16px)',
          transition: 'background-color 0.2s',
          '&:hover': {
            backgroundColor: 'rgba(15, 60, 100, 0.04)',
          }
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: '#0F3C64', // Deep Navy for text in menus
          fontWeight: 500,
          '&:hover': {
            backgroundColor: 'rgba(15, 60, 100, 0.08)',
          }
        }
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.1) !important', // Stronger shadow to pop from background
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
        }
      }
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#E8F0F8', // Soft light blue-gray
            color: '#0F3C64', // Deep Navy Blue
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
          },
          '& .MuiDataGrid-columnSeparator': {
            color: 'rgba(15, 60, 100, 0.2)',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #E2E8F0',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'rgba(21, 108, 156, 0.04)',
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#F4F7FA',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
          },
          '& .MuiIconButton-root[aria-label="Menu"]': {
            color: '#0F3C64',
          },
          '& .MuiDataGrid-sortIcon': {
            color: '#0F3C64',
          },
          '& .MuiDataGrid-filterIcon': {
            color: '#0F3C64',
          },
          '& .MuiDataGrid-iconButtonContainer .MuiIconButton-root': {
            color: '#0F3C64',
          }
        }
      }
    }
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F4F7FA' }}>
          <Sidebar />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              overflowX: 'hidden'
            }}
          >
            {/* Top Freezed Status Bar with Breadcrumbs & Back Navigation */}
            <TopStatusBar />

            {/* Main Content Area */}
            <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
              <Routes>
                {/* Default start on BI Dashboard */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/analytics/operations" element={<OperationsAnalytics />} />
                <Route path="/analytics/services-bi" element={<ServicesBiAnalytics />} />
                <Route path="/services-bi" element={<ServicesBiAnalytics />} />
                <Route path="/checkout" element={<CheckoutWizard />} />
                <Route path="/scheduling" element={<Scheduling />} />
                <Route path="/staff-payouts" element={<StaffPayouts />} />
                <Route path="/payouts" element={<StaffPayouts />} />
                <Route path="/user-guide" element={<UserGuide />} />
                <Route path="/guide" element={<UserGuide />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/staff" element={<Staff />} />
                <Route path="/operations" element={<Operations />} />
                <Route path="/reports" element={<Operations />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/parameters" element={<Parameters />} />
                <Route path="/admin/firebird-sync" element={<FirebirdSync />} />
                <Route path="/admin/daemon-data" element={<DaemonTestDataManager />} />
                <Route path="/sqlite-studio" element={<SqliteStudio />} />
                <Route path="/db-studio" element={<SqliteStudio />} />
                {/* Fallback to BI Dashboard */}
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </Box>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

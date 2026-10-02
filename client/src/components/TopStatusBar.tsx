import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CircleIcon from '@mui/icons-material/Circle';
import StorageIcon from '@mui/icons-material/Storage';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { routeMetaMap } from '../config/navigationConfig';

export default function TopStatusBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentMeta = routeMetaMap[location.pathname] || {
    title: 'Страница',
    groupTitle: 'Раздел',
    groupId: 'other',
    parentPath: '/'
  };

  const isHome = location.pathname === '/';

  const handleBack = () => {
    if (isHome) return;
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1050,
        bgcolor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E8F0',
        px: { xs: 2, md: 3 },
        py: 1.25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
      }}
    >
      {/* Left side: Back Navigation & Breadcrumbs */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Tooltip
          title={isHome ? 'Вы находитесь на главном экране' : 'Вернуться назад'}
          placement="bottom"
          arrow
        >
          <span>
            <IconButton
              size="small"
              onClick={handleBack}
              disabled={isHome}
              sx={{
                border: '1px solid',
                borderColor: isHome ? '#EDF2F7' : '#CBD5E0',
                bgcolor: isHome ? '#F7FAFC' : '#FFFFFF',
                color: isHome ? '#A0AEC0' : '#0F3C64',
                p: 0.75,
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: isHome ? '#F7FAFC' : '#F0F6FA',
                  borderColor: '#0F3C64',
                  transform: isHome ? 'none' : 'translateX(-2px)'
                }
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Breadcrumbs
          separator={<NavigateNextIcon sx={{ fontSize: 16, color: '#A0AEC0' }} />}
          aria-label="breadcrumb"
          sx={{ fontSize: '0.85rem' }}
        >
          {/* Level 1: Главная (Always leads to Dashboard) */}
          <Link
            underline="hover"
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: isHome ? '#0F3C64' : '#718096',
              fontWeight: isHome ? 700 : 500,
              fontSize: '0.84rem'
            }}
            onClick={() => navigate('/')}
          >
            Главная
          </Link>

          {/* Level 2: Group Name (if not home) */}
          {!isHome && (
            <Typography
              sx={{
                color: '#718096',
                fontWeight: 500,
                fontSize: '0.84rem'
              }}
            >
              {currentMeta.groupTitle}
            </Typography>
          )}

          {/* Level 3: Current Active Page Title (if not home) */}
          {!isHome && (
            <Typography
              sx={{
                color: '#0F3C64',
                fontWeight: 700,
                fontSize: '0.86rem'
              }}
            >
              {currentMeta.title}
            </Typography>
          )}
        </Breadcrumbs>
      </Box>

      {/* Right side: System Status Indicators */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* DB Connection Status Badge */}
        <Chip
          icon={<StorageIcon sx={{ fontSize: '15px !important', color: '#2B6CB0 !important' }} />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <CircleIcon sx={{ fontSize: 7, color: '#38A169' }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '0.75rem' }}>
                БД SQLite: 15 табл.
              </Typography>
            </Box>
          }
          size="small"
          sx={{
            bgcolor: '#F0F6FA',
            border: '1px solid #D6E4F0',
            borderRadius: 2,
            px: 0.5,
            height: 28
          }}
        />

        {/* Clinic Doctor Badge */}
        <Chip
          icon={<LocalHospitalIcon sx={{ fontSize: '15px !important', color: '#156C9C !important' }} />}
          label="Клиника Добрушкина (г. Сочи)"
          size="small"
          sx={{
            bgcolor: '#F7FAFC',
            border: '1px solid #E2E8F0',
            fontWeight: 600,
            color: '#4A5568',
            fontSize: '0.75rem',
            height: 28,
            display: { xs: 'none', sm: 'inline-flex' }
          }}
        />
      </Box>
    </Box>
  );
}

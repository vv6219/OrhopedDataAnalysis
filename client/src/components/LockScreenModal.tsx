import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Avatar,
  Chip
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import { useAuth } from '../context/AuthContext';

export default function LockScreenModal() {
  const { user, currentUser, unlock, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = currentUser?.fullName || user || 'Пользователь';
  const roleName = currentUser?.role === 'admin'
    ? 'Администратор системы'
    : currentUser?.role === 'doctor'
    ? 'Врач травматолог-ортопед'
    : currentUser?.role === 'nurse'
    ? 'Медицинская сестра'
    : currentUser?.role === 'cashier'
    ? 'Кассир / Регистратор'
    : 'Сотрудник клиники';

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Введите пароль для разблокировки экрана');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await unlock(password.trim());
      if (!res.success) {
        setError(res.error || 'Неверный пароль разблокировки');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка разблокировки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        bgcolor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Paper
        elevation={24}
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 3.5,
          overflow: 'hidden',
          border: '1px solid #334155',
          bgcolor: '#FFFFFF',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Top Header Card */}
        <Box
          sx={{
            p: 3,
            pb: 2.5,
            bgcolor: '#0F3C64',
            color: '#FFFFFF',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Box
            sx={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.2,
              border: '2px solid rgba(255, 255, 255, 0.25)'
            }}
          >
            <LockIcon sx={{ fontSize: 28, color: '#38BDF8' }} />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            Экран заблокирован
          </Typography>
          <Typography variant="caption" sx={{ color: '#93C5FD', fontWeight: 600, display: 'block', mt: 0.4 }}>
            Защита врачебной тайны и персональных данных (152-ФЗ)
          </Typography>
        </Box>

        {/* User Card */}
        <Box sx={{ p: 3, pt: 2.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              mb: 2.5,
              borderRadius: 2.5,
              bgcolor: '#F8FAFC',
              border: '1px solid #E2E8F0'
            }}
          >
            <Avatar
              sx={{
                bgcolor: '#0F3C64',
                color: '#FFFFFF',
                width: 44,
                height: 44,
                fontWeight: 700,
                fontSize: '1rem'
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}
              >
                {displayName}
              </Typography>
              <Chip
                size="small"
                label={roleName}
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  bgcolor: '#E0F2FE',
                  color: '#0369A1',
                  mt: 0.3
                }}
              />
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.84rem' }}>
              {error}
            </Alert>
          )}

          <Typography variant="body2" sx={{ color: '#64748B', mb: 2, fontSize: '0.84rem' }}>
            Сеанс был заблокирован из-за неактивности. Введите пароль для продолжения работы без потери данных.
          </Typography>

          <Box component="form" onSubmit={handleUnlock}>
            <TextField
              fullWidth
              autoFocus
              type={showPassword ? 'text' : 'password'}
              label="Пароль для разблокировки"
              placeholder="Введите пароль..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="переключить видимость пароля"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
              sx={{ mb: 2.5 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LockOpenIcon />}
              sx={{
                py: 1.2,
                fontWeight: 700,
                fontSize: '0.92rem',
                bgcolor: '#0F3C64',
                borderRadius: 2.5,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(15, 60, 100, 0.25)',
                '&:hover': {
                  bgcolor: '#156C9C'
                }
              }}
            >
              {loading ? 'Проверка пароля...' : 'Разблокировать экран'}
            </Button>
          </Box>

          <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
            <Button
              variant="text"
              size="small"
              startIcon={<SwitchAccountIcon />}
              onClick={logout}
              sx={{
                color: '#64748B',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
                '&:hover': { color: '#DC2626', bgcolor: '#FEF2F2' }
              }}
            >
              Войти под другой учетной записью
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

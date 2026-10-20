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
  IconButton
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import { useAuth } from '../context/AuthContext';

export default function LoginModal() {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Пожалуйста, введите пароль для входа');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await login(password.trim());
      if (!res.success) {
        setError(res.error || 'Неверный пароль доступа');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации');
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
        zIndex: 9999,
        bgcolor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: 440,
          borderRadius: 3.5,
          overflow: 'hidden',
          border: '1px solid #CBD5E1',
          bgcolor: '#FFFFFF',
          boxShadow: '0 20px 40px rgba(15, 60, 100, 0.25)'
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
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.5,
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <img
              src="/MainLogoTransparent.png"
              alt="ОртоERP Логотип"
              style={{ width: 48, height: 48, objectFit: 'contain' }}
            />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            Центр Ортопедии и Травматологии
          </Typography>
          <Typography variant="caption" sx={{ color: '#93C5FD', fontWeight: 600, display: 'block', mt: 0.3 }}>
            доктора Добрушкина в Сочи • МИС «ОртоERP» v1.4.4
          </Typography>
        </Box>

        {/* Form Body */}
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3.5, pt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LockOutlinedIcon sx={{ color: '#0F3C64', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
              Авторизация в системе
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5, fontSize: '0.86rem', lineHeight: 1.5 }}>
            Для доступа к базе данных клиники, веб-интерфейсу, SQLite Studio и Swagger UI введите единый пароль доступа.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.84rem' }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Пароль доступа"
            placeholder="Введите пароль..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoFocus
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
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SecurityIcon />}
            sx={{
              py: 1.3,
              fontWeight: 700,
              bgcolor: '#0F3C64',
              '&:hover': { bgcolor: '#082540' },
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.95rem',
              boxShadow: '0 4px 12px rgba(15, 60, 100, 0.25)'
            }}
          >
            {loading ? 'Проверка пароля...' : 'Войти в систему'}
          </Button>

          <Box sx={{ mt: 2.5, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block' }}>
              Пароль хранится на сервере в зашифрованном виде (PBKDF2-SHA512)
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

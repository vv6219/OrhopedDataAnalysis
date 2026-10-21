import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  CircularProgress
} from '@mui/material';
import LockClockIcon from '@mui/icons-material/LockClock';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../context/AuthContext';

export default function InactivityWarningDialog() {
  const { showInactivityWarning, secondsUntilLock, extendSession, lock } = useAuth();

  if (!showInactivityWarning) return null;

  return (
    <Dialog
      open={showInactivityWarning}
      onClose={extendSession}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            p: 1,
            border: '2px solid #F59E0B',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)'
          }
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1, color: '#B45309' }}>
        <LockClockIcon sx={{ fontSize: 28, color: '#D97706' }} />
        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>
          Предупреждение о неактивности
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" sx={{ color: '#475569', mb: 2, lineHeight: 1.5 }}>
          Вы не совершали действий в системе. В целях защиты медицинской тайны (152-ФЗ) экран будет автоматически заблокирован через:
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            py: 1.5,
            px: 2,
            bgcolor: '#FFFBEB',
            borderRadius: 2,
            border: '1px solid #FDE68A'
          }}
        >
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={(secondsUntilLock / 60) * 100}
              color="warning"
              size={52}
              thickness={4.5}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="caption" component="div" sx={{ fontWeight: 800, color: '#B45309', fontSize: '0.85rem' }}>
                {secondsUntilLock}с
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#92400E' }}>
            Секунд до блокировки экрана
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<LockIcon />}
          onClick={lock}
          sx={{
            borderColor: '#CBD5E1',
            color: '#64748B',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { borderColor: '#DC2626', color: '#DC2626' }
          }}
        >
          Заблокировать сейчас
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<TouchAppIcon />}
          onClick={extendSession}
          autoFocus
          sx={{
            bgcolor: '#0F3C64',
            color: '#FFFFFF',
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': { bgcolor: '#156C9C' }
          }}
        >
          Продлить сеанс
        </Button>
      </DialogActions>
    </Dialog>
  );
}

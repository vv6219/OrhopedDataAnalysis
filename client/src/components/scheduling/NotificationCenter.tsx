import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/apiConfig';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Tabs,
  Tab,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  CircularProgress
} from '@mui/material';
import TelegramIcon from '@mui/icons-material/Telegram';
import SecurityIcon from '@mui/icons-material/Security';
import ChatIcon from '@mui/icons-material/Chat';
import SmsIcon from '@mui/icons-material/Sms';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import type { NotificationItem } from './SchedulingTypes';

interface NotificationCenterProps {
  onRefreshParent: () => void;
}

export default function NotificationCenter({ onRefreshParent }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'telegram' | 'max' | 'whatsapp' | 'sms' | 'email'>('all');
  const [activePreviewChannel, setActivePreviewChannel] = useState<'telegram' | 'max' | 'whatsapp' | 'sms' | 'email'>('telegram');
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = () => {
    setLoading(true);
    const url =
      selectedChannel === 'all'
        ? `${API_BASE_URL}/api/scheduling/notifications`
        : `${API_BASE_URL}/api/scheduling/notifications?channel=${selectedChannel}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.notifications) {
          setNotifications(data.notifications);
          if (data.notifications.length > 0 && !selectedNotif) {
            setSelectedNotif(data.notifications[0]);
            setActivePreviewChannel(data.notifications[0].channel);
          }
        }
      })
      .catch((err) => console.error('Error fetching notifications:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, [selectedChannel]);

  // Simulate patient action in messenger (inline buttons)
  const handleSimulateAction = async (notifId: number, action: 'confirm' | 'cancel') => {
    setActionLoading(true);
    setActionSuccessMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/scheduling/notifications/${notifId}/simulate-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(data.message);
        fetchNotifications();
        onRefreshParent();
      }
    } catch (err: unknown) {
      console.error('Error simulating action:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (n.recipient_name && n.recipient_name.toLowerCase().includes(term)) ||
      (n.patient_name && n.patient_name.toLowerCase().includes(term)) ||
      (n.recipient_contact && n.recipient_contact.includes(term)) ||
      (n.message_text && n.message_text.toLowerCase().includes(term))
    );
  });

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      {/* Top Banner */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
            Центр омниканальных уведомлений пациентов и медперсонала
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Интерактивный шлюз мессенджеров (Telegram, MAX Messenger, WhatsApp, SMS) с поддержкой inline-кнопок
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchNotifications}
          size="small"
          sx={{ textTransform: 'none' }}
        >
          Обновить реестр
        </Button>
      </Box>

      {actionSuccessMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionSuccessMsg(null)}>
          {actionSuccessMsg}
        </Alert>
      )}

      {/* Main Split Layout: Table on Left, Phone Mockup on Right */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' },
          gap: 3,
          alignItems: 'start'
        }}
      >
        {/* Left Panel: Table of Notifications */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}>
            <Tabs
              value={selectedChannel}
              onChange={(_, val) => setSelectedChannel(val)}
              sx={{
                minHeight: 36,
                '& .MuiTab-root': { minHeight: 36, py: 0.5, px: 1.5, fontSize: '0.8rem', textTransform: 'none' }
              }}
            >
              <Tab value="all" label="Все каналы" />
              <Tab icon={<TelegramIcon sx={{ fontSize: 16 }} />} iconPosition="start" value="telegram" label="Telegram" />
              <Tab icon={<SecurityIcon sx={{ fontSize: 16 }} />} iconPosition="start" value="max" label="MAX Messenger" />
              <Tab icon={<ChatIcon sx={{ fontSize: 16 }} />} iconPosition="start" value="whatsapp" label="WhatsApp" />
              <Tab icon={<SmsIcon sx={{ fontSize: 16 }} />} iconPosition="start" value="sms" label="SMS" />
            </Tabs>

            <TextField
              size="small"
              placeholder="Поиск по пациенту или тексту..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                    </InputAdornment>
                  )
                }
              }}
              sx={{ width: 240 }}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Канал</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Получатель</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Визит</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Статус</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Время</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredNotifs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: '#94A3B8' }}>
                        Уведомления не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredNotifs.map((n) => {
                      const isSelected = selectedNotif?.id === n.id;
                      return (
                        <TableRow
                          key={n.id}
                          onClick={() => {
                            setSelectedNotif(n);
                            setActivePreviewChannel(n.channel);
                          }}
                          sx={{
                            cursor: 'pointer',
                            bgcolor: isSelected ? 'rgba(15, 60, 100, 0.08)' : 'inherit',
                            '&:hover': { bgcolor: 'rgba(15, 60, 100, 0.04)' }
                          }}
                        >
                          <TableCell>
                            {n.channel === 'telegram' && (
                              <Chip
                                icon={<TelegramIcon sx={{ fontSize: 14 }} />}
                                label="Telegram"
                                size="small"
                                sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700, height: 22 }}
                              />
                            )}
                            {n.channel === 'max' && (
                              <Chip
                                icon={<SecurityIcon sx={{ fontSize: 14 }} />}
                                label="MAX"
                                size="small"
                                sx={{ bgcolor: '#F0FDF4', color: '#16A34A', fontWeight: 700, height: 22 }}
                              />
                            )}
                            {n.channel === 'whatsapp' && (
                              <Chip
                                icon={<ChatIcon sx={{ fontSize: 14 }} />}
                                label="WhatsApp"
                                size="small"
                                sx={{ bgcolor: '#F0FDF4', color: '#15803D', fontWeight: 700, height: 22 }}
                              />
                            )}
                            {n.channel === 'sms' && (
                              <Chip
                                icon={<SmsIcon sx={{ fontSize: 14 }} />}
                                label="SMS"
                                size="small"
                                sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700, height: 22 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F3C64' }}>
                              {n.patient_name || n.recipient_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              {n.recipient_contact}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                              {n.appointment_date} {n.start_time}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              {n.doctor_name || 'Врач'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {n.status === 'confirmed_by_user' && (
                              <Chip
                                icon={<CheckCircleOutlinedIcon sx={{ fontSize: 14 }} />}
                                label="Подтверждено"
                                color="success"
                                size="small"
                                sx={{ height: 22, fontWeight: 700 }}
                              />
                            )}
                            {n.status === 'delivered' && (
                              <Chip
                                icon={<DoneAllIcon sx={{ fontSize: 14 }} />}
                                label="Доставлено"
                                color="info"
                                size="small"
                                sx={{ height: 22, fontWeight: 700 }}
                              />
                            )}
                            {n.status === 'sent' && (
                              <Chip label="Отправлено" size="small" sx={{ height: 22, fontWeight: 600 }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              {n.sent_at?.slice(11, 16) || '—'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </Paper>

        {/* Right Panel: Interactive Smartphone Device Mockup */}
        <Paper
          elevation={4}
          sx={{
            p: 3,
            borderRadius: '24px',
            bgcolor: '#1E293B',
            color: '#FFFFFF',
            border: '6px solid #334155',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            position: 'relative'
          }}
        >
          {/* Smartphone Speaker / Camera Notch */}
          <Box
            sx={{
              width: 120,
              height: 18,
              bgcolor: '#0F172A',
              borderRadius: '0 0 12px 12px',
              mx: 'auto',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            <Box sx={{ width: 40, height: 4, bgcolor: '#334155', borderRadius: 2 }} />
            <Box sx={{ width: 8, height: 8, bgcolor: '#1E293B', borderRadius: '50%', border: '1px solid #334155' }} />
          </Box>

          {/* Smartphone Screen Content */}
          <Box
            sx={{
              bgcolor:
                activePreviewChannel === 'telegram'
                  ? '#0E1621'
                  : activePreviewChannel === 'max'
                  ? '#064E3B'
                  : activePreviewChannel === 'whatsapp'
                  ? '#0B141A'
                  : '#FFFFFF',
              color: activePreviewChannel === 'sms' ? '#1E293B' : '#FFFFFF',
              borderRadius: '16px',
              p: 2,
              minHeight: 460,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)'
            }}
          >
            {/* Screen Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pb: 1.5,
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {activePreviewChannel === 'telegram' && <TelegramIcon sx={{ color: '#38BDF8' }} />}
                {activePreviewChannel === 'max' && <VerifiedUserIcon sx={{ color: '#4ADE80' }} />}
                {activePreviewChannel === 'whatsapp' && <ChatIcon sx={{ color: '#22C55E' }} />}
                {activePreviewChannel === 'sms' && <SmsIcon sx={{ color: '#0F3C64' }} />}

                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: activePreviewChannel === 'sms' ? '#0F3C64' : '#FFFFFF',
                      lineHeight: 1.1
                    }}
                  >
                    {activePreviewChannel === 'max'
                      ? 'MAX Защищённый Контур'
                      : activePreviewChannel === 'telegram'
                      ? 'Центр Ортопедии Добрушкина'
                      : 'Клиника Добрушкина'}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: activePreviewChannel === 'sms' ? '#64748B' : 'rgba(255,255,255,0.6)',
                      fontSize: '0.65rem'
                    }}
                  >
                    {activePreviewChannel === 'max' ? 'ГОСТ-шифрование данных ЭМК' : 'официальный бот клиники'}
                  </Typography>
                </Box>
              </Box>

              <Chip
                label={activePreviewChannel.toUpperCase()}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: activePreviewChannel === 'sms' ? '#0F3C64' : '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.65rem'
                }}
              />
            </Box>

            {/* Message Bubble Body */}
            <Box sx={{ my: 2 }}>
              {selectedNotif ? (
                <Box
                  sx={{
                    bgcolor:
                      activePreviewChannel === 'telegram'
                        ? '#182533'
                        : activePreviewChannel === 'max'
                        ? '#065F46'
                        : activePreviewChannel === 'whatsapp'
                        ? '#1F2C34'
                        : '#F1F5F9',
                    p: 2,
                    borderRadius: '14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                      color: activePreviewChannel === 'sms' ? '#1E293B' : '#E2E8F0',
                      whiteSpace: 'pre-line',
                      mb: 2
                    }}
                  >
                    {selectedNotif.message_text}
                  </Typography>

                  {/* Interactive Inline Buttons for Telegram & MAX */}
                  {(activePreviewChannel === 'telegram' || activePreviewChannel === 'max') && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        fullWidth
                        onClick={() => handleSimulateAction(selectedNotif.id, 'confirm')}
                        disabled={actionLoading || selectedNotif.status === 'confirmed_by_user'}
                        sx={{
                          bgcolor: selectedNotif.status === 'confirmed_by_user' ? '#15803D' : '#16A34A',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}
                      >
                        {selectedNotif.status === 'confirmed_by_user'
                          ? '✓ Вы подтвердили запись'
                          : '✅ Подтверждаю визит'}
                      </Button>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          sx={{
                            color: '#93C5FD',
                            borderColor: '#3B82F6',
                            textTransform: 'none',
                            fontSize: '0.75rem'
                          }}
                        >
                          🔄 Перенести время
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          fullWidth
                          onClick={() => handleSimulateAction(selectedNotif.id, 'cancel')}
                          disabled={actionLoading}
                          sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                        >
                          ❌ Отменить
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', py: 6 }}>
                  Выберите уведомление в таблице слева для предпросмотра
                </Typography>
              )}
            </Box>

            {/* Screen Bottom Bar */}
            <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
              <Typography
                variant="caption"
                sx={{
                  color: activePreviewChannel === 'sms' ? '#64748B' : 'rgba(255,255,255,0.5)',
                  fontSize: '0.7rem'
                }}
              >
                Нажмите кнопку в макете смартфона для симуляции ответа пациента
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

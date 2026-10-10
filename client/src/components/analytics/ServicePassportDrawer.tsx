import { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedIcon from '@mui/icons-material/Verified';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import HistoryIcon from '@mui/icons-material/History';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { API_BASE_URL } from '../../config/apiConfig';

export interface ServicePassportDrawerProps {
  open: boolean;
  onClose: () => void;
  serviceId: number | null;
}

export function ServicePassportDrawer({
  open,
  onClose,
  serviceId
}: ServicePassportDrawerProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [passport, setPassport] = useState<any | null>(null);

  useEffect(() => {
    if (!open || !serviceId) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/analytics/services-bi/service-passport/${serviceId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPassport(data.passport);
        }
      })
      .catch(err => console.error('Failed to load service passport:', err))
      .finally(() => setLoading(false));
  }, [open, serviceId]);

  const formatCurrency = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return '0 ₽';
    return Math.round(Number(val)).toLocaleString('ru-RU') + ' ₽';
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(3px)', bgcolor: 'rgba(15, 23, 42, 0.4)' }
        }
      }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 540, md: 580 },
          boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
          bgcolor: '#F8FAFC'
        }
      }}
    >
      {/* Drawer Header */}
      <Box
        sx={{
          p: 2.5,
          bgcolor: '#0F3C64',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Chip
              label={passport?.code || 'СЕРВИС'}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
            />
            <Chip
              label={passport?.category || 'Категория'}
              size="small"
              sx={{ bgcolor: '#0284C7', color: 'white', fontWeight: 600 }}
            />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3, mt: 0.5 }}>
            {passport?.name || 'Паспорт сервиса 360°'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
            Прейскурант: <strong>{formatCurrency(passport?.catalogPrice)}</strong>
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress size={36} sx={{ color: '#0F3C64' }} />
          </Box>
        ) : passport ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 1. Unit Economics Cascade */}
            <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MonetizationOnIcon sx={{ color: '#0F3C64' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  Unit-Экономика (на 1 манипуляцию)
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>1. Розничная цена (Выручка):</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                    {formatCurrency(passport.unitEconomics.price)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    2. Списание материалов BOM (1.15):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#D97706' }}>
                    - {formatCurrency(passport.unitEconomics.unitBomCost)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 0.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    = Маржинальная база (База для ФОТ):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0284C7' }}>
                    {formatCurrency(passport.unitEconomics.marginBase)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 1.5 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    • Вознаграждение врача ({passport.unitEconomics.doctorRatePct}%):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#7C3AED' }}>
                    - {formatCurrency(passport.unitEconomics.doctorPayout)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 1.5 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    • Вознаграждение сестры ({passport.unitEconomics.nurseRatePct}%):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#8B5CF6' }}>
                    - {formatCurrency(passport.unitEconomics.nursePayout)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 0.5 }} />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: '#F0FDF4',
                    p: 1.5,
                    borderRadius: 1.5,
                    border: '1px solid #BBF7D0'
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#166534' }}>
                      Чистый остаток клиники (Net Profit):
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#15803D' }}>
                      Рентабельность услуги: {passport.unitEconomics.marginPct}%
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#16A34A' }}>
                    {formatCurrency(passport.unitEconomics.clinicProfit)}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* 2. Bill of Materials (BOM) */}
            <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Inventory2Icon sx={{ color: '#D97706' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                    Технологическая карта BOM ({passport.bomItems?.length || 0})
                  </Typography>
                </Box>
                <Chip
                  label={`Итого BOM: ${formatCurrency(passport.unitEconomics.rawBomCost)}`}
                  size="small"
                  sx={{ bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 700 }}
                />
              </Box>

              {passport.bomItems && passport.bomItems.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Материал</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Ед.</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Цена склад</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Кол-во</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Сумма</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {passport.bomItems.map((m: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{m.material_name}</TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.75rem', color: '#64748B' }}>{m.unit_of_measure}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{formatCurrency(m.unit_cost)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{m.quantity}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#D97706' }}>
                          {formatCurrency(m.total_cost)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" sx={{ color: '#94A3B8', fontStyle: 'italic', py: 1 }}>
                  К данной процедуре не привязаны обязательные списания со склада (услуга без BOM).
                </Typography>
              )}
            </Paper>

            {/* 3. Top Performing Doctors */}
            <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <PeopleAltIcon sx={{ color: '#7C3AED' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  Врачи-лидеры по данной манипуляции
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {passport.topStaff?.map((st: any, idx: number) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.25,
                      bgcolor: '#F8FAFC',
                      borderRadius: 1.5,
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VerifiedIcon sx={{ fontSize: 18, color: '#0284C7' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                        {st.fullName}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        {st.count} проц.
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600 }}>
                        + {formatCurrency(st.profitGenerated)} маржи
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* 4. Recent Executions */}
            <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <HistoryIcon sx={{ color: '#0284C7' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  Недавние выполнения ({passport.recentProcedures?.length || 0})
                </Typography>
              </Box>

              {passport.recentProcedures && passport.recentProcedures.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Дата</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Пациент</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Врач</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Чек</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Прибыль</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {passport.recentProcedures.map((p: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontSize: '0.75rem', color: '#64748B' }}>{p.date}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{p.patientName}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: '#475569' }}>{p.doctorName}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {formatCurrency(p.billedPrice)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#16A34A' }}>
                          {formatCurrency(p.clinicProfit)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" sx={{ color: '#94A3B8', fontStyle: 'italic', py: 1 }}>
                  Нет зарегистрированных выполнений за текущий интервал.
                </Typography>
              )}
            </Paper>
          </Box>
        ) : null}
      </Box>
    </Drawer>
  );
}

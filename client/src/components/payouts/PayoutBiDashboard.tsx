import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper
} from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PercentIcon from '@mui/icons-material/Percent';
import PeopleIcon from '@mui/icons-material/People';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { API_BASE_URL } from '../../config/apiConfig';

const ROLE_COLORS = ['#0F3C64', '#156C9C', '#2D8BC0', '#F59E0B', '#10B981'];

export function PayoutBiDashboard() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any | null>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [rolesDist, setRolesDist] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [waterfall, setWaterfall] = useState<any | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        const [kpiRes, rankRes, roleRes, trendRes, waterRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/payouts/analytics/kpi-summary`),
          fetch(`${API_BASE_URL}/api/payouts/analytics/staff-ranking`),
          fetch(`${API_BASE_URL}/api/payouts/analytics/roles-distribution`),
          fetch(`${API_BASE_URL}/api/payouts/analytics/monthly-trends`),
          fetch(`${API_BASE_URL}/api/payouts/analytics/margin-waterfall`)
        ]);

        if (kpiRes.ok) {
          const kpiData = await kpiRes.json();
          setKpis(kpiData.kpis);
        }
        if (rankRes.ok) {
          const rankData = await rankRes.json();
          setRanking(rankData.ranking || []);
        }
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          setRolesDist(roleData.distribution || []);
        }
        if (trendRes.ok) {
          const trendData = await trendRes.json();
          setMonthlyTrends(trendData.trends || []);
        }
        if (waterRes.ok) {
          const waterData = await waterRes.json();
          setWaterfall(waterData.perThousand);
        }
      } catch (err) {
        console.error('Failed to load BI dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  const formatCurrency = (val: number) => {
    return Math.round(val || 0).toLocaleString('ru-RU') + ' ₽';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 350 }}>
        <CircularProgress sx={{ color: '#0F3C64' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 1. TOP KPI SUMMARY METRICS */}
      {kpis && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2 }}>
          <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>ОБЩИЙ ФОТ ВЫПЛАТ</Typography>
                <AccountBalanceWalletIcon sx={{ color: '#0F3C64', fontSize: 20 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                {formatCurrency(kpis.totalPayoutAmount)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#16A34A', display: 'block', mt: 0.5 }}>
                {kpis.totalOperations} манипуляций
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>МАРЖА КЛИНИКИ</Typography>
                <TrendingUpIcon sx={{ color: '#156C9C', fontSize: 20 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#156C9C' }}>
                {formatCurrency(kpis.totalMarginBase)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                Выручка: {formatCurrency(kpis.totalRevenue)}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>ДОЛЯ ФОТ В МАРЖЕ</Typography>
                <PercentIcon sx={{ color: kpis.fotPercentage <= 40 ? '#16A34A' : '#D97706', fontSize: 20 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: kpis.fotPercentage <= 40 ? '#16A34A' : '#D97706' }}>
                {kpis.fotPercentage}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                Норматив: до 40–50%
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>СР. ВЫПЛАТА ЗА ПРОЦЕДУРУ</Typography>
                <LocalHospitalIcon sx={{ color: '#2563EB', fontSize: 20 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1A2027' }}>
                {formatCurrency(kpis.avgPerOperation)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                на одну операцию
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>АКТИВНЫЙ ШТАТ</Typography>
                <PeopleIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1A2027' }}>
                {kpis.activeStaffCount} чел.
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                Врачей: {kpis.doctorsCount || 0}, Сестер: {kpis.nursesCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* 2. CHARTS GRID: STAFF RANKING & ROLES DONUT */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        {/* Staff Ranking Chart */}
        <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2 }}>
              Рейтинг сотрудников по сумме выплат и отдаче ФОТ (ROI)
            </Typography>
            {ranking.length > 0 ? (
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ranking}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 1000)}k ₽`} />
                    <YAxis
                      dataKey="staff_name"
                      type="category"
                      tick={{ fontSize: 12 }}
                      width={110}
                    />
                    <RechartsTooltip formatter={(val: any) => formatCurrency(Number(val))} />
                    <Legend />
                    <Bar dataKey="total_payout" name="Выплата (₽)" fill="#0F3C64" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="total_margin" name="Сгенерированная маржа (₽)" fill="#2D8BC0" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#64748B', py: 4, textAlign: 'center' }}>
                Нет данных о выплатах за указанный период
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Roles Distribution Donut */}
        <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2 }}>
              Структура ФОТ по ролям персонала
            </Typography>
            {rolesDist.length > 0 ? (
              <Box sx={{ height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={rolesDist}
                      dataKey="total_payout"
                      nameKey="role_name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {rolesDist.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => formatCurrency(Number(val))} />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                  {rolesDist.map((r, idx) => (
                    <Chip
                      key={r.role_name}
                      size="small"
                      label={`${r.role_name}: ${formatCurrency(r.total_payout)} (${r.avg_percent}%)`}
                      sx={{ bgcolor: ROLE_COLORS[idx % ROLE_COLORS.length], color: '#FFFFFF', fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#64748B', py: 4, textAlign: 'center' }}>
                Нет данных
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* 3. MONTHLY TRENDS & WATERFALL */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        {/* Monthly Trends Stacked Bar Chart */}
        <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2 }}>
              Помесячная динамика: Выручка, Расходники, Выплаты врачам и Прибыль клиники
            </Typography>
            {monthlyTrends.length > 0 ? (
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k ₽`} />
                    <RechartsTooltip formatter={(val: any) => formatCurrency(Number(val))} />
                    <Legend />
                    <Bar dataKey="materials_cost" name="Расходники*1.15" stackId="a" fill="#D97706" />
                    <Bar dataKey="doctor_payouts" name="Выплаты врачам" stackId="a" fill="#0F3C64" />
                    <Bar dataKey="nurse_payouts" name="Выплаты сестрам" stackId="a" fill="#156C9C" />
                    <Bar dataKey="clinic_profit" name="Прибыль клиники" stackId="a" fill="#16A34A" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#64748B', py: 4, textAlign: 'center' }}>
                Тренды формируются по мере накопления истории выплат
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Waterfall structure of each 1,000 rubles */}
        <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2 }}>
              Структура каждого 1 000 ₽ дохода клиники
            </Typography>
            {waterfall ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <Box sx={{ p: 1.5, bgcolor: '#FEF3C7', borderRadius: 2, borderLeft: '4px solid #D97706' }}>
                  <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 600, display: 'block' }}>
                    1. Медикаменты и расходные материалы BOM:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#B45309' }}>
                    {waterfall.materials} ₽ ({(waterfall.materials / 10).toFixed(1)}%)
                  </Typography>
                </Box>

                <Box sx={{ p: 1.5, bgcolor: '#EFF6FF', borderRadius: 2, borderLeft: '4px solid #0F3C64' }}>
                  <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 600, display: 'block' }}>
                    2. Вознаграждение лечащего врача:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    {waterfall.doctor_fot} ₽ ({(waterfall.doctor_fot / 10).toFixed(1)}%)
                  </Typography>
                </Box>

                <Box sx={{ p: 1.5, bgcolor: '#E0F2FE', borderRadius: 2, borderLeft: '4px solid #0284C7' }}>
                  <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 600, display: 'block' }}>
                    3. Вознаграждение операционной медсестры:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0369A1' }}>
                    {waterfall.nurse_fot} ₽ ({(waterfall.nurse_fot / 10).toFixed(1)}%)
                  </Typography>
                </Box>

                <Box sx={{ p: 1.5, bgcolor: '#DCFCE7', borderRadius: 2, borderLeft: '4px solid #16A34A' }}>
                  <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600, display: 'block' }}>
                    4. Чистая валовая прибыль центра ортопедии:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#15803D' }}>
                    {waterfall.clinic_profit} ₽ ({(waterfall.clinic_profit / 10).toFixed(1)}%)
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#64748B', py: 4, textAlign: 'center' }}>
                Нет данных
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* 4. STAFF EFFICIENCY & ROI TABLE */}
      {ranking.length > 0 && (
        <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2 }}>
              Сводная матрица финансовой отдачи медицинского персонала
            </Typography>
            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Сотрудник</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Должность / Специализация</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Проведено манипуляций</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Выручка (руб)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Маржа (руб)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Выплата (руб)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Ср. ставка %</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Коэффициент ROI (выручка на 1 ₽ ФОТ)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ranking.map((s) => (
                    <TableRow key={s.staff_id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{s.staff_name}</TableCell>
                      <TableCell>{s.staff_role}</TableCell>
                      <TableCell align="center">{s.operations_count}</TableCell>
                      <TableCell align="right">{formatCurrency(s.generated_revenue)}</TableCell>
                      <TableCell align="right" sx={{ color: '#156C9C', fontWeight: 600 }}>{formatCurrency(s.total_margin)}</TableCell>
                      <TableCell align="right" sx={{ color: '#0F3C64', fontWeight: 700 }}>{formatCurrency(s.total_payout)}</TableCell>
                      <TableCell align="center">{s.avg_percent}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: Number(s.roi_multiplier) >= 2.5 ? '#16A34A' : '#D97706' }}>
                        {s.roi_multiplier ? `${s.roi_multiplier}x` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

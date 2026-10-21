import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
} from '@mui/material';

export interface IncidentReportItem {
  id: number;
  created_at: string;
  problem_code: string;
  severity: string;
  title: string;
  explanation_human: string;
  root_cause_analysis: string;
  remediation_steps: string;
  doctor_name?: string;
  patient_name?: string;
  patient_phone?: string;
  status: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface MedflexIncidentReportProps {
  incidents: IncidentReportItem[];
  kpi?: {
    slaPercent: number;
    avgLatencyMs: number;
    totalBookings: number;
    totalIncidents: number;
    openIncidents: number;
  };
  generatedBy?: string;
  filterPeriod?: string;
}

export const MedflexIncidentReportTemplate = React.forwardRef<HTMLDivElement, MedflexIncidentReportProps>(
  ({ incidents, kpi, generatedBy = 'Администратор клиники', filterPeriod = 'Все инциденты за 30 дней' }, ref) => {
    const generationDate = new Date().toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <Box
        ref={ref}
        sx={{
          p: 4,
          width: '100%',
          bgcolor: 'white',
          color: 'black',
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          '@media print': {
            p: 2,
            boxShadow: 'none'
          }
        }}
      >
        {/* Clinic Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src="/MainLogoTransparent.png"
              alt="Логотип клиники"
              sx={{ height: 60, width: 'auto', objectFit: 'contain' }}
              onError={(e: any) => {
                e.target.style.display = 'none';
              }}
            />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b' }}>
                Центр Ортопедии и Травматологии Добрушкина
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>
                г. Сочи, ул. Транспортная 65, 3 этаж • Тел: +7 (862) 267-00-00
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              Дата генерации:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
              {generationDate}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2.5, borderColor: '#cbd5e1' }} />

        {/* Report Title */}
        <Box sx={{ textAlign: 'center', mb: 2.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '0.02em', color: '#0f172a' }}>
            АКТ АНАЛИЗА ИНЦИДЕНТОВ СИНХРОНИЗАЦИИ ОНЛАЙН-ЗАПИСИ MEDFLEX / ПРОДОКТОРОВ
          </Typography>
          <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
            Период аудита: <strong>{filterPeriod}</strong> • Составил: <strong>{generatedBy}</strong>
          </Typography>
        </Box>

        {/* KPI Summary Block */}
        {kpi && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 1.5,
              mb: 3,
              p: 1.5,
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 1,
              pageBreakInside: 'avoid'
            }}
          >
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Успешность онлайн-записи (SLA)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: kpi.slaPercent >= 99 ? '#10b981' : '#f59e0b' }}>
                {kpi.slaPercent}%
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ borderColor: '#cbd5e1' }} />
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Средняя задержка сети (RTT)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#3b82f6' }}>
                {kpi.avgLatencyMs} мс
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ borderColor: '#cbd5e1' }} />
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Всего онлайн-броней
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {kpi.totalBookings}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ borderColor: '#cbd5e1' }} />
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Всего инцидентов / Открыто
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: kpi.openIncidents > 0 ? '#ef4444' : '#10b981' }}>
                {kpi.totalIncidents} / {kpi.openIncidents}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Incidents Table */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #cbd5e1', mb: 3 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: '4%' }}>№</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '14%' }}>Дата и время</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '18%' }}>Код и тип проблемы</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '38%' }}>Суть инцидента и анализ первопричины (RCA)</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '16%' }}>Врач / Пациент</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '10%' }}>Статус</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#64748b' }}>
                    За выбранный период инцидентов и коллизий синхронизации не зафиксировано.
                  </TableCell>
                </TableRow>
              ) : (
                incidents.map((inc, idx) => (
                  <TableRow key={inc.id} sx={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <TableCell sx={{ fontSize: '0.8rem', verticalAlign: 'top' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                      {inc.created_at}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', verticalAlign: 'top' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: inc.severity === 'critical' ? '#dc2626' : '#d97706' }}>
                        {inc.title}
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b', display: 'block' }}>
                        {inc.problem_code}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', verticalAlign: 'top' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                        {inc.explanation_human}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontStyle: 'italic' }}>
                        <strong>RCA:</strong> {inc.root_cause_analysis}
                      </Typography>
                      {inc.remediation_steps && (
                        <Typography variant="caption" sx={{ color: '#0369a1', display: 'block', mt: 0.3 }}>
                          <strong>Рекомендации:</strong> {inc.remediation_steps}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', verticalAlign: 'top' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                        {inc.doctor_name || 'Врач не привязан'}
                      </Typography>
                      {inc.patient_name && (
                        <Typography variant="caption" sx={{ color: '#334155', display: 'block' }}>
                          Пациент: {inc.patient_name}
                        </Typography>
                      )}
                      {inc.patient_phone && (
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                          Тел: {inc.patient_phone}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', verticalAlign: 'top' }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: inc.status === 'open' ? '#dc2626' : '#16a34a'
                        }}
                      >
                        {inc.status === 'open' ? 'Открыт' : 'Разрешён'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Grouped Totals & Signatures Container (pageBreakInside: 'avoid') */}
        <Box
          sx={{
            mt: 2.5,
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
            borderTop: '2px solid #cbd5e1',
            pt: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Всего записей в акте: {incidents.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Все события зафиксированы в структурированном журнале Serilog (SQLite + Compact Log Event Format).
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 6, mt: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 3 }}>
                Ответственный администратор регистратуры:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <Box sx={{ borderBottom: '1px solid #0f172a', flex: 1, height: 20 }} />
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  / {generatedBy} /
                </Typography>
              </Box>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 3 }}>
                Главный врач клиники:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <Box sx={{ borderBottom: '1px solid #0f172a', flex: 1, height: 20 }} />
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  / Добрушкин В.Л. /
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }
);

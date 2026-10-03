import { useRef, useState, useEffect, forwardRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  MenuItem
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';
import type { Appointment, Doctor } from './SchedulingTypes';

export interface ClinicInfo {
  clinic_name: string;
  clinic_address: string;
  clinic_landmark: string;
  clinic_map_url: string;
  clinic_parking: string;
  clinic_elevator: string;
  clinic_driveway: string;
  clinic_phone: string;
}

export const DEFAULT_CLINIC_INFO: ClinicInfo = {
  clinic_name: 'Центр Ортопедии и Травматологии Добрушкина',
  clinic_address: 'г. Сочи, ул. Транспортная 65, 3 этаж',
  clinic_landmark: 'Центр доктора Добрушкина, 3 этаж (вход оборудован лифтом)',
  clinic_map_url:
    'https://yandex.com/maps/org/orthopedics_center/28107661846/?ll=39.753959%2C43.603715&utm_campaign=desktop&utm_medium=search&utm_source=maps&z=17.3',
  clinic_parking: 'Бесплатная парковка',
  clinic_elevator: 'Лифт (безбарьерная среда)',
  clinic_driveway: 'Заезд с Дублера Курортного пр-та',
  clinic_phone: '+7 (862) 267-00-00'
};

interface SchedulingReportsProps {
  appointments: Appointment[];
  doctors: Doctor[];
  currentDate: string;
}

// -----------------------------------------------------------------------------
// 1. PRINTABLE COMPONENT: Appointment Ticket (Талон предварительной записи)
// -----------------------------------------------------------------------------
export const AppointmentTicket = forwardRef<
  HTMLDivElement,
  { appointment: Appointment; clinicInfo?: ClinicInfo }
>(({ appointment, clinicInfo = DEFAULT_CLINIC_INFO }, ref) => {
  return (
    <Box
      ref={ref}
      sx={{
        p: 4,
        bgcolor: '#FFFFFF',
        color: '#000000',
        maxWidth: '190mm',
        mx: 'auto',
        fontFamily: '"Inter", "Roboto", sans-serif',
        '@media print': {
          '@page': { size: 'A4 portrait', margin: '8mm 10mm' }
        }
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0F3C64', pb: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <img
            src="/MainLogoTransparent.png"
            alt="Центр Ортопедии"
            style={{ width: 64, height: 64, objectFit: 'contain' }}
          />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.1 }}>
              {clinicInfo.clinic_name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
              {clinicInfo.clinic_address} · Телефон: {clinicInfo.clinic_phone} · www.orthocenter.ru
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
            ТАЛОН НА ПРИЁМ
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            № ЗАПИСИ: APP-{appointment.id}
          </Typography>
        </Box>
      </Box>

      {/* Ticket Body */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '8px', mb: 3, borderColor: '#CBD5E1' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body1">
                <strong>Пациент:</strong> {appointment.patient_name}
              </Typography>
              <Typography variant="body2">
                <strong>Номер карты ЭМК:</strong> № {appointment.patient_mednum || '—'}
              </Typography>
              <Typography variant="body2">
                <strong>Лечащий врач:</strong> {appointment.doctor_name}
              </Typography>
              <Typography variant="body2">
                <strong>Кабинет приёма:</strong> {appointment.room_number}
              </Typography>
              <Typography variant="body2">
                <strong>Запланированная услуга:</strong> {appointment.operation_name || 'Консультативный приём'}
              </Typography>
            </Box>

            <Box
              sx={{
                bgcolor: '#F8FAFC',
                p: 2,
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                ДАТА И ВРЕМЯ ПРИЁМА:
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                {appointment.start_time}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                {appointment.appointment_date}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5 }}>
                Длительность: {appointment.duration_minutes} мин.
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Preparation Guidelines */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
            Памятка пациенту для подготовки к приёму:
          </Typography>
          <Box component="ul" sx={{ pl: 2.5, m: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
            <li>Просьба прибыть в клинику за 10–15 минут до назначенного времени для оформления документов.</li>
            <li>Возьмите с собой документ, удостоверяющий личность (паспорт) и полис ДМС (при наличии).</li>
            <li>Обязательно возьмите имеющиеся снимки МРТ, КТ или рентгенограммы на электронном носителе или плёнке.</li>
            <li>При планировании инъекций PRP (плазмотерапия): за 2 часа выпейте 1–2 стакана чистой воды.</li>
            <li>При подборе стелек Formthotics: возьмите с собой повседневную закрытую обувь.</li>
          </Box>
        </Box>

        {/* Exact Pin Address Card matching clinic design */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: '20px',
            border: '1.5px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            mb: 3
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2.5,
              alignItems: { sm: 'center' },
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              {/* Blue Pin Circle Icon */}
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  minWidth: 48,
                  borderRadius: '14px',
                  bgcolor: '#EFF6FF',
                  border: '1px solid #DBEAFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 0.5
                }}
              >
                <LocationOnIcon sx={{ color: '#2563EB', fontSize: 28 }} />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {/* Badge "АДРЕС КЛИНИКИ" */}
                <Box sx={{ alignSelf: 'flex-start' }}>
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.25,
                      bgcolor: '#E6F4EA',
                      color: '#137333',
                      borderRadius: '100px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      display: 'inline-block'
                    }}
                  >
                    АДРЕС КЛИНИКИ
                  </Box>
                </Box>

                {/* Main Address Title */}
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.3px', lineHeight: 1.2 }}
                >
                  {clinicInfo.clinic_address}
                </Typography>

                {/* Subtitle / Landmark */}
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.9rem' }}>
                  {clinicInfo.clinic_landmark}
                </Typography>

                {/* 3 Pill Badges */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.25,
                      py: 0.5,
                      borderRadius: '100px',
                      bgcolor: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#334155'
                    }}
                  >
                    <span>🚗</span>
                    <span>{clinicInfo.clinic_parking}</span>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.25,
                      py: 0.5,
                      borderRadius: '100px',
                      bgcolor: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#334155'
                    }}
                  >
                    <span>🛗</span>
                    <span>{clinicInfo.clinic_elevator}</span>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.25,
                      py: 0.5,
                      borderRadius: '100px',
                      bgcolor: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#334155'
                    }}
                  >
                    <span>📍</span>
                    <span>{clinicInfo.clinic_driveway}</span>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Scannable Yandex Maps QR Code */}
            <Box
              sx={{
                p: 1.5,
                bgcolor: '#F8FAFC',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 120,
                textAlign: 'center'
              }}
            >
              <QRCodeSVG value={clinicInfo.clinic_map_url} size={88} level="M" />
              <Typography
                variant="caption"
                sx={{
                  mt: 1,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: '#0F3C64',
                  maxWidth: 100,
                  lineHeight: 1.15
                }}
              >
                МАРШРУТ В ЯНДЕКС.КАРТАХ
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Timestamp and Administrator Signature */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 1 }}>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Талон сформирован: {new Date().toLocaleString('ru-RU')}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Администратор клиники: Соколова О.В. / Подпись: ______________
          </Typography>
        </Box>

        {/* Avoid break signature */}
        <Box sx={{ pageBreakInside: 'avoid', textAlign: 'center', borderTop: '1px dashed #CBD5E1', pt: 1.5 }}>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            Пожалуйста, сохраняйте данный талон до окончания приёма врачом и проведения взаиморасчётов в кассе.
          </Typography>
        </Box>
      </Box>
    );
  }
);

// -----------------------------------------------------------------------------
// 2. PRINTABLE COMPONENT: Doctor's Daily Appointment Roster (Суточный лист врача)
// -----------------------------------------------------------------------------
export const DoctorDailyRoster = forwardRef<
  HTMLDivElement,
  {
    doctor: Doctor;
    date: string;
    appointments: Appointment[];
  }
>(({ doctor, date, appointments }, ref) => {
  const docApps = appointments.filter((a) => a.doctor_id === doctor.id);

  return (
    <Box
      ref={ref}
      sx={{
        p: 4,
        bgcolor: '#FFFFFF',
        color: '#000000',
        width: '100%',
        maxWidth: '210mm',
        mx: 'auto',
        fontFamily: '"Inter", "Roboto", sans-serif',
        '@media print': {
          '@page': { size: 'A4 portrait', margin: '8mm 10mm' }
        }
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0F3C64', pb: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <img
            src="/MainLogoTransparent.png"
            alt="Центр Ортопедии"
            style={{ width: 64, height: 64, objectFit: 'contain' }}
          />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.1 }}>
              Центр Ортопедии и Травматологии Добрушкина
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
              СУТОЧНЫЙ ЛИСТ РАСПИСАНИЯ ПРИЁМА ВРАЧА (ВЕДОМОСТЬ СМЕНЫ)
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
            ДАТА: {date}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Смена: 09:00 — 19:00
          </Typography>
        </Box>
      </Box>

      {/* Doctor Meta */}
      <Box sx={{ bgcolor: '#F8FAFC', p: 1.5, borderRadius: '8px', border: '1px solid #E2E8F0', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
          Врач: {doctor.full_name} ({doctor.role}) · {doctor.roomNumber}
        </Typography>
        <Typography variant="caption" sx={{ color: '#475569' }}>
          Запланировано пациентов на смену: {docApps.length} чел. · Из них подтверждено: {docApps.filter((a) => a.status === 'confirmed' || a.status === 'completed').length}
        </Typography>
      </Box>

      {/* Table */}
      <Table size="small" sx={{ mb: 4 }}>
        <TableHead sx={{ bgcolor: '#0F3C64' }}>
          <TableRow>
            <TableCell sx={{ color: '#FFFFFF', fontWeight: 700, width: 40 }}>№</TableCell>
            <TableCell sx={{ color: '#FFFFFF', fontWeight: 700, width: 90 }}>Время</TableCell>
            <TableCell sx={{ color: '#FFFFFF', fontWeight: 700, width: 80 }}>ЭМК №</TableCell>
            <TableCell sx={{ color: '#FFFFFF', fontWeight: 700 }}>ФИО Пациента</TableCell>
            <TableCell sx={{ color: '#FFFFFF', fontWeight: 700, width: 60 }}>Возраст</TableCell>
            <TableCell sx={{ color: '#FFFFFF', fontWeight: 700 }}>Медицинская услуга / Назначение</TableCell>
            <TableCell sx={{ color: '#FFFFFF', fontWeight: 700, width: 110 }}>Статус явки</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {docApps.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: '#94A3B8' }}>
                На выбранную дату приёмов у врача нет
              </TableCell>
            </TableRow>
          ) : (
            docApps.map((a, idx) => (
              <TableRow key={a.id} sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                <TableCell sx={{ fontWeight: 600 }}>{idx + 1}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>
                  {a.start_time} - {a.end_time}
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{a.patient_mednum || '—'}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{a.patient_name}</TableCell>
                <TableCell>{a.patient_age ? `${a.patient_age} л.` : '—'}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{a.operation_name || 'Первичный приём'}</TableCell>
                <TableCell>
                  {a.status === 'completed'
                    ? 'Обслужен'
                    : a.status === 'in_progress'
                    ? 'В кабинете'
                    : a.status === 'waiting'
                    ? 'В холле'
                    : a.status === 'confirmed'
                    ? 'Подтверждён'
                    : a.status === 'cancelled'
                    ? 'Отменён'
                    : 'Запланирован'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Footer Signatures */}
      <Box sx={{ pageBreakInside: 'avoid', borderTop: '2px solid #0F3C64', pt: 2.5, display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Главный врач клиники:
          </Typography>
          <Typography variant="caption" sx={{ color: '#475569' }}>
            Добрушкин А.М. / ___________________ (подпись)
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Лечащий врач смены:
          </Typography>
          <Typography variant="caption" sx={{ color: '#475569' }}>
            {doctor.full_name} / ___________________ (подпись)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
});

// -----------------------------------------------------------------------------
// 3. MAIN COMPONENT: SchedulingReports Host
// -----------------------------------------------------------------------------
export default function SchedulingReports({ appointments, doctors, currentDate }: SchedulingReportsProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(doctors[0]?.id || 2);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>(DEFAULT_CLINIC_INFO);
  const [selectedAppForTicket, setSelectedAppForTicket] = useState<Appointment | null>(
    appointments.length > 0 ? appointments[0] : null
  );

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/scheduling/clinic-info')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.clinicInfo) {
          setClinicInfo(data.clinicInfo);
        }
      })
      .catch((err) => console.error('Error fetching clinic info:', err));
  }, []);

  const ticketPrintRef = useRef<HTMLDivElement>(null);
  const rosterPrintRef = useRef<HTMLDivElement>(null);

  const handlePrintTicket = useReactToPrint({
    contentRef: ticketPrintRef,
    documentTitle: `Талон_записи_${selectedAppForTicket?.patient_name || 'клиника'}`
  });

  const handlePrintRoster = useReactToPrint({
    contentRef: rosterPrintRef,
    documentTitle: `Суточный_лист_${currentDate}`
  });

  const selectedDoctorObj = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      {/* Top Banner */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
            Отчёты и клиническая документация расписания
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Формирование и печать талонов пациентов с QR-кодом и суточных ведомостей приёма врачей
          </Typography>
        </Box>
      </Box>

      {/* Action Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
        {/* Card 1: Талон записи пациента */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ConfirmationNumberIcon sx={{ fontSize: 32, color: '#0F3C64' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Талон предварительной записи на приём
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Памятка пациенту: дата, кабинет, врач, QR-код схемы проезда и правила подготовки
              </Typography>
            </Box>
          </Box>

          <TextField
            select
            label="Выберите пациента из текущих записей"
            value={selectedAppForTicket?.id || ''}
            onChange={(e) => {
              const app = appointments.find((a) => a.id === Number(e.target.value));
              if (app) setSelectedAppForTicket(app);
            }}
            size="small"
            fullWidth
          >
            {appointments.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.start_time} — {a.patient_name} ({a.doctor_name})
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            disabled={!selectedAppForTicket}
            onClick={() => setTicketModalOpen(true)}
            sx={{ bgcolor: '#0F3C64', fontWeight: 700, alignSelf: 'flex-start' }}
          >
            Предпросмотр и печать талона
          </Button>
        </Paper>

        {/* Card 2: Суточный лист врача */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AssignmentIcon sx={{ fontSize: 32, color: '#156C9C' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Суточный лист расписания врача (Ведомость смены)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Официальная сводка приёма на рабочий день: перечень пациентов, услуг и подписи
              </Typography>
            </Box>
          </Box>

          <TextField
            select
            label="Выберите лечащего врача"
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
            size="small"
            fullWidth
          >
            {doctors.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.full_name} ({d.roomNumber})
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            color="secondary"
            startIcon={<PrintIcon />}
            onClick={() => handlePrintRoster()}
            sx={{ fontWeight: 700, alignSelf: 'flex-start' }}
          >
            Печать суточного листа врача
          </Button>
        </Paper>
      </Box>

      {/* Hidden Render for Roster Print */}
      <Box sx={{ display: 'none' }}>
        {selectedDoctorObj && (
          <DoctorDailyRoster
            ref={rosterPrintRef}
            doctor={selectedDoctorObj}
            date={currentDate}
            appointments={appointments}
          />
        )}
      </Box>

      {/* Ticket Preview Modal */}
      {selectedAppForTicket && (
        <Dialog
          open={ticketModalOpen}
          onClose={() => setTicketModalOpen(false)}
          maxWidth="md"
          fullWidth
          disableRestoreFocus
          slotProps={{
            paper: { sx: { borderRadius: '16px', overflow: 'hidden' } }
          }}
        >
          <DialogTitle
            sx={{
              bgcolor: '#0F3C64',
              color: '#FFFFFF',
              py: 2,
              px: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PrintIcon sx={{ color: '#38BDF8' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Предпросмотр талона записи
              </Typography>
            </Box>
            <IconButton onClick={() => setTicketModalOpen(false)} sx={{ color: '#FFFFFF' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 2, bgcolor: '#F8FAFC' }}>
            <Paper elevation={2} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
              <AppointmentTicket ref={ticketPrintRef} appointment={selectedAppForTicket} clinicInfo={clinicInfo} />
            </Paper>
          </DialogContent>

          <DialogActions sx={{ p: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
            <Button onClick={() => setTicketModalOpen(false)} sx={{ color: '#64748B' }}>
              Закрыть
            </Button>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={() => handlePrintTicket()}
              sx={{ bgcolor: '#0F3C64', fontWeight: 700 }}
            >
              Распечатать талон
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

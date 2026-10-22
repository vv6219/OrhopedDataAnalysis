import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  MenuBook as GuideIcon,
  Search as SearchIcon,
  Straighten as RomIcon,
  Biotech as TestsIcon,
  LocalHospital as DiagIcon,
  Healing as ManipIcon,
  Bolt as PhysioIcon,
  AccessibilityNew as OrthoIcon,
  DirectionsRun as LfkIcon,
  Article as TemplatesIcon,
  HealthAndSafety as ShieldIcon,
  Speed as MeterIcon
} from '@mui/icons-material';
import { ROM_CONFIGS, END_FEEL_OPTIONS } from './romStandardsData';

export type ClinicalGuideSection =
  | 'templates'
  | 'rom'
  | 'tests'
  | 'diagnostics'
  | 'manipulations'
  | 'physiotherapy'
  | 'orthotics'
  | 'lfk';

export interface ClinicalGuidanceModalProps {
  open: boolean;
  onClose: () => void;
  initialSection?: ClinicalGuideSection | number;
  jointCategory?: string;
}

interface SectionTabMeta {
  key: ClinicalGuideSection;
  index: number;
  label: string;
  shortLabel: string;
  icon: React.ReactElement;
  badge: string;
  themeColor: string;
  gradient: string;
  description: string;
}

const SECTION_TABS: SectionTabMeta[] = [
  {
    key: 'templates',
    index: 0,
    label: '1. Шаблоны',
    shortLabel: 'Шаблоны',
    icon: <TemplatesIcon sx={{ fontSize: 18 }} />,
    badge: '31 протокол',
    themeColor: '#0F3C64',
    gradient: 'linear-gradient(135deg, #0F3C64 0%, #1E5C8C 100%)',
    description: 'Стандарты структуры протокола осмотра ортопеда, кластеры МКБ-10 и правила формулировки диагноза'
  },
  {
    key: 'rom',
    index: 1,
    label: '2. ROM',
    shortLabel: 'ROM',
    icon: <RomIcon sx={{ fontSize: 18 }} />,
    badge: '10 суставов SFTR',
    themeColor: '#0284C7',
    gradient: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
    description: 'Система Neutral-0 (SFTR АТОР/AAOS), активные/пассивные амплитуды, степени контрактур и конечный упор End-Feel'
  },
  {
    key: 'tests',
    index: 2,
    label: '3. Тесты',
    shortLabel: 'Тесты',
    icon: <TestsIcon sx={{ fontSize: 18 }} />,
    badge: '1377 тестов Se/Sp',
    themeColor: '#0284C7',
    gradient: 'linear-gradient(135deg, #0369A1 0%, #075985 100%)',
    description: 'Валидированные пробы доказательной медицины (EBM Tier 1–3), чувствительность (Se), специфичность (Sp) и кластеры'
  },
  {
    key: 'diagnostics',
    index: 3,
    label: '4. Диагностика',
    shortLabel: 'Диагностика',
    icon: <DiagIcon sx={{ fontSize: 18 }} />,
    badge: '381 метод',
    themeColor: '#0F3C64',
    gradient: 'linear-gradient(135deg, #0F3C64 0%, #0B2540 100%)',
    description: 'Инструментальное обследование (Рентген, МРТ, КТ, УЗИ, ЭНМГ), протокольные фразы и привязка к прайсу servdict'
  },
  {
    key: 'manipulations',
    index: 4,
    label: '5. Манипуляции',
    shortLabel: 'Манипуляции',
    icon: <ManipIcon sx={{ fontSize: 18 }} />,
    badge: '26 процедур',
    themeColor: '#0D9488',
    gradient: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
    description: 'Интервенционная ортопедия, лечебно-медикаментозные блокады, PRP/ортобиология, УЗ-навигация и CDSS STOP Red Flags'
  },
  {
    key: 'physiotherapy',
    index: 5,
    label: '6. Физиотерапия',
    shortLabel: 'Физиотерапия',
    icon: <PhysioIcon sx={{ fontSize: 18 }} />,
    badge: '21 метод EBM',
    themeColor: '#4338CA',
    gradient: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
    description: 'Аппаратные технологии (HILT-лазер, УВТ/ESWT, SIS-магнит, TECAR), дозиметрия и протоколы курсового лечения'
  },
  {
    key: 'orthotics',
    index: 6,
    label: '7. Ортезирование',
    shortLabel: 'Ортезирование',
    icon: <OrthoIcon sx={{ fontSize: 18 }} />,
    badge: '26 изделий',
    themeColor: '#047857',
    gradient: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
    description: 'Индивидуальное ортезирование, классификация ISO, режимы осевой нагрузки (NWB–FWB) и фиксация углов шарниров'
  },
  {
    key: 'lfk',
    index: 7,
    label: '8. ЛФК',
    shortLabel: 'ЛФК',
    icon: <LfkIcon sx={{ fontSize: 18 }} />,
    badge: '29 упражнений',
    themeColor: '#15803D',
    gradient: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
    description: 'Поэтапная кинезиотерапия (Фазы I–III), кинематические цепи (OKC/CKC/PNF/CORE), контроль боли ВАШ и темп'
  }
];

export default function ClinicalGuidanceModal({
  open,
  onClose,
  initialSection = 'templates',
  jointCategory
}: ClinicalGuidanceModalProps) {
  // Convert initialSection to tab index
  const resolvedInitialTab = useMemo(() => {
    if (typeof initialSection === 'number') {
      return Math.max(0, Math.min(7, initialSection));
    }
    const idx = SECTION_TABS.findIndex(t => t.key === initialSection);
    return idx >= 0 ? idx : 0;
  }, [initialSection]);

  const [activeTab, setActiveTab] = useState<number>(resolvedInitialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync tab when initialSection changes and modal opens
  useEffect(() => {
    setActiveTab(resolvedInitialTab);
  }, [resolvedInitialTab, open]);

  const currentTabMeta = SECTION_TABS[activeTab] || SECTION_TABS[0];

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(15, 60, 100, 0.28)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '92vh'
          }
        }
      }}
    >
      {/* Top Gradient Header */}
      <Box
        sx={{
          background: currentTabMeta.gradient,
          color: '#FFFFFF',
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.15)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(6px)'
            }}
          >
            <GuideIcon sx={{ fontSize: 26, color: '#FFFFFF' }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: 0.5, fontSize: '1.15rem' }}>
                КЛИНИЧЕСКИЙ ГИД И РУКОВОДСТВО ВРАЧА 2.0
              </Typography>
              <Chip
                label={currentTabMeta.badge}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.22)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  height: 22
                }}
              />
              {jointCategory && (
                <Chip
                  label={`Сустав: ${jointCategory}`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.3)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    height: 22
                  }}
                />
              )}
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem' }}>
              {currentTabMeta.description}
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          sx={{
            color: '#FFFFFF',
            bgcolor: 'rgba(255,255,255,0.12)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.24)' }
          }}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Synchronized 8-Tab Switcher Bar */}
      <Box sx={{ bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', px: 2, pt: 1 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => { setActiveTab(v); setSearchQuery(''); }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 46,
            '& .MuiTab-root': {
              minHeight: 46,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              color: '#64748B',
              px: 1.75,
              '&.Mui-selected': {
                color: currentTabMeta.themeColor,
                fontWeight: 900
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: currentTabMeta.themeColor,
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          {SECTION_TABS.map((tab) => (
            <Tab
              key={tab.key}
              icon={tab.icon}
              iconPosition="start"
              label={tab.label}
            />
          ))}
        </Tabs>
      </Box>

      {/* Search Toolbar */}
      <Box sx={{ px: 3, py: 1.5, bgcolor: '#FFFFFF', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          size="small"
          placeholder={`Поиск в разделе «${currentTabMeta.shortLabel}» (по терминам, кодам, методикам, МКБ-10)...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                </InputAdornment>
              )
            }
          }}
          sx={{ flex: 1 }}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={copiedKey === 'summary' ? <CheckIcon color="success" /> : <CopyIcon />}
          onClick={() => {
            const summaryText = `[КЛИНИЧЕСКИЙ СТАНДАРТ: ${currentTabMeta.label}]\n${currentTabMeta.description}\nКлинический центр ортопедии и травматологии. Доказательная база EBM 2026.`;
            handleCopy('summary', summaryText);
          }}
          sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}
        >
          {copiedKey === 'summary' ? 'Скопировано!' : 'Скопировать регламент'}
        </Button>
      </Box>

      {/* Main Content Area */}
      <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC', overflowY: 'auto' }}>
        {/* TAB 0: ШАБЛОНЫ */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <strong>Архитектура клинического протокола осмотра:</strong> Каждый шаблон содержит 8 сквозных блоков
              (Анамнез, ROM, Тесты, Диагностика, Манипуляции, Физиотерапия, Ортезирование, ЛФК). Данные передаются
              в калькуляцию МИС и кассовый узел без ручного дублирования.
            </Alert>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShieldIcon sx={{ color: '#0F3C64', fontSize: 20 }} />
                      Юридическая безопасность и МКБ-10
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#475569', mb: 1.5, fontSize: '0.85rem' }}>
                      Клинический диагноз формулируется строго в соответствии с МКБ-10 с обязательным указанием:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2.5, m: 0, '& li': { mb: 0.75, fontSize: '0.82rem', color: '#334155' } }}>
                      <li><strong>Нозология и шифр:</strong> например, <code>M17.1 Первичный гонартроз</code>, <code>M75.1 Синдром ротаторной манжеты</code>.</li>
                      <li><strong>Анатомическая сторона:</strong> правый / левый / двусторонний процесс.</li>
                      <li><strong>Стадия / Степень:</strong> рентгенологическая (Kellgren-Lawrence I–IV) или клиническая.</li>
                      <li><strong>Функциональное нарушение:</strong> дефицит амплитуды (ROM), контрактура, нестабильность.</li>
                      <li><strong>Сопутствующий синовит / выпот:</strong> наличие воспалительного экссудата.</li>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MeterIcon sx={{ color: '#0F3C64', fontSize: 20 }} />
                      8 обязательных этапов протокола приема
                    </Typography>
                    <Box component="ol" sx={{ pl: 2.5, m: 0, '& li': { mb: 0.5, fontSize: '0.82rem', color: '#334155' } }}>
                      <li><strong>1. Анамнез и МКБ-10:</strong> жалобы, механизм травмы, анамнез заболевания, сопутствующие патологии.</li>
                      <li><strong>2. ROM (Гониометрия):</strong> Neutral-0 углы, разгибательный/сгибательный лаг, тип упора End-Feel.</li>
                      <li><strong>3. Ортопедические тесты:</strong> 1 377 валидированных проб доказательной биомеханики (Tier 1–3).</li>
                      <li><strong>4. Инструментальная диагностика:</strong> обоснованное назначение 381 аппаратного метода (Рентген/МРТ/КТ/УЗИ/ЭНМГ).</li>
                      <li><strong>5. Манипуляции:</strong> блокады, пункции, PRP с выбором доступа и навигации (US-guided).</li>
                      <li><strong>6. Физиотерапия:</strong> аппаратные курсы (HILT, УВТ, SIS, TECAR) с дозировкой.</li>
                      <li><strong>7. Ортезирование:</strong> брейсы, ортезы, стельки ФормТотикс, режим осевой нагрузки (NWB–FWB).</li>
                      <li><strong>8. Комплекс ЛФК:</strong> упражнения по фазам реабилитации, темп и шкала боли ВАШ.</li>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 1: ROM ГОНИОМЕТРИЯ */}
        {activeTab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <strong>Стандарт измерения амплитуды Neutral-0 (SFTR):</strong> Все измерения фиксируются в 3 плоскостях:
              Сагиттальная (S: разгибание-ноль-сгибание), Фронтальная (F: отведение-ноль-приведение), Трансверзальная (T / R: ротация).
            </Alert>

            {/* Quick SFTR Table for 10 Joints */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Сустав</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Латынь</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Оси движения</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Эталон нормы SFTR</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Клиническая заметка</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(ROM_CONFIGS).map(([key, cfg]) => (
                    <TableRow key={key} hover>
                      <TableCell sx={{ fontWeight: 700, color: cfg.iconColor }}>
                        {cfg.titleRu}
                      </TableCell>
                      <TableCell sx={{ fontStyle: 'italic', color: '#64748B', fontSize: '0.8rem' }}>
                        {cfg.titleLat}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>
                        {cfg.axes.map(a => a.labelRu).join(', ')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F3C64' }}>
                        {cfg.axes.map(a => `${a.labelRu}: ${a.normText}`).join('; ')}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: '#475569' }}>
                        {cfg.axes[0]?.clinicalNote || 'Базовая функциональная ось'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* End-Feel Guide Cards */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>
              Классификация конечного упора (End-Feel по Джеймсу Сириаксу)
            </Typography>
            <Grid container spacing={1.5}>
              {END_FEEL_OPTIONS.map((ef) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={ef.code}>
                  <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2, height: '100%', borderColor: '#CBD5E1' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography sx={{ fontSize: '1.2rem' }}>{ef.icon}</Typography>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: ef.color }}>
                          {ef.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {ef.sub}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#334155' }}>
                      {ef.desc}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* TAB 2: ТЕСТЫ */}
        {activeTab === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <strong>Доказательная ортопедическая диагностика (EBM Tiers):</strong>
              <br />• <strong>Tier 1 (Высокий / Скрининг):</strong> Высокая чувствительность (Se &gt; 85%) — исключает патологию при отрицательном результате (SnNout).
              <br />• <strong>Tier 2 (Средний / Верификация):</strong> Высокая специфичность (Sp &gt; 90%) — подтверждает диагноз при положительном результате (SpPin).
              <br />• <strong>Tier 3 (Низкий / Предоперационный):</strong> Экспертные и комбинированные пробы для решения вопроса об артроскопии или операции.
            </Alert>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FEF2F2', borderColor: '#FCA5A5' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#DC2626', mb: 1 }}>
                    ⭐ Коленный сустав (Кластер связок)
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#7F1D1D', mb: 1 }}>
                    • <strong>Тест Лахмана (Lachman):</strong> Золотой стандарт ПКС (Se 85%, Sp 94%). Выполняется при сгибании 20–30°.
                    <br />• <strong>Pivot-Shift:</strong> Максимальная специфичность ПКС (Sp 98%).
                    <br />• <strong>Тест Мак-Мюррея / Тест Эпли:</strong> Разрывы менисков, щелчок по суставной щели.
                    <br />• <strong>Тест заднего ящика:</strong> Повреждение ЗКС (Sp 99%).
                  </Typography>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#EFF6FF', borderColor: '#93C5FD' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#2563EB', mb: 1 }}>
                    🎯 Плечевой сустав (Манжета и импиджмент)
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#1E3A8A', mb: 1 }}>
                    • <strong>Тест Хокинса-Кеннеди:</strong> Субакромиальный импиджмент (Se 92%).
                    <br />• <strong>Тест Джоба (Empty Can):</strong> Изолированное повреждение надостной мышцы (Se 89%).
                    <br />• <strong>Тест падающей руки (Drop Arm):</strong> Массивный полнослойный разрыв манжеты.
                    <br />• <strong>Тест Спида / Йергасона:</strong> Тендинит длинной головки бицепса.
                  </Typography>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#F0FDF4', borderColor: '#86EFAC' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#16A34A', mb: 1 }}>
                    🔍 ТБС, Стопа и Позвоночник
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#14532D', mb: 1 }}>
                    • <strong>Тест FABER (Патрика):</strong> Сакроилеит vs коксартроз.
                    <br />• <strong>Тест FADIR:</strong> Фемороацетабулярный импиджмент (FAI) и разрыв вертлужной губы.
                    <br />• <strong>Симптом Ласега:</strong> Корешковая компрессия L4–S1 (радикулопатия).
                    <br />• <strong>Тест Томпсона:</strong> Полный разрыв ахиллова сухожилия (Sp 98%).
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 3: ДИАГНОСТИКА */}
        {activeTab === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <strong>Алгоритм инструментального поиска:</strong> От простой рентгенографии в 2 проекциях к высокопольной томографии
              (МРТ 1.5–3.0Т) и динамическому УЗИ высокого разрешения.
            </Alert>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Модальность</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Показания первой линии</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Ограничения / CDSS Red Flags</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Услуга в прайсе (servdict)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Рентгенография (X-Ray)</TableCell>
                    <TableCell sx={{ fontSize: '0.82rem' }}>Переломы, остеоартроз (сужение щели, остеофиты), дисплазии, осевые деформации</TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', color: '#DC2626' }}>Не визуализирует мениски, связки и ранний отек костного мозга</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#059669', fontSize: '0.82rem' }}>Рентген сустава (2 пр.)</TableCell>
                  </TableRow>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 700, color: '#0284C7' }}>МРТ (MRI 1.5–3.0T)</TableCell>
                    <TableCell sx={{ fontSize: '0.82rem' }}>Разрывы менисков, связок, губы сустава, хондромаляция, стресс-переломы, асептический некроз</TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', color: '#DC2626' }}>Кардиостимуляторы, ферромагнитные клипсы, клаустрофобия</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#059669', fontSize: '0.82rem' }}>МРТ сустава высокой четкости</TableCell>
                  </TableRow>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 700, color: '#0D9488' }}>УЗИ суставов (US)</TableCell>
                    <TableCell sx={{ fontSize: '0.82rem' }}>Выпот в полости, бурситы, киста Бейкера, тендиниты, динамическая компрессия, навигация</TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', color: '#DC2626' }}>Операторозависимость, не видит глубокие внутрисуставные структуры</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#059669', fontSize: '0.82rem' }}>УЗИ мягких тканей / суставов</TableCell>
                  </TableRow>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 700, color: '#7C3AED' }}>КТ (CT)</TableCell>
                    <TableCell sx={{ fontSize: '0.82rem' }}>Многооскольчатые переломы, предоперационное 3D-планирование эндопротезирования</TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', color: '#DC2626' }}>Лучевая нагрузка, противопоказано при беременности</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#059669', fontSize: '0.82rem' }}>КТ костных структур</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* TAB 4: МАНИПУЛЯЦИИ */}
        {activeTab === 4 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              <strong>CDSS STOP RED FLAGS (Абсолютные противопоказания к манипуляциям):</strong>
              <br />1. Лихорадка (&gt; 37.8°C) или признаки острого септического артрита (гиперемия, гипертермия, флюктуация).
              <br />2. Нарушения гемостаза (прием Варфарина/НОАК без контроля МНО, МНО &gt; 2.0).
              <br />3. Инфекционные поражения кожи, псориатические бляшки в проекции точки пункции.
            </Alert>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F766E', mb: 1 }}>
                    📡 Стандарты навигации интервенций
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#334155', mb: 1 }}>
                    • <strong>УЗ-навигация (US-guided):</strong> Обязательна для глубоких инъекций (ТБС, субакромиальное пространство, фасеточные суставы), а также при барботаже кальцификатов и PRP. Точность попадания 98% vs 65% по анатомическим ориентирам.
                    <br />• <strong>Анатомические ориентиры:</strong> Допустимы для крупных поверхностных суставов (коленный сустав, верхний латеральный заворот) опытным врачом-ортопедом при отсутствии выраженного отека.
                  </Typography>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F766E', mb: 1 }}>
                    💉 Препараты и регламент введения
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#334155', mb: 1 }}>
                    • <strong>Гиалуроновая кислота (ГК / HA):</strong> Высокомолекулярная (2.0–3.0 млн Да) или сшитая (cross-linked). Вводится строго внутрисуставно при артрозах I–III ст. без острого синовита.
                    <br />• <strong>PRP / ACP (Богатая тромбоцитами плазма):</strong> Концентрация тромбоцитов в 3–5 раз выше базовой. Противовоспалительный и регенеративный каскад факторов роста (PDGF, TGF-b).
                    <br />• <strong>ГКС (Бетаметазон / Триамцинолон):</strong> Купирование острого резистентного синовита. Не чаще 2–3 раз в год в один сустав (риск хондролиза).
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 5: ФИЗИОТЕРАПИЯ */}
        {activeTab === 5 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <strong>Биофизический профиль и синергия методов:</strong> Аппаратная физиотерапия назначается курсами по 5–10 процедур
              с контролем локальной микроциркуляции, резорбции отека и неоваскуляризации.
            </Alert>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#4338CA', mb: 0.5 }}>
                    ⚡ УВТ / ESWT (Ударно-волновая терапия)
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#334155' }}>
                    • <strong>Радиальная (RSWT):</strong> Миофасциальные триггеры, плантарный фасциит, эпикондилит (давление 1.8–3.5 bar, 2000–3000 имп, 1 раз в 5–7 дней).
                    <br />• <strong>Фокусированная (FSWT):</strong> Ложные суставы, стресс-переломы, глубокие кальцификаты связок (глубина фокуса до 65 мм).
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#4338CA', mb: 0.5 }}>
                    🔦 HILT (Высокоинтенсивная лазеротерапия)
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#334155' }}>
                    • Мощность до 12–15 Вт, длина волны 1064 нм. Глубокое прогревание тканей без перегрева кожи за счет импульсного режима. Выраженный анальгетический эффект уже после 1-й процедуры.
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#4338CA', mb: 0.5 }}>
                    🧲 SIS (Высокоинтенсивная магнитотерапия)
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#334155' }}>
                    • Индукция до 2.5–3.0 Тесла. Миостимуляция, снятие мышечных блоков, ускорение остеорепарации при консолидирующихся переломах.
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#4338CA', mb: 0.5 }}>
                    🔥 TECAR-терапия (Радиочастотная емкостная)
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#334155' }}>
                    • Диатермия 448 кГц. Режим RESISTIVE для сухожилий, связок и капсулы; CAPACITIVE для мышц и лимфодренажа.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 6: ОРТЕЗИРОВАНИЕ */}
        {activeTab === 6 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <strong>Классификация осевой нагрузки (Weight-Bearing Modes):</strong>
              <br />• <strong>NWB (Non-Weight Bearing):</strong> 0% нагрузки (костыли, нога на весу). Первые недели после остеосинтеза, рефиксации мениска.
              <br />• <strong>TTWB (Toe-Touch):</strong> 10% нагрузки (касание носком для баланса, до 10 кг).
              <br />• <strong>PWB (Partial):</strong> 30–50% нагрузки на костылях.
              <br />• <strong>WBAT (As Tolerated):</strong> Нагрузка по переносимости (в ортезе со стабилизацией).
              <br />• <strong>FWB (Full):</strong> 100% полная осевая нагрузка.
            </Alert>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#047857', mb: 1 }}>
                    🦾 Настройка шарнирных брейсов (ROM Limiter)
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#334155', mb: 1 }}>
                    • <strong>Шов мениска (менископексия):</strong> первые 4 недели ограничение сгибания до 90°, разгибание 0°.
                    <br />• <strong>Пластика ПКС (ACL-R):</strong> 0° разгибание (профилактика контрактуры), постепенное расширение сгибания от 30° до 90° к 4-й неделе.
                    <br />• <strong>Повреждение связок надколенника:</strong> иммобилизация в туторе или ортезе 0–20° на 4 недели.
                  </Typography>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#047857', mb: 1 }}>
                    👟 Индивидуальные ортезы стопы (ФормТотикс)
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#334155', mb: 1 }}>
                    • Термоформовка из пены Formax под динамической нагрузкой пациента.
                    <br />• Оптимизация кинематической цепи: стопа → голень → колено → таз → позвоночник.
                    <br />• Обязательная этапная коррекция метатарзальными клиньями через 3–4 недели ношения.
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 7: ЛФК И КИНЕЗИОТЕРАПИЯ */}
        {activeTab === 7 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              <strong>Модель контроля боли при ЛФК (Pain-Monitoring Model):</strong>
              <br />• <strong>ВАШ 0–2 (Зеленая зона):</strong> Абсолютно безопасно, можно увеличивать повторения/нагрузку.
              <br />• <strong>ВАШ 3–5 (Желтая зона):</strong> Допустимый дискомфорт при тренировке сухожилий, боль должна полностью уйти в течение 1 часа после занятия.
              <br />• <strong>ВАШ &gt; 5 (Красная зона):</strong> Немедленно снизить нагрузку или прекратить упражнение.
            </Alert>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FEF2F2', borderColor: '#FECACA' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#DC2626', mb: 1 }}>
                    Фаза I: Острая / Защита
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#991B1B' }}>
                    • Изометрическое сокращение целевых мышц без движения в суставе (квадрицепс-сет, ягодичные сжатия).
                    • Пассивная разработка амплитуды на шинах артромота (СРМ).
                    • Лимфодренажные упражнения для дистальных сегментов.
                  </Typography>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFBEB', borderColor: '#FDE68A' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#D97706', mb: 1 }}>
                    Фаза II: Функциональная
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#92400E' }}>
                    • Закрытые кинематические цепи (CKC): мини-приседы, жим ногами с платформы.
                    • Проприоцепция и баланс на стабилоплатформе / полусфере BOSU.
                    • Эксцентрические тренировки с контролем темпа (3-1-3-1).
                  </Typography>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#16A34A', mb: 1 }}>
                    Фаза III: Силовая / Спорт
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#166534' }}>
                    • Плиометрика, реактивная сила, прыжки с приземлением в правильную ось.
                    • Скоростно-силовые упражнения и специфические спортивные тесты (Hop Test &gt; 90% симметрии).
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions sx={{ px: 3, py: 1.75, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
          Доказательная база: АТОР • AAOS • Клинические рекомендации МЗ РФ • Cyriax EBM
        </Typography>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: currentTabMeta.themeColor,
            '&:hover': { opacity: 0.9 },
            fontWeight: 700,
            textTransform: 'none',
            px: 3
          }}
        >
          Закрыть гид
        </Button>
      </DialogActions>
    </Dialog>
  );
}

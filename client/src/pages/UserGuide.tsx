import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton
} from '@mui/material';
import { useReactToPrint } from 'react-to-print';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CalculateIcon from '@mui/icons-material/Calculate';
import TimelineIcon from '@mui/icons-material/Timeline';
import InputIcon from '@mui/icons-material/Input';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import DescriptionIcon from '@mui/icons-material/Description';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DnsIcon from '@mui/icons-material/Dns';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import TocIcon from '@mui/icons-material/Toc';
import BiotechIcon from '@mui/icons-material/Biotech';
import HealingIcon from '@mui/icons-material/Healing';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ShieldIcon from '@mui/icons-material/Shield';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import StraightenIcon from '@mui/icons-material/Straighten';

import { UserGuidePrintTemplate } from '../components/UserGuidePrintTemplate';
import { PosFiscalManualPrintTemplate } from '../components/PosFiscalManualPrintTemplate';
import LatexText from '../components/ortho/LatexText';
import OrthoTestsGuideRegistry from '../components/ortho/OrthoTestsGuideRegistry';
import DiagnosticMethodsGuideRegistry from '../components/ortho/DiagnosticMethodsGuideRegistry';
import OrthoTemplatesGuideRegistry from '../components/ortho/OrthoTemplatesGuideRegistry';
import ManipulationsGuideRegistry from '../components/ortho/ManipulationsGuideRegistry';
import PhysiotherapyGuideRegistry from '../components/ortho/PhysiotherapyGuideRegistry';
import OrthoticsGuideRegistry from '../components/ortho/OrthoticsGuideRegistry';
import LfkGuideRegistry from '../components/ortho/LfkGuideRegistry';
import RomStandardsManager from '../components/ortho/RomStandardsManager';
import {
  parseAndExpandQuery,
  matchesQuery,
  countKeywordMatches,
  extractMatchSnippet,
  HighlightMatch
} from '../utils/guideSearchUtils';

interface GuideSection {
  id: string;
  volume: 'system' | 'clinical';
  volumeNumber: string;
  category: string;
  title: string;
  subtitle: string;
  icon: React.ReactElement;
  tags: string[];
  searchableText: string;
  content: React.ReactNode;
  directAppPath?: string;
  directAppLabel?: string;
  directAppTooltip?: string;
}

export default function UserGuide() {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedVolume, setSelectedVolume] = useState<'all' | 'system' | 'clinical'>('all');
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || params.get('search') || '';
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'section-entities': true,
    'section-formulas': false,
    'section-flow': false,
    'section-input': false,
    'section-screens': false,
    'section-fiscal': false,
    'section-services-health': false,
    'section-test-daemon': false,
    'section-print': false,
    'section-faq': false,
    'section-ortho-templates': false,
    'section-ortho-tests-registry': false,
    'section-diagnostic-methods-registry': false,
    'section-ortho-manipulations': false,
    'section-ortho-physiotherapy': false,
    'section-ortho-orthotics': false,
    'section-ortho-lfk': false,
    'section-ortho-rom': false,
  });

  const printRef = useRef<HTMLDivElement>(null);
  const posFiscalPrintRef = useRef<HTMLDivElement>(null);

  const handlePrintTrigger = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Руководство_пользователя_ОртоERP_v2.0.1_${new Date().toISOString().slice(0, 10)}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `
  });

  const handlePrintPosFiscalManual = useReactToPrint({
    contentRef: posFiscalPrintRef,
    documentTitle: `Инструкция_кассира_Эквайринг_и_Фискализация_АльфаБанк_АТОЛ91Ф_${new Date().toISOString().slice(0, 10)}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `
  });

  const sections: GuideSection[] = useMemo(() => [
    {
      id: 'section-entities',
      volume: 'system',
      volumeNumber: '1.1',
      category: 'architecture',
      title: '1.1 Концептуальная модель данных и взаимосвязь сущностей',
      subtitle: 'Реляционная архитектура базы данных SQLite (96 таблиц), ключевые каталоги и ссылочная целостность (Foreign Keys)',
      icon: <AccountTreeIcon sx={{ color: '#0F3C64' }} />,
      directAppPath: '/inventory',
      directAppLabel: 'Склад & БД',
      directAppTooltip: 'Перейти в картотеку расходных материалов и склада',
      tags: ['сущности', 'бд', 'архитектура', 'модель данных', 'связи', 'patients', 'staff', 'operations', 'materials', 'payouts', 'foreign keys', 'таблицы', '96 таблиц', '61298 пациентов'],
      searchableText: `
        Реляционная модель данных SQLite foreign keys ON 96 таблиц
        patients 61298 пациентов ЭМК mednum full_name phone last_visit_date
        protocols 32882 протоколов осмотра приемов
        patient_visits 37538 визитов
        services 63010 оказанных услуг
        diagnoses 14631 клинических диагнозов
        mkb 15038 записей МКБ-10
        servdict 382 услуги прейскуранта клиники
        staff 5 сотрудников клиники врачи ортопеды хирурги медсестры
        operations 321 операция номенклатура прайс price
        operation_materials 862 нормы расхода BOM спецификация технологическая карта
        materials_catalog 427 расходных материалов склад current_unit_cost package_cost
        operation_transactions 4118 проведенных транзакций
        ortho_templates 180 клинических шаблонов протоколов по 11 кластерам
        ortho_test_catalog 1377 ортопедических тестов доказательной биомеханики
        diagnostic_methods_catalog 381 метод инструментальной и лучевой диагностики
        ortho_manipulations_catalog 26 лечебных манипуляций и инъекций PRP блокады
        ortho_physiotherapy_catalog 21 метод высокоинтенсивной физиотерапии HILT SIS УВТ
        ortho_orthotics_catalog 26 ортопедических изделий брейсы ортезы стельки
        ortho_lfk_catalog 29 комплексов ЛФК и кинезиотерапии
        staff_payout_schemes 3 схемы выплат Хирургия 35% Консультации 25% Сестринское 10%
        staff_payout_settings персональные ставки гарантированные минимумы 1500 400
        service_calculation_locks lock_token soft lock мягкая блокировка 30 минут таймаут
        pos_terminal_settings Arcus-2 INPAS COM4 115200 TID ALFA_770192 MID MERCH_884102
        fiscal_device_settings АТОЛ 91Ф COM3 Mock org_name ИЧП Добрушкин А.М. ИНН 450107060083 ОГРНИП 323237500208220
        fiscal_receipts 54-ФЗ ФД ФПД ФН тег 1008 ОФД sell sell_return
        fiscal_audit_logs 608 записей Serilog log_level fptr10 кассовые события аудит
      `,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
            Система МИС «ОртоERP» построена на единой реляционной СУБД SQLite (<code>orthopedic_data_center.sqlite</code>, 96 таблиц) с включенным контролем внешних ключей (<code>PRAGMA foreign_keys = ON</code>) и режимом журналирования WAL. Это гарантирует абсолютную ссылочную целостность: ни один сервис, визит, протокол или начисление не могут существовать без родительских записей пациента и врача.
          </Typography>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Сущность / Каталог</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Таблица в БД</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Записей в БД</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Ключевые поля и взаимосвязи</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Пациенты (ЭМК)</TableCell>
                  <TableCell><code>patients</code></TableCell>
                  <TableCell><strong>61 298</strong></TableCell>
                  <TableCell><code>id</code>, <code>mednum</code>, <code>full_name</code>, <code>phone</code>, <code>last_visit_date</code>. Родитель для визитов и протоколов</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Протоколы осмотра</TableCell>
                  <TableCell><code>protocols</code></TableCell>
                  <TableCell><strong>32 882</strong></TableCell>
                  <TableCell>Электронные протоколы консультаций и манипуляций со сквозным поиском FTS</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Визиты пациентов</TableCell>
                  <TableCell><code>patient_visits</code></TableCell>
                  <TableCell><strong>37 538</strong></TableCell>
                  <TableCell>История амбулаторных обращений, связка пациента с договором и приемом</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Оказанные услуги</TableCell>
                  <TableCell><code>services</code></TableCell>
                  <TableCell><strong>63 010</strong></TableCell>
                  <TableCell>Фактически выполненные процедуры, манипуляции и диагностика пациентов</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Клинические шаблоны 2.0</TableCell>
                  <TableCell><code>ortho_templates</code></TableCell>
                  <TableCell><strong>180</strong></TableCell>
                  <TableCell>180 шаблонов по 11 анатомическим кластерам с Neutral-0 ROM и планами лечения</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Ортопедические тесты</TableCell>
                  <TableCell><code>ortho_test_catalog</code></TableCell>
                  <TableCell><strong>1 377</strong></TableCell>
                  <TableCell>Доказательные тесты биомеханики (Se/Sp, классы A/B/C, 1626 связок с шаблонами)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Аппаратная диагностика</TableCell>
                  <TableCell><code>diagnostic_methods_catalog</code></TableCell>
                  <TableCell><strong>381</strong></TableCell>
                  <TableCell>Рентген, МРТ 1.5–3.0 Тл, УЗИ, КТ 3D, ЭНМГ с привязкой к прейскуранту servdict</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Лечебные манипуляции</TableCell>
                  <TableCell><code>ortho_manipulations_catalog</code></TableCell>
                  <TableCell><strong>26</strong></TableCell>
                  <TableCell>PRP Cortexil 10/20 мл, гиалуронат, блокады под УЗИ-навигацией (494 связки)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Аппаратная физиотерапия</TableCell>
                  <TableCell><code>ortho_physiotherapy_catalog</code></TableCell>
                  <TableCell><strong>21</strong></TableCell>
                  <TableCell>HILT лазер, SIS магнит, фокусная/радиальная УВТ, TECAR (969 связок)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Ортезирование и разгрузка</TableCell>
                  <TableCell><code>ortho_orthotics_catalog</code></TableCell>
                  <TableCell><strong>26</strong></TableCell>
                  <TableCell>Брейсы, туторы, стельки Formthotics, шкала осевой нагрузки NWB–FWB (353 связки)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Кинезиотерапия и ЛФК</TableCell>
                  <TableCell><code>ortho_lfk_catalog</code></TableCell>
                  <TableCell><strong>29</strong></TableCell>
                  <TableCell>Программы ЛФК по модели Silbernagel, 3 фазы, мониторинг боли (266 связок)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Сотрудники клиники</TableCell>
                  <TableCell><code>staff</code></TableCell>
                  <TableCell><strong>5</strong></TableCell>
                  <TableCell>Врачи-ортопеды, хирурги, старшая медицинская сестра, связка со схемами выплат</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Каталог операций</TableCell>
                  <TableCell><code>operations</code></TableCell>
                  <TableCell><strong>321</strong></TableCell>
                  <TableCell>Номенклатура хирургических и инвазивных сервисов клиники с базовой ценой</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Спецификации расхода BOM</TableCell>
                  <TableCell><code>operation_materials</code></TableCell>
                  <TableCell><strong>862</strong></TableCell>
                  <TableCell>Нормы списания расходных материалов технологической карты на каждую услугу</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Склад медикаментов</TableCell>
                  <TableCell><code>materials_catalog</code></TableCell>
                  <TableCell><strong>427</strong></TableCell>
                  <TableCell>Медицинские расходные материалы, учетная стоимость единицы и упаковки</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Схемы вознаграждения</TableCell>
                  <TableCell><code>staff_payout_schemes</code></TableCell>
                  <TableCell><strong>3</strong></TableCell>
                  <TableCell>Хирургия (35%), Консультации (25%), Сестринское (10%), лимит Team Cap (60%)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Кассовые профили и логи</TableCell>
                  <TableCell><code>fiscal_receipts</code> / <code>fiscal_audit_logs</code></TableCell>
                  <TableCell><strong>18</strong> / <strong>608</strong></TableCell>
                  <TableCell>Фискальные документы 54-ФЗ (ФД, ФПД, ФН, тег 1008) и Serilog аудит fptr10</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )
    },
    {
      id: 'section-formulas',
      volume: 'system',
      volumeNumber: '1.2',
      category: 'formulas',
      title: '1.2 Параметры настройки и математические алгоритмы расчетов',
      subtitle: 'Формулы себестоимости материалов BOM, наценка 1.15, маржинальная база, гарантированные минимумы, Team Cap 60% и фискальный НДС',
      icon: <CalculateIcon sx={{ color: '#0F3C64' }} />,
      directAppPath: '/operations',
      directAppLabel: 'Операции & Маржа',
      directAppTooltip: 'Перейти в журнал операций и калькулятор маржинальности',
      tags: ['формулы', 'расчет', 'себестоимость', 'bom', 'маржа', 'ставки', 'минимумы', 'team cap', 'storno', 'математика', '1.15', 'payout', 'ндс 5%'],
      searchableText: `
        Математические формулы алгоритмы расчетов KaTeX LaTeX
        1. Себестоимость расходных материалов технологической карты BOM material_cost_factor 1.15 +15%
        2. Маржинальная база клиники Margin Base max 0 Price - Cost
        3. Сдельное вознаграждение специалиста Staff Payout max Base * Rate / 100 MinPayout 1500 400
        4. Контроль перерасхода фонда оплаты труда Team Cap Guard max_team_cap_percent 60% isExceedingCap
        5. Ручные корректировки manual_adjustment сторнирование Storno Reversal
        6. Фискальный расчет суммы чека и НДС 5% УСН статья 164 НК РФ Total * 5 / 105
      `,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Formula 1: BOM Cost */}
          <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              1. Себестоимость расходных материалов технологической карты (BOM)
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1.5, lineHeight: 1.6 }}>
              Фактический расход списывается по нормам спецификации технологической карты с учетом системного коэффициента накладных расходов клиники <code>material_cost_factor</code> (в таблице <code>calculation_parameters</code> равен <strong>1.15</strong>, т.е. +15% на транспортировку, хранение и стерилизацию):
            </Typography>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 2, mb: 1.5 }}>
              <LatexText
                text="$$S_{\text{mat}} = \left( \sum_{i=1}^{n} Q_i \cdot P_i \right) \cdot k_{\text{overhead}}$$"
                component="div"
              />
              <Typography variant="caption" sx={{ display: 'block', color: '#64748B', mt: 1, textAlign: 'center' }}>
                где <LatexText text="$Q_i$" /> — списанное количество $i$-го материала, <LatexText text="$P_i$" /> — учетная цена единицы (<code>current_unit_cost</code>), <LatexText text="$k_{\text{overhead}} = 1.15$" />.
              </Typography>
            </Paper>
          </Box>

          {/* Formula 2: Margin Base */}
          <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              2. Маржинальная база клиники (Margin Base)
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1.5, lineHeight: 1.6 }}>
              Маржинальная база — это очищенный финансовый остаток стоимости сервиса после покрытия прямых расходов на медикаменты. База строго ограничена снизу нулем:
            </Typography>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 2, mb: 1.5 }}>
              <LatexText
                text="$$M_{\text{base}} = \max\left(0,\, P_{\text{service}} - S_{\text{mat}}\right)$$"
                component="div"
              />
            </Paper>
            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
              <strong>Защита от отрицательной базы (Кейс C):</strong> Если стоимость расходников превышает цену сервиса (<LatexText text="$S_{\text{mat}} \ge P_{\text{service}}$" />), маржинальная база равна <LatexText text="$0\text{ ₽}$" />, но персонал гарантированно получает выплаты по фиксированным минимальным ставкам (1 500 ₽ врачу и 400 ₽ медсестре).
            </Alert>
          </Box>

          {/* Formula 3: Staff Payout */}
          <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              3. Сдельное вознаграждение специалиста (Staff Payout) и распределение ролей
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1.5, lineHeight: 1.6 }}>
              Выплата каждому участнику приема рассчитывается по тарифной ставке с контролем персонального минимума (<code>fixed_min_payout</code>):
            </Typography>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 2, mb: 1.5 }}>
              <LatexText
                text="$$\text{Payout}_j = \max\left( M_{\text{base}} \cdot \frac{R_j}{100},\, \text{MinPayout}_j \right)$$"
                component="div"
              />
              <Typography variant="caption" sx={{ display: 'block', color: '#64748B', mt: 1, textAlign: 'center' }}>
                где <LatexText text="$R_j$" /> — ставка специалиста по схеме (Хирург: <LatexText text="$35\%$" />, Консультант: <LatexText text="$25\%$" />, Сестра: <LatexText text="$10\%$" />), <LatexText text="$\text{MinPayout}_j$" /> — гарантированный минимум.
              </Typography>
            </Paper>
            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.6 }}>
              • <strong>Соло-врач (Solo Doctor):</strong> если назначение медсестры отсутствует (<code>nurse_id: null</code>), начисление сестре строго равно <LatexText text="$0\text{ ₽}$" />, а врач получает вознаграждение по своей ставке.<br />
              • <strong>Операционная бригада (Brigade):</strong> маржинальная база распределяется согласно долям схемы (например, 35% хирургу и 10% операционной сестре).
            </Typography>
          </Box>

          {/* Formula 4: Team Cap Guard */}
          <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              4. Контроль перерасхода фонда оплаты труда (Team Cap Guard)
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1.5, lineHeight: 1.6 }}>
              Для предотвращения кассовых разрывов в каждой тарифной схеме зафиксирован максимальный лимит суммарной доли бригады (<code>max_team_cap_percent</code> = <strong>60%</strong>):
            </Typography>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 2, mb: 1.5 }}>
              <LatexText
                text="$$\sum_{j=1}^{m} R_j \le \text{Cap}_{\max} = 60\%$$"
                component="div"
              />
            </Paper>
            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.88rem' }}>
              Если суммарная ставка хирурга (35%), ассистента (25%) и сестры (15%) дает 75%, система автоматически выставляет флаг <code>isExceedingCap: true</code> и блокирует коммит ведомости до согласования с главным экономистом.
            </Typography>
          </Box>

          {/* Formula 5: Storno Reversal */}
          <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              5. Корректировки и Сторнирование (Storno Reversal)
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1.5, lineHeight: 1.6 }}>
              При возврате средств пациенту или обнаружении ошибки в расчете выполняется зеркальное сторнирование начисления:
            </Typography>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 2 }}>
              <LatexText
                text="$$\text{Payout}_{\text{final}} = \text{Payout}_{\text{base}} + \Delta_{\text{manual}}, \qquad \Delta_{\text{storno}} = -\text{Payout}_{\text{final}}$$"
                component="div"
              />
            </Paper>
          </Box>

          {/* Formula 6: Fiscal & VAT */}
          <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              6. Фискальный расчет суммы чека и НДС (ст. 164 НК РФ)
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1.5, lineHeight: 1.6 }}>
              Клиника применяет специальный налоговый режим УСН с расчетной ставкой НДС 5% (ст. 164 НК РФ). Налог выделяется из итоговой суммы чека без округления копеек:
            </Typography>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 2 }}>
              <LatexText
                text="$$\text{Total} = \sum_{k=1}^{K} (\text{Price}_k \cdot Q_k) - \text{Discount}, \qquad \text{VAT}_{5\%} = \text{Total} \cdot \frac{5}{105}$$"
                component="div"
              />
            </Paper>
          </Box>
        </Box>
      )
    },
    {
      id: 'section-flow',
      volume: 'system',
      volumeNumber: '1.3',
      category: 'flow',
      title: '1.3 Регламентный поток бизнес-процесса (Flow) и комбинации визитов',
      subtitle: 'Жизненный цикл оказания сервисов: Single/Multi услуги, Solo/Brigade персонал, блокировки, ACID коммит и сторно',
      icon: <TimelineIcon sx={{ color: '#0F3C64' }} />,
      directAppPath: '/operations',
      directAppLabel: 'Поток визитов',
      directAppTooltip: 'Перейти в мастер оформления визита и списания',
      tags: ['flow', 'бизнес-процесс', 'жизненный цикл', 'single service', 'multi services', 'пакет услуг', 'solo doctor', 'бригада', 'блокировка', 'коммит', 'сторно', 'корректировка', 'ведомость'],
      searchableText: `
        Комбинации визитов и назначений персонала
        FL-V01 Single Service Single Staff Соло-врач 1 консультация nurse_id null медсестре 0 доктору 30% 1500 ровно 1 процедура 1 начисление
        FL-V02 Single Service Multi Staff Бригада 1 сложная услуга PRP-терапия 18000 расходники 3500 маржа 14500 хирург 35% 5075 медсестра 10% 1450 ровно 1 процедура 2 начисления
        FL-V03 Multi Services Single Staff Пакет услуг Соло-врач консультация 5000 блокада сустава 8000 расчет обеих позиций в рамках визита сестре 0 врачу 2 процедуры 2 начисления
        FL-V04 Multi Services Multi Staff Пакет операций Бригада Артроскопия 35000 PRP 18000 53000 раздельный расчет маржи по каждой позиции 2 процедуры 4 начисления
        FL-V05 Appointment Flow завершенный прием appointments status completed попадание в unbilled-services со source_type appointment привязка appointment_id
        Мягкая блокировка Soft Lock lockToken таймаут 30 минут
        Атомарный ACID коммит procedure_records staff_payout_accruals
        Deduplication Guard dedup_hash уникальный хеш защита от повторного коммита
        Ручные корректировки manual_adjustment +500 надбавка
        Сторнирование Storno статус storno storno_reversal отрицательная выплата -1750
      `,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
            МИС «ОртоERP» стандартизирует все возможные клинические комбинации приема через строго определенные эталонные профили потока (Flow Templates FL-V01 — FL-V05):
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label="FL-V01" size="small" sx={{ bgcolor: '#0F3C64', color: '#FFFFFF', fontWeight: 800 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                  Single Service + Solo Doctor (1 услуга, 1 врач)
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.86rem', lineHeight: 1.5 }}>
                Пример: Первичная консультация ортопеда (5 000 ₽). Назначение медсестры отсутствует (<code>nurse_id: null</code>). Результат: начисление медсестре строго равно 0 ₽, врач получает 30% от маржи (1 500 ₽). Итог: 1 процедура, 1 начисление.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label="FL-V02" size="small" sx={{ bgcolor: '#0F3C64', color: '#FFFFFF', fontWeight: 800 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                  Single Service + Brigade (1 услуга, бригада)
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.86rem', lineHeight: 1.5 }}>
                Пример: PRP Cortexil 20 мл (18 000 ₽). Расходники BOM с наценкой 1.15 составляют 3 500 ₽. Маржинальная база: 14 500 ₽. Хирург получает 35% (5 075 ₽), операционная медсестра — 10% (1 450 ₽). Итог: 1 процедура, 2 начисления.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label="FL-V03" size="small" sx={{ bgcolor: '#0F3C64', color: '#FFFFFF', fontWeight: 800 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                  Multi Services + Solo Doctor (Пакет услуг, соло-врач)
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.86rem', lineHeight: 1.5 }}>
                Пример: Консультация (5 000 ₽) + Параартикулярная блокада под УЗИ (8 000 ₽). Врач проводит манипуляцию один. Система рассчитывает маржинальную базу отдельно по каждой позиции визита. Сестре — 0 ₽. Итог: 2 процедуры, 2 начисления врачу.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label="FL-V04" size="small" sx={{ bgcolor: '#0F3C64', color: '#FFFFFF', fontWeight: 800 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                  Multi Services + Brigade (Пакет услуг, бригада)
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.86rem', lineHeight: 1.5 }}>
                Пример: Артроскопическая санация сустава (35 000 ₽) + PRP-терапия (18 000 ₽). В операции участвуют хирург и операционная медсестра. Раздельный расчет маржи по каждой позиции чека. Итог: 2 процедуры, 4 раздельных начисления.
              </Typography>
            </Paper>
          </Box>

          <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip label="FL-V05" size="small" sx={{ bgcolor: '#0284C7', color: '#FFFFFF', fontWeight: 800 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0369A1' }}>
                Appointment Flow: Автоматический сквозной переход из расписания в биллинг
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#0C4A6E', lineHeight: 1.6 }}>
              Как только врач завершает прием в электронном расписании (<code>appointments.status = 'completed'</code>), оказанные услуги мгновенно попадают в очередь необработанных сервисов (<code>/unbilled-services</code>) со статусом <code>source_type: 'appointment'</code> и сохранением ссылки на <code>appointment_id</code>. Экономисту не требуется повторно заносить фамилии и номенклатуру.
            </Typography>
          </Paper>

          <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              Механизмы защиты финансового контура клиники
            </Typography>
            <Box component="ul" sx={{ pl: 2.5, m: 0, color: '#334155', '& li': { mb: 1, fontSize: '0.88rem' } }}>
              <li><strong>Мягкая блокировка (Soft Lock):</strong> При открытии сервиса в мастере расчета сервер выдает временный маркер <code>lockToken</code> на 30 минут. Другие операторы видят уведомление о блокировке и не могут перезаписать расчет.</li>
              <li><strong>Атомарный коммит (ACID Transaction):</strong> Запись в <code>procedure_records</code> и начисления в <code>staff_payout_accruals</code> проводятся в единой транзакции SQLite. При сбое питания откат происходит автоматически.</li>
              <li><strong>Защита от повторного расчета (Deduplication Guard):</strong> Для каждого сервиса рассчитывается дедупликационный хеш <code>dedup_hash</code> на основе <code>source_type + source_id + visit_date</code>. Повторное включение услуги в ведомость физически заблокировано уникальным индексом.</li>
            </Box>
          </Box>
        </Box>
      )
    },
    {
      id: 'section-input',
      volume: 'system',
      volumeNumber: '1.4',
      category: 'workflow',
      title: '1.4 Порядок определения и ввода первичных данных',
      subtitle: 'Регламент заведения номенклатуры, спецификаций BOM, картотеки пациентов и врачей',
      icon: <InputIcon sx={{ color: '#0F3C64' }} />,
      directAppPath: '/patients',
      directAppLabel: 'ЭМК Пациенты',
      directAppTooltip: 'Перейти в картотеку пациентов клиники',
      tags: ['первичные данные', 'ввод', 'номенклатура', 'bom', 'пациенты', 'врачи', 'склад', 'регламент'],
      searchableText: `
        Порядок определения и ввода первичных данных регламент администратора
        Шаг 1 Заведение каталога расходных материалов Склад materials_catalog упаковка штуки текущая цена
        Шаг 2 Формирование номенклатуры сервисов и технологических карт BOM operations operation_materials
        Шаг 3 Заведение сотрудников клиники и привязка схем выплат staff staff_payout_schemes staff_operation_rates
        Шаг 4 Синхронизация картотеки пациентов ЭМК Firebird sync patients 61298 пациентов
      `,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
            Для корректного функционирования математического движка первичные данные клиники заносятся в строгой последовательности:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Шаг 1. Формирование складского каталога материалов (<code>/inventory</code>)
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontSize: '0.88rem' }}>
                Заводятся все медикаменты, расходники, шовный материал и анестетики. Указывается единица списания (шт, мл, амп) и актуальная закупочная цена за единицу (<code>current_unit_cost</code>).
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Шаг 2. Заведение номенклатуры услуг и спецификаций BOM (<code>/operations</code>)
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontSize: '0.88rem' }}>
                Создается номенклатурная позиция, фиксируется базовая цена для пациента. В блоке «Спецификация BOM» из складского справочника добавляются требуемые материалы с нормами их расхода.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Шаг 3. Регистрация сотрудников и настройка тарифных сеток (<code>/staff</code>)
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontSize: '0.88rem' }}>
                Врачам и медсестрам присваиваются роли, активные схемы выплат (Хирургия 35%, Консультации 25%, Сестринское 10%) и персональные гарантированные минимумы.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Шаг 4. Импорт и синхронизация пациентов из медицинской базы Firebird (<code>/sync</code>)
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontSize: '0.88rem' }}>
                При первичном запуске или регулярном обновлении выполняется инкрементальная синхронизация с файлом <code>MEDICAL.FDB</code> (61 298 пациентов, 32 882 протокола, 37 538 визитов).
              </Typography>
            </Paper>
          </Box>
        </Box>
      )
    },
    {
      id: 'section-screens',
      volume: 'system',
      volumeNumber: '1.5',
      category: 'screens',
      title: '1.5 Спецификация ключевых рабочих экранов МИС',
      subtitle: 'Подробное руководство по функционалу каждого раздела веб-приложения',
      icon: <DesktopWindowsIcon sx={{ color: '#0F3C64' }} />,
      directAppPath: '/reports',
      directAppLabel: 'Отчеты & Экраны',
      directAppTooltip: 'Перейти к генератору отчетов и сводным таблицам',
      tags: ['экраны', 'интерфейс', 'dashboard', 'расписание', 'калькулятор', 'checkout', 'payouts', 'ведомости', 'отчеты', 'аналитика', 'касса'],
      searchableText: `
        Рабочие экраны функции системы
        Главная панель Dashboard KPI выручка начисления маржинальность
        Электронная регистратура и расписание Scheduling талоны запись врачи кабинеты
        АРМ врача-ортопеда OrthoWorkstation осмотр тесты диагнозы гониометрия ROM
        Мастер расчета выплат Checkout Wizard пошаговый расчет замена материалов BOM ручные корректировки
        Ведомости и выплаты StaffPayouts закрытие периода утверждение печать экспорт Excel
        Журнал кассовых чеков FiscalAuditLog электронный образ чека дубликат QR-код ОФД
        Мастер тестирования эквайринга PosTestWizard пробный платеж слип отказ карты
      `,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
            Интерфейс «ОртоERP» разделен на специализированные рабочие места:
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                📊 Главный дашборд руководителя (<code>/</code>)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.85rem' }}>
                Сводные показатели клиники в реальном времени: выручка за день/месяц, фонд оплаты труда врачей, чистая маржа клиники, диаграммы загрузки операционных.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                🩺 АРМ врача-ортопеда (<code>/ortho-workstation</code>)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.85rem' }}>
                Клинический осмотр: анатомический гомункулус, выбор шаблонов по МКБ-10, доказательные ортопедические тесты (Se/Sp), Neutral-0 гониометрия и передача в биллинг.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                💳 Мастер расчета и касса (<code>/checkout</code>)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.85rem' }}>
                Двухфазная оплата: авторизация на POS-терминале Альфа-Банка, фискализация на АТОЛ 91Ф (54-ФЗ), списание материалов BOM и начисление вознаграждения бригаде.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                📑 Ведомости выплат сотрудникам (<code>/payouts</code>)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.85rem' }}>
                Группировка начислений по расчетным периодам, ручные премии и сторно, контроль Team Cap, печать расчетных листков А4 и экспорт в CSV для 1С:ЗУП.
              </Typography>
            </Paper>
          </Box>
        </Box>
      )
    },
    {
      id: 'section-fiscal',
      volume: 'system',
      volumeNumber: '1.6',
      category: 'fiscal',
      title: '1.6 Единый кассовый узел клиники: Банковский эквайринг «Альфа-Банк» (Arcus-2 / INPAS) и Фискализация «АТОЛ 91Ф» (54-ФЗ)',
      subtitle: 'Архитектурный паритет, двухфазная оплата визита, Defining (конфигурация), Using (регламент кассира) и Testing (диагностика)',
      icon: <PointOfSaleIcon sx={{ color: '#0F3C64' }} />,
      directAppPath: '/admin/pos-settings',
      directAppLabel: 'Настройки POS & ККТ',
      directAppTooltip: 'Перейти в параметры эквайринга и фискального регистратора',
      tags: ['эквайринг', 'альфа-банк', 'pos-терминал', 'arcus-2', 'inpas', 'ккт', 'атол', 'атол 91ф', 'фискализация', '54-фз', 'чек', 'слип', 'фд', 'фпд', 'фн', 'тег 1008', 'тег 1081', 'сбп', 'qr-код', 'команда 00', 'команда 05', 'команда 26', 'сверка итогов', 'reversal', 'void', 'defining', 'using', 'testing', 'mock', 'com-порт', 'z-отчет', 'х-отчет', 'кассир', 'сервисная панель', 'мастер тестирования'],
      searchableText: `
        Единый кассовый узел клиники эквайринг Альфа-Банк АТОЛ 91Ф 54-ФЗ ФФД 1.2
        1. DEFINING ОПРЕДЕЛЕНИЕ И АРХИТЕКТУРНАЯ КОНФИГУРАЦИЯ
        Протокол Arcus-2 INPAS ДТО 10 fptr10.dll pos.exe arcade.dll
        Таблицы pos_terminal_settings fiscal_device_settings pos_transactions fiscal_receipts
        Аппаратные интерфейсы COM4 COM3 115200 бод TCP/IP Ethernet 192.168.1.150:8888 USB-HID
        Путь к драйверу driver_executable_path C:\Arcus2\pos.exe C:\sc552\pos.exe C:\DualConnector\pos.exe
        Банковские реквизиты Terminal ID TID ALFA_770192 Merchant ID MID MERCH_884102 Валюта 643 RUB
        Режимы работы Физический терминал Real Hardware vs Эмуляция Mock Mode
        Сценарии симуляции Успех 00 Недостаточно средств 51 Отмена клиентом 99 Таймаут PIN 68
        Идемпотентность transaction_uuid GUID дедупликация RRN 12 цифр Код авторизации AuthCode
        2. USING ИСПОЛЬЗОВАНИЕ И РЕГЛАМЕНТ КАССИРА
        Двухфазная оплата Two-Phase Commit Фаза 1 Банковская авторизация Команда 00 ввод PIN СБП QR печать 2 слипов
        Фаза 2 Фискализация чека на ККТ АТОЛ 91Ф признак безналичного расчета Тег 1081 контакт Тег 1008 ОФД
        Закрытие документа ФД № ФПД ФН № QR-код фиксация в БД
        Отмена и возврат Reversal Void отмена в текущей смене без комиссии возврат прихода sell_return
        Сверка итогов с банком Команда 26 Settlement слип сверки закрытие банковского дня
        Кассовая смена ККТ 24 часа лимит X-отчет Z-отчет с гашением калькулятор купюр и монет акт А4
        3. TESTING ТЕСТИРОВАНИЕ ДИАГНОСТИКА И УСТРАНЕНИЕ НЕПОЛАДОК
        Сервисная панель диагностики PosDeviceCard Команда 05 Host Ping Echo Test 5 шагов проверки:
        1 Шлюз Express API 2 Исполняемый модуль драйвера pos.exe 3 Порт COM4 4 Пинг хоста RTT ms 5 Криптографические ключи
        Мастер тестирования эквайринга /admin/pos-test-wizard тестовый платеж 1.00 100.00 руб печать слипа react-to-print
        Таблица неисправностей Файл не найден Порт занят -6 Сбой связи 96 Отказ карты 51 Смена превысила 24 часа 0x48
      `,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Header Overview Card */}
          <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0369A1', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CreditCardIcon /> Концепция распределённого кассового узла клиники
            </Typography>
            <Typography variant="body2" sx={{ color: '#0C4A6E', lineHeight: 1.6 }}>
              В «Центре Ортопедии и Травматологии Добрушкина» кассовый узел представляет собой синхронную связку двух физических аппаратов: 
              <strong> банковского POS-терминала эквайринга АО «Альфа-Банк»</strong> (протоколы Arcus-2 / INPAS) и 
              <strong> фискального регистратора «АТОЛ 91Ф»</strong> (протокол ДТО 10 / 54-ФЗ).
              Оба устройства обладают полной архитектурной симметрией: поддержка физического режима и автономного режима эмуляции (Mock Mode), хранение профилей в SQLite, выделенные панели диагностики и суточная сверка итогов.
            </Typography>
          </Paper>

          {/* PART 1: DEFINING */}
          <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Chip label="ЧАСТЬ 1" size="small" sx={{ bgcolor: '#0F3C64', color: '#FFFFFF', fontWeight: 800 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '1.05rem' }}>
                Defining: Архитектура, аппаратная конфигурация и параметры оборудования
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ color: '#334155', mb: 2, lineHeight: 1.6 }}>
              Конфигурация кассового узла хранится в базе данных SQLite в таблицах <code>pos_terminal_settings</code> (эквайринг) и <code>fiscal_device_settings</code> (ККТ). Это обеспечивает мгновенное переключение рабочих мест и независимость от перезапуска сервера:
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CreditCardIcon fontSize="small" /> Эквайринг «Альфа-Банк» (Arcus-2 / INPAS)
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0, color: '#475569', '& li': { mb: 0.5, fontSize: '0.85rem' } }}>
                  <li><strong>Протоколы:</strong> Arcus-2 (драйвер <code>pos.exe</code>) и INPAS DualConnector 2.x (XML-протокол).</li>
                  <li><strong>Интерфейс:</strong> COM4 (115200 бод) или сокет TCP/IP (порт 8888).</li>
                  <li><strong>Идентификаторы:</strong> TID: <code>ALFA_770192</code>, MID: <code>MERCH_884102</code>.</li>
                  <li><strong>Идемпотентность:</strong> GUID <code>transaction_uuid</code>, RRN (12 цифр), AuthCode.</li>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PointOfSaleIcon fontSize="small" /> Онлайн-касса «АТОЛ 91Ф» (54-ФЗ)
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0, color: '#475569', '& li': { mb: 0.5, fontSize: '0.85rem' } }}>
                  <li><strong>Протокол:</strong> АТОЛ ДТО 10 (библиотека <code>fptr10.dll</code>), порт COM3 (115200 бод).</li>
                  <li><strong>Формат данных:</strong> ФФД 1.2, тег 1081 (безналичные), тег 1008 (телефон/email ОФД).</li>
                  <li><strong>Налогообложение:</strong> УСН Доходы минус расходы, специальная ставка НДС 5%.</li>
                  <li><strong>Реквизиты клиники:</strong> ИЧП Добрушкин А.М., ИНН 450107060083, г. Сочи, ул. Транспортная 65.</li>
                </Box>
              </Paper>
            </Box>
          </Box>

          {/* PART 2: USING */}
          <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Chip label="ЧАСТЬ 2" size="small" sx={{ bgcolor: '#0284C7', color: '#FFFFFF', fontWeight: 800 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '1.05rem' }}>
                Using: Регламент кассира и двухфазная оплата визита (Two-Phase Commit)
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ color: '#334155', mb: 2, lineHeight: 1.6 }}>
              При оформлении оплаты в мастере <code>/checkout</code> исключен риск рассинхронизации между снятием денег с карты и фискализацией чека благодаря двухфазному коммиту:
            </Typography>

            <Box component="ol" sx={{ pl: 2.5, m: 0, color: '#334155', '& li': { mb: 1.5, fontSize: '0.88rem' } }}>
              <li><strong>Фаза 1: Авторизация на POS-терминале (Команда 00):</strong> Кассир выбирает безналичную оплату. Терминал активирует считыватель карт или выводит QR-код СБП. Пациент вводит PIN-код. При получении одобрения от банка (код <code>00</code>) печатаются 2 банковских слипа.</li>
              <li><strong>Фаза 2: Фискализация чека на ККТ АТОЛ 91Ф:</strong> Только после успешной банковской авторизации система передает чек в ККТ с признаком безналичного расчета (Тег 1081). Фискальный накопитель регистрирует фискальный признак документа (ФПД) и номер чека (ФД).</li>
              <li><strong>Сверка итогов эквайринга (Команда 26):</strong> В конце рабочей смены кассир нажимает кнопку «Сверка итогов эквайринга». Терминал передает финансовый отчет в процессинг Альфа-Банка и печатает итоговый слип закрытия банковского дня.</li>
              <li><strong>Закрытие смены ККТ (Z-отчет):</strong> Смена в фискальном накопителе не может превышать 24 часа. Кассир производит пересчет наличных в денежном ящике и снимает Z-отчет с автоматическим формированием акта А4.</li>
            </Box>
          </Box>

          {/* PART 3: TESTING */}
          <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Chip label="ЧАСТЬ 3" size="small" sx={{ bgcolor: '#16A34A', color: '#FFFFFF', fontWeight: 800 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '1.05rem' }}>
                Testing: Диагностика, мастер тестирования и устранение неполадок
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ color: '#334155', mb: 2, lineHeight: 1.6 }}>
              Для гарантированной бесперебойной работы на точке приёма пациентов в систему встроены инструменты пошаговой аппаратной диагностики:
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              3.1. Сервисная панель диагностики эквайринга: Тест связи с процессингом (Команда 05)
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1.5, lineHeight: 1.6 }}>
              При нажатии кнопки <strong>«Тест связи с процессингом (Команда 05)»</strong> запускается пошаговый диагностический протокол с замером задержки отклика (RTT ms) и проверкой 5 технологических уровней:
            </Typography>

            <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 2, mb: 2 }}>
              <Box component="ol" sx={{ pl: 2.5, m: 0, color: '#1E293B', '& li': { mb: 0.8, fontSize: '0.88rem' } }}>
                <li><strong>1. Сетевой шлюз МИС (Node.js API):</strong> Проверка доступности внутреннего маршрута <code>/api/pos/test-host</code> (RTT &lt; 2 мс).</li>
                <li><strong>2. Исполняемый модуль драйвера:</strong> Проверка физического присутствия файла <code>pos.exe</code> по настроенному пути. При ошибке прямо из окна доступна кнопка <em>«Изменить путь к файлу драйвера в «Параметры эквайринга «АО «АЛЬФА-БАНК»»</em>.</li>
                <li><strong>3. Интерфейс подключения к терминалу:</strong> Проверка готовности COM-порта (COM4, 115200 бод) или IP/Ethernet сокета.</li>
                <li><strong>4. Сеанс связи с хостом АО «Альфа-Банк» (Команда 05):</strong> Отправка Echo-запроса, замер задержки сети процессинга, получение кода ответа <code>00 (Успех)</code>.</li>
                <li><strong>5. Проверка криптографических ключей:</strong> Подтверждение актуальности сессионных и мастер-ключей терминала.</li>
              </Box>
            </Paper>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              3.2. Мастер тестирования эквайринга (<code>/admin/pos-test-wizard</code>)
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1.5, lineHeight: 1.6 }}>
              Встроенный мастер тестирования позволяет персоналу и системному администратору безопасно протестировать весь финансовый контур:
            </Typography>
            <Box component="ul" sx={{ pl: 2.5, m: 0, color: '#334155', '& li': { mb: 0.8, fontSize: '0.88rem' } }}>
              <li><strong>Тестовые транзакции:</strong> Быстрые кнопки для пробных оплат на 1.00 ₽, 100.00 ₽ или произвольную сумму.</li>
              <li><strong>Симуляция сбойных сценариев в Mock-режиме:</strong> Тестирование реакции интерфейса на отказ карты («Недостаточно средств — код 51», «Отмена клиентом на PIN-паде — код 99», «Таймаут ввода PIN-кода — код 68»).</li>
              <li><strong>Печать банковского слипа:</strong> Интерактивный шаблон печати слипа через <code>react-to-print</code> со всеми реквизитами (TID, MID, RRN, AuthCode, маска карты).</li>
              <li><strong>Журнал транзакций:</strong> Таблица с фильтрацией, поиском, подсчетом итогов и экспортом в Excel/CSV.</li>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mt: 2, mb: 1 }}>
              3.3. Таблица типовых неисправностей и регламент устранения
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Симптом / Ошибка</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Причина</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Регламент устранения</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#DC2626' }}>Файл не найден по пути C:\Arcus2\pos.exe</TableCell>
                    <TableCell>Драйвер установлен в другой каталог или отсутствует</TableCell>
                    <TableCell>В окне ошибки нажать «Изменить путь к файлу драйвера», выбрать пресет (напр. <code>C:\sc552\pos.exe</code>) или переключить профиль в Mock</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#DC2626' }}>Порт занят (-6) / Таймаут COM-порта</TableCell>
                    <TableCell>Порт COM3/COM4 захвачен сторонней утилитой (ДТО Тест, Putty)</TableCell>
                    <TableCell>Закрыть сторонние приложения, переподключить USB-кабель, проверить диспетчер устройств Windows</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#DC2626' }}>Сбой связи с процессингом (Код 96/99)</TableCell>
                    <TableCell>Нет доступа в интернет или регламентные работы на хосте банка</TableCell>
                    <TableCell>Проверить сетевой шлюз клиники, выполнить пинг хоста Альфа-Банка, перезагрузить терминал</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#DC2626' }}>Смена ККТ превысила 24 часа (Код 0x48)</TableCell>
                    <TableCell>Смена открыта более 24 часов назад (требование 54-ФЗ)</TableCell>
                    <TableCell>Перейти в <code>/admin/fiscal-shifts</code>, нажать «Закрыть смену (Z-отчет)», затем открыть новую смену</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#D97706' }}>Отказ карты пациентом (Код 51/68/99)</TableCell>
                    <TableCell>Недостаточно средств, таймаут PIN или отмена на PIN-паде</TableCell>
                    <TableCell>Предложить пациенту повторить попытку, использовать другую карту или оплатить через СБП (QR)</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )
    },
    {
      id: 'section-services-health',
      volume: 'system',
      volumeNumber: '1.7',
      category: 'services_health',
      title: '1.7 Мониторинг и диагностика доступности служб бэкенда',
      subtitle: 'Контроль состояния 6 серверных служб клиники: Express, SQLite, Fiscal Daemon, Firebird, Swagger, Backups',
      icon: <DnsIcon sx={{ color: '#0F3C64' }} />,
      directAppPath: '/admin/server-health',
      directAppLabel: 'Службы бэкенда',
      directAppTooltip: 'Открыть монитор доступности служб бэкенда',
      tags: ['сервер', 'службы', 'бэкенд', 'health', 'мониторинг', 'диагностика', 'express', 'sqlite', 'firebird', 'fiscal daemon', 'swagger', 'backups'],
      searchableText: `
        Мониторинг служб бэкенда диагностика доступности /admin/server-health GET /api/admin/services/status POST /api/admin/services/test-all
        1. Express REST API Gateway порт 5000 Node.js PID Uptime RAM RSS Heap память
        2. SQLite Database Storage orthopedic_data_center.sqlite WAL PRAGMA quick_check integrity ok foreign_keys ON 96 таблиц 61298 пациентов
        3. OrthoErp.FiscalService .NET Daemon порт 5050 KКТ АТОЛ 91Ф COM3 смена Serilog SQLite sink
        4. Firebird SQL Server MEDICAL.FDB порт 3050 61298 пациентов 37538 визитов 32882 протокола
        5. OpenAPI Swagger UI /api-docs спецификация 3.0 интерактивная документация REST API
        6. SQLite Hot Backup Subsystem VACUUM INTO backups/ авторезервирование ротация снимков
        Консоль выполнения проверок лог терминал задержка latency ms
      `,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
            Модуль <strong>«Статус и мониторинг сервисов бэкенда»</strong> (<code>/admin/server-health</code>) обеспечивает круглосуточный непрерывный контроль доступности всех 6 технологических компонентов ОртоERP:
          </Typography>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Компонент</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Адрес / Порт</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Контролируемые параметры</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Критерий нормы (ONLINE)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Express REST API Gateway</TableCell>
                  <TableCell><code>http://localhost:5000</code></TableCell>
                  <TableCell>Node.js процесс, PID, Uptime, потребление RAM (RSS, Heap), версия 2.0.1</TableCell>
                  <TableCell>HTTP 200 на <code>/health</code></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>SQLite Storage Engine</TableCell>
                  <TableCell><code>DB/orthopedic_data_center.sqlite</code></TableCell>
                  <TableCell>Целостность WAL, 96 таблиц, 61 298 пациентов, статус PRAGMA quick_check</TableCell>
                  <TableCell><code>integrity: ok</code>, foreign_keys: ON</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>OrthoErp.FiscalService (.NET Daemon)</TableCell>
                  <TableCell><code>http://localhost:5050</code></TableCell>
                  <TableCell>Служба Windows / KKT АТОЛ 91Ф, драйвер fptr10, Serilog SQLite sink</TableCell>
                  <TableCell>HTTP 200 на <code>/api/fiscal/status</code></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Firebird SQL Server</TableCell>
                  <TableCell><code>localhost:3050 (MEDICAL.FDB)</code></TableCell>
                  <TableCell>Шлюз синхронизации пациентов (61 298 карточек, 37 538 визитов, 32 882 протокола)</TableCell>
                  <TableCell>TCP-порт 3050 открыт, FB клиент доступен</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>OpenAPI / Swagger UI</TableCell>
                  <TableCell><code>http://localhost:5000/api-docs</code></TableCell>
                  <TableCell>Спецификация OpenAPI 3.0, схемы DTO и интерактивная консоль тестирования методов</TableCell>
                  <TableCell>Спецификация сгенерирована</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Hot Backup Subsystem</TableCell>
                  <TableCell><code>backups/ (VACUUM INTO)</code></TableCell>
                  <TableCell>Директория доступна для записи, ротация последних 7 снимков, размер и время свежего бэкапа</TableCell>
                  <TableCell>Резервная копия актуальна</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <strong>Глубокое тестирование в 1 клик:</strong> Нажатие кнопки <strong>«Запустить тест всех служб»</strong> последовательно проверяет все компоненты, измеряет фактическую задержку каждого соединения (latency) и выводит детальный протокол с отметками времени в терминальную консоль на экране.
          </Alert>
        </Box>
      )
    },
    {
      id: 'section-test-daemon',
      volume: 'system',
      volumeNumber: '1.8',
      category: 'test_daemon',
      title: '1.8 Автономный контур тестирования [TEST_DAEMON] (45 проверок)',
      subtitle: 'Изолированный контур валидации: Single/Multi услуги, Solo/Brigade персонал, ACID коммиты и BI сходимость',
      icon: <SmartToyIcon sx={{ color: '#0F3C64' }} />,
      directAppPath: '/admin/demo-data',
      directAppLabel: 'Демо & Тесты',
      directAppTooltip: 'Открыть панель демо-данных и автономного тест-демона',
      tags: ['тесты', 'test_daemon', 'демо-данные', 'fl-01', 'fl-v01', 'валидация', 'комбинации', 'очередь', 'acid', 'дедупликация'],
      searchableText: `
        Автономный контур демо-данных TEST_DAEMON 45 автоматизированных проверок FL-V01 FL-V05 FL-01 FL-14
        POST /api/payouts/daemon/seed POST /api/payouts/daemon/purge POST /api/payouts/daemon/run-tests
        FL-V01 Single Service Solo Doctor 1 услуга соло-врач сестре 0 1 процедура 1 начисление
        FL-V02 Single Service Brigade 1 услуга бригада хирург 35% медсестра 10% 1 процедура 2 начисления
        FL-V03 Multi Services Solo Doctor пакет услуг соло-врач 2 услуги врачу 2 процедуры 2 начисления
        FL-V04 Multi Services Brigade пакет операций бригада артроскопия PRP 2 процедуры 4 начисления
        FL-V05 Appointment Flow завершенный прием appointment_id
        FL-01 очередь FL-02 soft lock FL-03 схемы FL-04 наценка 1.15 FL-05 фикс-минимумы FL-06 Cap 60%
        FL-07 ACID коммит FL-08 дедупликация FL-09 ручная надбавка +500 FL-10 сторно -1750
        FL-11 BI KPI Summary сходимость FL-12 Margin Waterfall FL-13 CSV экспорт FL-14 печать ведомости А4
      `,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
            Панель <strong>«Управление демо-данными [TEST_DAEMON]»</strong> (<code>/admin/daemon-data</code>) обеспечивает полную изоляцию тестовых испытаний от реальных финансовых и клинических записей:
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                1. Заполнить БД (Seed)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.8, fontSize: '0.85rem' }}>
                Создает 3 тестовых сотрудников, 3 пациентов, 4 технологические карты с материалами, 22 начисления в 3 ведомостях и 4 необработанных визита в очереди с маркером <code>[TEST_DAEMON]</code>.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#DC2626' }}>
                2. Очистить демо-данные (Purge)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.8, fontSize: '0.85rem' }}>
                Мгновенное каскадное удаление всех тестовых записей из всех связанных таблиц БД SQLite с проверкой внешних ключей. Рабочая база остается безупречно чистой.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB' }}>
                3. Запуск 45 тестов потока
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.8, fontSize: '0.85rem' }}>
                Сквозной прогон сценариев FL-V01 — FL-V05 и FL-01 — FL-14: наценка 1.15, Soft Lock, ACID коммиты, дедупликация, сторно и сходимость в BI-аналитике.
              </Typography>
            </Paper>
          </Box>
        </Box>
      )
    },
    {
      id: 'section-print',
      volume: 'system',
      volumeNumber: '1.9',
      category: 'print',
      title: '1.9 Регламенты формирования отчетов, справок и печатные формы',
      subtitle: 'Стандарты вывода на печать бланков формата А4, термочеков 57 мм, сохранение в PDF и экспорт в MS Excel',
      icon: <DescriptionIcon sx={{ color: '#0F3C64' }} />,
      directAppPath: '/reports',
      directAppLabel: 'Печатные формы',
      directAppTooltip: 'Перейти к генератору отчетов и печатных форм',
      tags: ['печать', 'pdf', 'а4', 'ведомость', 'экспорт', 'excel', 'csv', 'react-to-print', 'термолента', 'чек'],
      searchableText: `
        Печатные формы А4 термолента 57 мм PDF MS Excel react-to-print
        Расчетная ведомость выплат сотрудникам А4 логотип MainLogoTransparent.png реквизиты клиники номер ведомости
        Защита от разрыва подписей pageBreakInside: avoid блок подписей главного врача и бухгалтера
        Печать дубликата чека ККТ термолента 57 мм QR-код проверки ФНС
        Экспорт в CSV Microsoft Excel UTF-8 с BOM uFEFF русскоязычные колонки точка с запятой 1С:ЗУП 1С:Бухгалтерия
      `,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
            Все печатные формы МИС «ОртоERP» разработаны по строгому корпоративному стандарту для медицинских учреждений:
          </Typography>

          <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              1. Расчетная ведомость выплат сотрудникам (Формат А4)
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.88rem' }}>
              • Фирменный логотип Центра ортопедии (<code>/MainLogoTransparent.png</code>).<br />
              • Полные реквизиты клиники, номер ведомости и временные рамки периода.<br />
              • <strong>Защита от разрыва подписей:</strong> итоговые суммы и блок подписей главного врача и бухгалтера объединены неделимым контейнером с CSS-директивой <code>pageBreakInside: 'avoid'</code>. Подписи никогда не вытесняются на пустую страницу.<br />
              • Готовность к сохранению в PDF прямо из диалога печати браузера («Сохранить как PDF»).
            </Typography>
          </Box>

          <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              2. Электронный образ и печать дубликата чека ККТ (Термолента 57 мм / А4)
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.88rem' }}>
              • В разделе <strong>«Журнал чеков»</strong> (<code>/fiscal-audit</code>) доступен предварительный просмотр точной копии чека ККТ.<br />
              • Поддерживается вывод на печать дубликата в формате кассовой термоленты шириной 57 мм.<br />
              • Возможность сохранения официальной фискальной квитанции с QR-кодом проверки чека в PDF для отправки пациенту или в страховую компанию.
            </Typography>
          </Box>

          <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              3. Экспорт данных в CSV (Microsoft Excel)
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.88rem' }}>
              • Файлы выгружаются с кодировкой UTF-8 и байтовым маркером <code>\uFEFF</code>.<br />
              • Русскоязычные заголовки колонок, разделитель точка с запятой.<br />
              • Полная совместимость с 1С:ЗУП, 1С:Бухгалтерия, клиент-банками и локальными версиями Excel.
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'section-faq',
      volume: 'system',
      volumeNumber: '1.10',
      category: 'faq',
      title: '1.10 База знаний, диагностика неисправностей и регламенты (FAQ)',
      subtitle: 'Решение типовых ситуаций, снятие зависших блокировок, сбои ККТ, проверка служб и бэкапы',
      icon: <HelpOutlineIcon sx={{ color: '#0F3C64' }} />,
      directAppPath: '/fiscal-audit',
      directAppLabel: 'Журнал аудита',
      directAppTooltip: 'Открыть журнал фискального аудита и системных событий',
      tags: ['faq', 'ошибки', 'блокировка', 'backup', 'база данных', 'вопросы', 'ккт', 'атол', 'com-порт', 'смена 24', 'службы', 'firebird'],
      searchableText: `
        Частые вопросы FAQ диагностика неисправностей
        Что делать если сервис заблокирован другим пользователем мягкая блокировка 30 минут автоснятие
        Ошибка ККТ Порт занят COM3 Нет связи с ККТ fptr10 USB кабель АТОЛ 91Ф 115200 Mock эмулятор
        Обрыв или замятие бумаги Popper Test чек фискализирован в ФН ФД закрыт печать дубликата в журнале повторно пробивать не нужно
        Ошибка ККТ Смена превысила 24 часа Z-отчет закрытие смены закрыть смену в Мастере тестов ККТ
        Резервные копии Hot Backup VACUUM INTO db/backups/ откат копированием .sqlite файла
        Как проверить доступность всех служб сервера открыть раздел Службы бэкенда Health нажать Запустить тест всех служб
        Как протестировать поток выплат открыть Демо-данные нажать Заполнить БД затем Запустить тесты 45 тестов
      `,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
              Вопрос: Что делать, если сервис заблокирован другим пользователем?
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontSize: '0.88rem' }}>
              Мягкая блокировка действует ровно 30 минут. По истечении этого времени система автоматически снимет блокировку при следующем обращении к серверу. Также блокировку можно снять вручную через интерфейс мастера.
            </Typography>
          </Box>

          <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
              Вопрос: Ошибка ККТ: «Порт занят (COM3)» или «Нет связи с ККТ». Как устранить?
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontSize: '0.88rem' }}>
              1) Убедитесь, что закрыта сторонняя утилита («Тест драйвера ККТ АТОЛ»), которая могла монопольно захватить COM-порт.<br />
              2) Проверьте подключение USB-кабеля к аппарату АТОЛ 91Ф и горит ли индикатор питания на ньюджере.<br />
              3) В разделе <code>/admin/fiscal-settings</code> проверьте номер порта (по умолчанию COM3) и скорость (115200). При необходимости нажмите «Проверить связь».<br />
              4) Если аппарат временно недоступен, включите тумблер «Использовать Mock-эмулятор», чтобы не останавливать прием пациентов.
            </Typography>
          </Box>

          <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
              Вопрос: В процессе печати чека закончилась бумага (Popper Test). Фискализирован ли чек?
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontSize: '0.88rem' }}>
              Да! В соответствии с архитектурным принципом Popper Test, если документ закрыт в Фискальном Накопителе (получен номер ФД), операция юридически совершена и передана в ОФД. Заправьте новый рулон ленты 57 мм и в Журнале чеков (<code>/fiscal-audit</code>) нажмите <strong>«Печать копии чека»</strong>. Повторно пробивать чек <strong>не требуется</strong>!
            </Typography>
          </Box>

          <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
              Вопрос: Как убедиться, что все серверные службы клиники (Express, SQLite, Fiscal, Firebird) работают штатно?
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontSize: '0.88rem' }}>
              В боковом меню откройте раздел <strong>«Администратор → Службы бэкенда (Health)»</strong> (<code>/admin/server-health</code>) и нажмите кнопку <strong>«Запустить тест всех служб»</strong>. Система автоматически выполнит сквозной опрос портов 5000, 5050, 3050, проверит целостность базы SQLite и выведет детальный протокол в консоль.
            </Typography>
          </Box>

          <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
              Вопрос: Как работают резервные копии базы данных?
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontSize: '0.88rem' }}>
              Сервер делает автоматические горячие резервные снимки (Hot Backup via <code>VACUUM INTO</code>) при каждом запуске и каждые 6 часов в папку <code>backups/</code>. Для отката достаточно скопировать нужный <code>.sqlite</code> файл поверх основного при остановленном сервере.
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'section-ortho-templates',
      volume: 'clinical',
      volumeNumber: '2.1',
      category: 'ortho_templates',
      title: '2.1 Справочник клинических шаблонов и протоколов 2.0 (180 нозологий, 11 кластеров, 8 каталогов)',
      subtitle: 'Корпоративная база знаний доказательной ортопедии: 180 эталонных шаблонов протоколов по 11 клиническим кластерам, углы ROM Neutral-0, 1 377 доказательных тестов (Se/Sp), 381 метод аппаратной диагностики с привязкой к servdict и 102 программы восстановительного лечения (PRP, физио, ортезы, ЛФК)',
      icon: <BiotechIcon sx={{ color: '#0F3C64' }} />,
      directAppPath: '/ortho-templates',
      directAppLabel: 'Справочник шаблонов 2.0',
      directAppTooltip: 'Открыть интерактивный реестр 180 клинических протоколов 2.0',
      tags: [
        'шаблоны', 'клинические шаблоны', 'протоколы', '180 нозологий', '11 кластеров', 'ортопедия', 'тесты', 'диагностика',
        'мкб-10', 'мрт', 'рентген', 'узи', 'энмг', 'плантография', 'servdict', 'гониометрия', 'rom', 'neutral-0', 'лахман',
        'манипуляции', 'prp cortexil', 'гиалуронат', 'физиотерапия', 'hilt', 'sis', 'увт', 'ортезирование', 'nwb', 'fwb',
        'лфк', 'silbernagel', 'доказательная медицина', 'live arm preview', 'полнотекстовый поиск', 'арм врача', 'калькуляция', 'касса',
        'сколиоз', 'адамс', 'риссер', 'тест адамса', 'проба адамса', 'тест риссера', 'признак риссера', 'risser sign', 'корсет шено',
        'm17', 'm16', 'm75', 'm77', 'm72', 'm23', 'm65', 'm54', 'm41', 'm20', 'm81', 's83', 's43', 's63', 's93'
      ],
      searchableText: `
        Справочник клинических шаблонов 2.0 Templates Manager Ортопедические тесты Методы диагностики
        180 эталонных шаблонов протоколов по 11 клиническим кластерам:
        Кластер 1: Коленный сустав (гонартроз M17, повреждение мениска M23, разрыв ПКС S83, пателлофеморальный артроз, синовит, киста Бейкера).
        Кластер 2: Плечевой сустав (субакромиальный импинджмент M75, теносиновит бицепса, разрыв ротаторной манжеты, адгезивный капсулит, артроз АКС, нестабильность Банкарт S43).
        Кластер 3: Тазобедренный сустав (коксартроз M16, вертельный болевой синдром трохантерит GTPS, фемороацетабулярный импинджмент FAI, асептический некроз АНГБК).
        Кластер 4: Стопа и голеностоп (плантарный фасциит пяточная шпора M72, ахиллодиния тендинит ахилла, разрыв связок голеностопа ATFL S93, метатарзалгия Мортона, плоскостопие, Hallux Valgus M20).
        Кластер 5: Локтевой сустав (латеральный эпикондилит локоть теннисиста M77.1, медиальный эпикондилит локоть гольфиста M77.0, неврит кубитального канала, бурсит локтевого отростка).
        Кластер 6: Кисть и запястье (синдром карпального канала CTS G56, болезнь де Кервена M65.4, повреждение TFCC триангулярного комплекса S63, стенозирующий лигаментит щелкающий палец, ризартроз M19).
        Кластер 7: Позвоночник (дорсалгия люмбалгия M54, цервикалгия, корешковый синдром радикулопатия грыжа диска L4 L5 S1, спондилоартроз, фасеточный синдром).
        Кластер 8: Детская ортопедия и вертебрология (сколиоз M41.2 шаблоны #85 и #151, тест Адамса с наклоном вперед сколиометрия Adams forward bend, тест и признак Риссера Risser sign костная зрелость скелета стадии 0-5 оценка потенциала прогрессирования, угол Кобба, корсет Шено, кифоз, торсия позвонков, дисплазия ТБС Q65, плосковальгусная деформация стоп).
        Кластер 9: Системные заболевания (остеопороз остеопения M81, подагрический артрит M10, ревматоидный артрит M05).
        Кластер 10: Спортивная травма (миофасциальный синдром, растяжение хамстринг, травмы связочного аппарата).
        Кластер 11: Постоперационная реабилитация (состояние после эндопротезирования ТБС и колена, шов мениска, пластика ПКС).
        8 взаимосвязанных каталогов: Шаблоны протоколов, Стандарты ROM Neutral-0, Специальные ортопедические тесты (1377 тестов Se/Sp), Методы диагностики (381 метод, 37 УЗИ), Лечебные манипуляции и блокады (26 процедур PRP Cortexil), Аппаратная физиотерапия (21 метод HILT SIS УВТ), Ортезирование и разгрузка (26 изделий Formthotics), Лечебная физкультура ЛФК (29 комплексов Silbernagel).
        Привязка к номенклатуре платных услуг servdict id 114 1675 99 1600 автоматический расчет стоимости.
        Полнотекстовый поиск Full-Text Search FTS по МКБ-10 авторам латыни анатомическому субстрату методике показаниям.
        Интерактивный Live ARM Preview переключатель Отрицательный Положительный обучающая подсказка по кнопке i.
        Сквозной поток в АРМ врача выбор сустава на Гомункулусе передача назначений в кассу без расхождений.
      `,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Раздел <strong>«Справочник клинических шаблонов 2.0»</strong> является единым источником стандартов для АРМ врача-ортопеда. Он гарантирует бесшовный переход от клинического осмотра и доказательных проб к назначению аппаратного обследования и автоматической передаче услуг в кассовый узел.
          </Alert>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<OpenInNewIcon />}
              onClick={() => navigate('/ortho-templates')}
              sx={{
                bgcolor: '#0F3C64',
                color: '#FFFFFF',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                px: 2.5,
                '&:hover': { bgcolor: '#156C9C' }
              }}
            >
              Перейти в Справочник шаблонов 2.0
            </Button>
            <Button
              variant="outlined"
              startIcon={<HealingIcon />}
              onClick={() => navigate('/ortho-workstation')}
              sx={{
                color: '#0F3C64',
                borderColor: '#CBD5E1',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { borderColor: '#0F3C64', bgcolor: '#F0F9FF' }
              }}
            >
              Открыть АРМ врача-ортопеда
            </Button>
          </Box>

          {/* Neutral-0 and EBM formulas explanation card */}
          <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              Математические основы доказательной гониометрии и диагностической точности
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1.5, lineHeight: 1.6 }}>
              Гониометрия амплитуды движений регистрируется по международному стандарту <strong>Neutral-0 (SFTR)</strong> в трех плоскостях (Sagittal, Frontal, Rotational). Все тесты каталога калиброваны по показателям чувствительности (<LatexText text="$\text{Se}$" />), специфичности (<LatexText text="$\text{Sp}$" />) и отношения правдоподобия (<LatexText text="$LR^+$" />):
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F3C64', display: 'block', mb: 0.5 }}>
                  Нотация SFTR Neutral-0 (Коленный сустав):
                </Typography>
                <LatexText
                  text="$$S: 0^\circ \text{–} 0^\circ \text{–} 135^\circ, \quad F: 0^\circ \text{–} 0^\circ \text{–} 0^\circ, \quad R: 10^\circ \text{–} 0^\circ \text{–} 30^\circ$$"
                  component="div"
                />
              </Paper>
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F3C64', display: 'block', mb: 0.5 }}>
                  Показатели доказательной точности тестов:
                </Typography>
                <LatexText
                  text="$$\text{Se} = \frac{TP}{TP + FN}, \quad \text{Sp} = \frac{TN}{TN + FP}, \quad LR^+ = \frac{\text{Se}}{1 - \text{Sp}}$$"
                  component="div"
                />
              </Paper>
            </Box>
          </Paper>

          {/* Live Interactive Registry */}
          <OrthoTemplatesGuideRegistry />
        </Box>
      )
    },
    {
      id: 'section-ortho-tests-registry',
      volume: 'clinical',
      volumeNumber: '2.2',
      category: 'ortho_tests',
      title: '2.2 Реестр ортопедических тестов доказательной биомеханики (1 377 тестов)',
      subtitle: 'Физикальная диагностика суставов и связок: классификация Tier 1 (скрининг), Tier 2 (верификация), Tier 3 (дифференциал), показатели чувствительности (Se) и специфичности (Sp), уровни доказательности A/B/C и алгоритмы проведения',
      icon: <HealingIcon sx={{ color: '#0F3C64' }} />,
      directAppPath: '/ortho-templates?tab=tests',
      directAppLabel: 'Каталог тестов',
      directAppTooltip: 'Открыть реестр 1377 ортопедических тестов доказательной биомеханики',
      tags: [
        'тесты', 'ортопедические тесты', 'биомеханика', 'физикальная диагностика', '1377 тестов', 'se', 'sp', 'доказательность',
        'колено', 'плечо', 'локоть', 'тбс', 'стопа', 'кисть', 'позвоночник', 'лахман', 'пивот-шифт', 'мак-мюррей', 'нир',
        'хокинс', 'козен', 'фален', 'тинель', 'фабер', 'ласег', 'адамс', 'гониометрия', 'sftr',
        'риссер', 'risser', 'тест риссера', 'признак риссера', 'проба риссера', 'симптом риссера', 'risser sign',
        'тест адамса', 'проба адамса', 'признак адамса', 'костная зрелость', 'зоны роста'
      ],
      searchableText: `
        Полный реестр 1377 ортопедических тестов с руководствами для врача доказательная медицина
        Коленный сустав: Тест Лахмана ПКС Lachman, Передний выдвижной ящик Anterior drawer, Задний выдвижной ящик ЗКС Posterior drawer, Pivot-Shift динамическая ротационная нестабильность, Тест Мак-Мюррея мениски McMurray, Тест Эпли компрессионно-дистракционный Apley, Симптом баллотирования надколенника выпот синовит, Тест Кларка пателлофеморальный артроз Clark, Тест Фэйрбэнка латеральная нестабильность надколенника Fairbank apprehension.
        Локтевой сустав: Тест Козена латеральный эпикондилит локоть теннисиста Cozen, Тест Милля Mill, Тест локтя гольфиста медиальный эпикондилит Golfer elbow, Симптом Тиннеля кубитального канала локтевой нерв Tinel cubital, Вальгус-стресс локтя MCL нестабильность, Варус-стресс локтя LCL нестабильность.
        Плечевой сустав: Тест Нира субакромиальный импинджмент Neer, Тест Хокинса-Кеннеди Hawkins-Kennedy, Тест пустой банки Джоба надостная мышца Jobe Empty Can, Тест падающей руки массивный разрыв ротаторной манжеты Drop arm, Тест тревоги вывиха плеча Apprehension anterior instability, Тест Спида длинная головка бицепса Speed.
        Тазобедренный сустав: Тест FABER Патрика сакроилеит коксартроз Patrick, Тест FADIR фемороацетабулярный импинджмент губа FAI, Тест Томаса сгибательная контрактура подвздошно-поясничной мышцы Thomas, Проба Тренделенбурга слабость средней ягодичной мышцы Trendelenburg, Тест Обера натяжение илиотибиального тракта Ober.
        Стопа и голеностоп: Тест Уиндласса плантарная фасция пяточная шпора Windlass, Тест Томпсона разрыв ахиллова сухожилия Thompson, Тест переднего выдвижного ящика голеностопа таранно-малоберцовая связка ATFL Anterior drawer ankle, Тест наклона таранной кости инверсионный стресс Talar tilt.
        Кисть и запястье: Тест Фалена карпальный канал срединный нерв medianus, Симптом Тиннеля на запястье, Тест Финкельштейна болезнь де Кервена, Симптом клавиши пианино ДРУС TFCC, Тест шлифовки 1-го ПЗП Grind test ризартроз.
        Позвоночник и спина: Симптом Ласега натяжение седалищного нерва корешки L4 L5 S1 грыжа диска люмбоишиалгия, Проба Адамса наклон вперед сколиоз торсия позвонков реберный горб Adams forward bend, Тест / признак Риссера Risser sign костная зрелость скелетный рост зоны роста гребня подвздошной кости апофиз стадии 0-5 сколиоз прогрессирование корсет Шено, Тест Сперлинга фораминальная компрессия шейная радикулопатия C5 C6 C7, Тест Вассермана бедренный нерв корешки L2 L3 L4.
      `,
      content: <OrthoTestsGuideRegistry />
    },
    {
      id: 'section-diagnostic-methods-registry',
      volume: 'clinical',
      volumeNumber: '2.3',
      category: 'diagnostics',
      title: '2.3 Каталог методов инструментальной и лучевой диагностики (381 метод)',
      subtitle: 'Стандарты аппаратного обследования: цифровая рентгенография с нагрузкой, высокопольная МРТ 1.5–3.0 Тл, динамическое УЗИ с функциональными пробами, КТ 3D, стимуляционная ЭНМГ, оптическая плантография и лабораторные комплексы со сквозной привязкой к прейскуранту servdict',
      icon: <DescriptionIcon sx={{ color: '#0F3C64' }} />,
      directAppPath: '/ortho-templates?tab=diagnostics',
      directAppLabel: 'Методы диагностики',
      directAppTooltip: 'Открыть каталог 381 метода инструментальной и УЗИ-диагностики',
      tags: [
        'диагностика', 'методы диагностики', 'инструментальные исследования', '381 метод', 'рентген', 'мрт', 'узи', 'энмг', 'плантография',
        'кт', 'лаборатория', 'синовия', 'ревматологическая панель', 'показания', 'формулировка', 'servdict', 'цена', 'касса',
        'гонартроз', 'коксартроз', 'мениск', 'пкс', 'зкс', 'плечо', 'ротаторная манжета', 'сколиоз', 'плоскостопие',
        'риссер', 'risser', 'тест риссера', 'признак риссера', 'risser sign', 'угол кобба', 'адамс',
        '37 узи', 'us_achilles', 'us_knee', 'us_shoulder', 'us_elbow', 'us_wrist', 'us_hip', 'us_ankle', 'omeract', 'graf', 'sammarco', 'leddy-packer'
      ],
      searchableText: `
        Каталог методов диагностики и инструментальных исследований 381 метод стандарты EBM
        Цифровая рентгенография: коленный сустав стоя под нагрузкой Kellgren-Lawrence, таз и оба ТБС коксартроз АНГБК, стопы с нагрузкой угол свода Штритер Чижин плоскостопие, плечевой сустав акромион Bigliani кальцификаты, локтевой сустав суставная мышь, лучезапястный сустав дуги Карпала ризартроз, функциональная рентгенография позвоночника спондилолистез нестабильность, панорамная спондилография сколиоз угол Кобба, тест и признак Риссера (Risser sign 0–5) костная зрелость скелета зоны роста гребня подвздошной кости.
        Высокопольная МРТ томография 1.5-3.0 Тл: коленный сустав Stoller мениски разрывы ПКС ЗКС, плечевой сустав ротаторная манжета надостная Банкарт SLAP, ТБС асептический некроз вертлужная губа FAI фемороацетабулярный импинджмент, пояснично-крестцовый отдел грыжи L1-S1 радикулопатия корешки, локтевой сустав рефрактерный эпикондилит LUCL, лучезапястный сустав TFCC триангулярный комплекс.
        Ультразвуковая диагностика УЗИ (37 специализированных ортопедических протоколов):
        us_achilles (Ахиллово сухожилие Sammarco дегенерация теносиновит частичный полный разрыв),
        us_ankle_atfl (Передняя таранно-малоберцовая связка ATFL повреждение нестабильность голеностопа),
        us_ankle_posterior (Задний отдел голеностопа треугольная кость Os trigonum задний импинджмент флексор галлюцис),
        us_ankle_retinaculum (Удерживатели малоберцовых сухожилий вывих щелкающая наружная лодыжка),
        us_ankle_syndesmosis (Дистальный межберцовый синдесмоз AITFL динамический диастаз стресс-тест),
        us_elbow_biceps (Дистальное сухожилие бицепса разрыв ретракция апоневроз Пирогова lacertus fibrosus),
        us_elbow_cubital (Кубитальный канал локтевой нерв неврит компрессия дислокация),
        us_elbow_epicond (Надмыщелки плечевой кости латеральный медиальный эпикондилит ECRB теносиновит энтезофит),
        us_elbow_joint (Локтевой сустав выпот синовит остеофиты суставная мышь гемартроз),
        us_foot_intermetatarsal (Межплюсневые промежутки неврома Мортона Morton neuroma сдавление тест Малдера),
        us_foot_plantar (Плантарная фасция подошвенный фасциит пяточная шпора утолщение > 4 мм энтезопатия),
        us_foot_tibialis_post (Сухожилие задней большеберцовой мышцы TP дисфункция плоскостопие деформация),
        us_hand_annular (Кольцевидные связки A1 A2 A3 стенозирующий лигаментит щелкающий палец ноттинг),
        us_hand_collateral (Коллатеральные связки пальцев палец лыжника боковая нестабильность UCL),
        us_hand_extensors (Сухожилия разгибателей пальцев сагиттальные пучки дислокация),
        us_hand_flexors (Сухожилия глубоких и поверхностных сгибателей FDS FDP дефект Leddy-Packer),
        us_hip_adult (Тазобедренный сустав у взрослых вертлужная губа коксартроз выпот синовит),
        us_hip_greater_troch (Большой вертел трохантерит GTPS вертельная сумка средняя ягодичная мышца),
        us_hip_iliopsoas (Подвздошно-поясничная мышца и сухожилие илиопсоит бурсит щелкающее бедро),
        us_hip_pediatric (Тазобедренные суставы у детей скрининг дисплазии ТБС по Графу Graf тип I IIa IIb IIc D III IV костный эркер угол альфа бета),
        us_knee_acl_indirect (ПКС передняя крестообразная связка косвенные признаки разрыва гемартроз симптом Segond),
        us_knee_anterior (Передний отдел коленного сустава супрапателлярный заворот препателлярный бурсит тендинит связки надколенника колено прыгуна),
        us_knee_cartilage (Суставной хрящ мыщелков бедра хондромаляция гонартроз дефект толщина),
        us_knee_collateral (Боковые связки MCL LCL растяжение разрыв оссификат Пеллегрини-Штида Pellegrini-Stieda),
        us_knee_meniscus (Мениски медиальный латеральный экструзия мениска дегенерация параменисковая киста разрыв),
        us_knee_posterior (Подколенная ямка киста Бейкера Baker cyst разрыв гематома голени),
        us_nerve_peroneal (Малоберцовый нерв компрессия у головки малоберцовой кости конская стопа свисание),
        us_nerve_sciatic (Седалищный нерв синдром грушевидной мышцы УЗИ навигация блокада пириформис),
        us_nerve_tibial (Большеберцовый нерв тарзальный канал синдром компрессии онемение подошвы),
        us_rheumatoid_omeract (Ревматологический ультразвуковой протокол OMERACT допплеровский сигнал синовит паннус эрозии кости),
        us_shoulder_ac_joint (Акромиально-ключичный сустав АКС артроз диастаз связок),
        us_shoulder_biceps (Длинная головка бицепса межбугорковая борозда теносиновит вывих подлопаточная мышца),
        us_shoulder_dynamic (Динамические ультразвуковые пробы субакромиальный импинджмент ущемление манжеты),
        us_shoulder_rotator (Ротаторная манжета надостная подостная подлопаточная малая круглая частичный полный разрыв),
        us_wrist_carpal (Карпальный канал срединный нерв карпальный синдром CTS площадь поперечного сечения CSA > 10 мм²),
        us_wrist_dequervain (Первый канал разгибателей болезнь де Кервена теносиновит APL EPB),
        us_wrist_tfcc (Триангулярный фиброзно-хрящевой комплекс TFCC локтевой край запястья разрыв боль),
        us_dvt_veins (УЗДГ вен нижних конечностей компрессионный ультразвук CUS тромбоз глубоких вен ТГВ тромбофлебит).
        ЭНМГ электронейромиография: срединный нерв дистальная моторная латентность карпальный синдром, локтевой нерв кубитальный канал блок проведения.
        Плантография: компьютерная оптическая подометрия индивидуальные стельки ФормТотикс Formthotics.
        КТ и Лаборатория: КТ с 3D-реконструкцией остеотомия, ревматологическая панель СРБ РФ АЦЦП мочевая кислота подагра, исследование синовиальной жидкости цитоз кристаллы уратов пирофосфаты.
      `,
      content: <DiagnosticMethodsGuideRegistry />
    },
    {
      id: 'section-ortho-manipulations',
      volume: 'clinical',
      volumeNumber: '2.4',
      category: 'ortho_manipulations',
      title: '2.4 Каталог лечебных манипуляций и инъекционных блокад (26 процедур)',
      subtitle: 'Локальная инъекционная терапия в ортопедии: стандартизированная PRP-терапия Cortexil (10/20 мл), вискосупплементация гиалуроновой кислотой, лечебно-медикаментозные блокады под УЗИ-навигацией (US-guided), пункции суставов и кинезиотейпирование со сквозной привязкой к servdict',
      icon: <MedicalServicesIcon sx={{ color: '#0F766E' }} />,
      directAppPath: '/ortho-templates?tab=manipulations',
      directAppLabel: 'Манипуляции & PRP',
      directAppTooltip: 'Открыть каталог инъекционных манипуляций и блокад',
      tags: [
        'манипуляции', 'инъекции', 'prp cortexil', 'гиалуроновая кислота', 'блокада', 'узи навигация', 'us-guided', 'пункция', 'тейпирование',
        '26 процедур', 'servdict', 'цена', 'касса', 'противопоказания', 'cdss', 'stop warning', 'армавискон', 'гиалрипайер', 'дипроспан',
        'гидродиссекция', 'карпальный канал', 'надлопаточный нерв', 'эпикондилит', 'колено', 'плечо', 'тбс', 'голеностоп', 'стопа', 'кисть', 'позвоночник'
      ],
      searchableText: `
        Каталог лечебных манипуляций 26 процедур инъекционная терапия PRP Cortexil 10 мл и 20 мл Buffy Coat обогащенная тромбоцитами плазма факторы роста PDGF VEGF TGF-b центрифугирование
        Гиалуроновая кислота высокой молекулярной массы Армавискон Платинум 2% Гиалрипайер Флексотрон пролонгированная вискосупплементация смазка сустава хондропротекция гонартроз коксартроз
        Лечебно-медикаментозные блокады под ультразвуковой навигацией US-guided: блокада надлопаточного нерва suprascapular nerve block, седалищный нерв грушевидная мышца, триггерные точки миофасциального болевого синдрома
        Блокада латерального эпикондилита локоть теннисиста, медиального эпикондилита локоть гольфиста, гидродиссекция карпального канала срединный нерв medianus, синдром де Кервена декомпрессия первого канала
        Лечебная пункция суставов аспирация выпота эвакуация синовита гемартроз киста Бейкера параартикулярное дренирование
        Кинезиотейпирование суставов: стабилизация надколенника пателлофеморальный синдром, латеральная нестабильность голеностопа ATFL, лимфодренажное тейпирование, фиксация плеча и шеи
        Препараты: Лидокаин 1% 2%, Наропин Ропивакаин, Новокаин, Дипроспан бетаметазон, Дексаметазон, Траумель С, Цель Т. Номенклатура servdict код А11.04.* базовая цена стоимость длительность
      `,
      content: <ManipulationsGuideRegistry />
    },
    {
      id: 'section-ortho-physiotherapy',
      volume: 'clinical',
      volumeNumber: '2.5',
      category: 'ortho_physiotherapy',
      title: '2.5 Каталог высокоинтенсивной аппаратной физиотерапии (21 метод)',
      subtitle: 'Аппаратная реабилитация доказательного уровня 1A/1B: высокоинтенсивный Nd:YAG лазер HILT (1064 нм, до 3 кВт), супериндуктивная магнитная система SIS (2.5–3.0 Тл), радиальная и фокусированная УВТ (rESWT/fESWT), TECAR-диатермия и аппаратная криокомпрессия Game Ready',
      icon: <FitnessCenterIcon sx={{ color: '#1E40AF' }} />,
      directAppPath: '/ortho-templates?tab=physiotherapy',
      directAppLabel: 'Физиотерапия',
      directAppTooltip: 'Открыть каталог аппаратной физиотерапии HILT, SIS, УВТ',
      tags: [
        'физиотерапия', 'hilt лазер', 'sis магнит', 'увт', 'tecar', 'криотерапия', 'game ready', 'btl', 'storz',
        '21 метод', 'дозировка', 'джоули', 'частота', 'ebm', 'уровень 1a', 'красные флаги', '1064 нм', '3 тл', 'тесла',
        'пьезо', 'радиальная', 'фокусированная', 'диатермия', 'компрессия', 'миостимуляция'
      ],
      searchableText: `
        Каталог высокоинтенсивной аппаратной физиотерапии 21 метод доказательный уровень 1A 1B
        Высокоинтенсивный лазер HILT High Intensity Laser Therapy Nd:YAG 1064 нм импульсная мощность до 3 кВт BTL-6000 глубокая фотобиомодуляция биостимуляция регенерация хряща аналгезия гонартроз тендинит надколенника плотность потока энергии 120-150 Дж/см²
        Супериндуктивная магнитная система SIS Super Inductive System высокоинтенсивное импульсное электромагнитное поле индукция B >= 2.5-3.0 Тл Тесла BTL стимуляция костной мозоли консолидация переломов снятие мышечного спазма дефанс мобилизация суставов нейрорегенерация радикулопатия
        Радиальная ударно-волновая терапия rESWT Storz Medical пневматический излучатель плантарный фасциит пяточная шпора ахиллодиния миофасциальные триггерные точки давление 1.5-3.5 бар частота 10-15 Гц 2500 ударов
        Фокусированная ударно-волновая терапия fESWT пьезоэлектрический генератор кальцифицирующий тендинит ротаторной манжеты плеча асептический некроз АНГБК ложный сустав замедленная консолидация глубина фокуса 60 мм
        TECAR диатермия радиочастотная терапия 448 кГц емкостный резистивный режим CET RET эндогенное тепло релаксация хамстринг лимфодренаж отек фиброз
        Аппаратная локальная криокомпрессия Game Ready циклическая пневматическая компрессия охлаждение ледяной водой 0-4°C гемартроз после артроскопии пластики ПКС
        Электромиостимуляция EMS TENS нейромышечная стимуляция VMO медиальной головки квадрицепса атрофия мышц прейскурант servdict
      `,
      content: <PhysiotherapyGuideRegistry />
    },
    {
      id: 'section-ortho-orthotics',
      volume: 'clinical',
      volumeNumber: '2.6',
      category: 'ortho_orthotics',
      title: '2.6 Каталог ортезирования и биомеханической разгрузки (26 изделий)',
      subtitle: 'Биомеханическая коррекция и регламенты осевой нагрузки: индивидуальные термоформуемые ортопедические стельки Formthotics (Новая Зеландия), шарнирные коленные брейсы с ограничением углов ROM, туторы, корсеты Шено и классификатор осевой нагрузки (NWB, TTWB, PWB, WBAT, FWB)',
      icon: <ShieldIcon sx={{ color: '#6D28D9' }} />,
      directAppPath: '/ortho-templates?tab=orthotics',
      directAppLabel: 'Ортезирование',
      directAppTooltip: 'Открыть каталог ортезов и разгрузки стопы/суставов в Справочнике шаблонов',
      tags: [
        'ортезирование', 'стельки', 'формтотикс', 'formthotics', 'брейсы', 'туторы', 'корсеты', 'шено', 'разгрузка',
        'риссер', 'risser', 'тест риссера', 'признак риссера', 'risser sign', 'сколиоз',
        'nwb', 'ttwb', 'pwb', 'wbat', 'fwb', '26 изделий', 'servdict', 'склад', 'термоформовка', '85 градусов',
        'колено', 'стопа', 'позвоночник', 'плечо', 'кисть', 'деротационный сапожок', 'дезо', 'абдукционная подушка'
      ],
      searchableText: `
        Каталог ортезирования и биомеханической разгрузки 26 изделий
        Индивидуальные термоформуемые ортопедические стельки Formthotics ФормТотикс Новая Зеландия однослойные двухслойные заготовки красные синие зеленые термоформовка феном 85°C формовка в динамике шага метатарзальная подушка подпяточник супинатор клинья варус вальгус плантарный фасциит продольное поперечное плоскостопие полая стопа Hallux Valgus
        Шарнирные коленные ортезы брейсы с регулятором углов ROM Range of Motion 0° до 90° градуировка фиксация после пластики ПКС шва мениска остеотомии
        Жесткие коленные туторы иммобилизация 0° гемартроз перелом надколенника свежий разрыв связок
        Деротационный сапожок голеностопный ортез фиксация стопы профилактика наружной ротации при переломах шейки бедра
        Корсет Шено жесткий термопластический деротационный корсет индивидуального изготовления 3D-сканирование коррекция сколиоза 2-3 степени у детей и подростков разгрузка компрессии торсии позвонков, протокол SOSORT режим 18-23 часа в сутки при тесте и признаке Риссера 0-3 (Risser sign) до завершения костного роста (Риссер 4-5).
        Ортезы верхней конечности повязка Дезо косыночный бандаж с абдукционной подушкой отведение плеча 30-45° после шва ротаторной манжеты
        Лучезапястные шины лонгеты фиксация первого луча ризартроз ночная шина карпальный канал
        Регламенты осевой нагрузки: NWB Non-Weight Bearing без нагрузки костыли, TTWB Toe-Touch касание носком 10%, PWB Partial частичная нагрузка 30-50%, WBAT по переносимости, FWB полная осевая нагрузка склад servdict
      `,
      content: <OrthoticsGuideRegistry />
    },
    {
      id: 'section-ortho-lfk',
      volume: 'clinical',
      volumeNumber: '2.7',
      category: 'ortho_lfk',
      title: '2.7 Каталог лечебной физкультуры и кинезиотерапии ЛФК (29 комплексов)',
      subtitle: 'Клиническая кинезиотерапия по трехфазной модели Silbernagel: изометрическая стабилизация (Quad Sets), замкнутые кинетические цепи (CKC), эксцентрические силовые нагрузки (HSR/Alfredson), нейродинамические тракты и мониторинг боли по шкале ВАШ',
      icon: <DirectionsRunIcon sx={{ color: '#047857' }} />,
      directAppPath: '/ortho-templates?tab=lfk',
      directAppLabel: 'Протоколы ЛФК',
      directAppTooltip: 'Открыть трехфазные реабилитационные протоколы кинезиотерапии ЛФК',
      tags: [
        'лфк', 'кинезиотерапия', 'сильбернагель', 'silbernagel', 'фаза 1', 'фаза 2', 'фаза 3', 'изометрия',
        'ckc', 'okc', 'эксцентрика', 'нейродинамика', 'ваш', 'дозировка', 'темп', '29 комплексов', 'альфредсон',
        'alfredson', 'quad sets', 'vmo', 'стэниш', 'stanish', 'макензи', 'mckenzie', 'боль', 'протокол'
      ],
      searchableText: `
        Каталог лечебной физкультуры и кинезиотерапии ЛФК 29 стандартизированных комплексов
        Трехфазная модель Silbernagel Pain Monitoring Model контроль боли по шкале ВАШ допустимая боль <= 5 баллов без утренней скованности купирование за 24 часа
        Фаза I Острая ранняя иммобилизация: изометрические упражнения Quad Sets напряжение квадрицепса валик под колено, скольжение пяткой Heel slides, Ankle pumps насос стопой помпа отек тромбоз, дыхательная гимнастика
        Фаза II Подострая ремоделирование: замкнутые кинетические цепи Closed Kinetic Chain CKC приседания с опорой на стену Wall-squat ягодичный мостик Glute bridge жим платформы подъем на носки упражнение ракушка Clamshell средняя ягодичная мышца боковая планка Копенгагенское сведение приводящих мышц
        Фаза III Функциональная возврат в спорт: эксцентрический протокол Альфредсона Alfredson опускание пятки со ступени 3x15 повторений 12 недель ахиллово сухожилие ахиллобурсит, эксцентрика связки надколенника по Stanish колено прыгуна наклонная доска 25°, выпады прыжки плиометрика балансировочная подушка BOSU проприоцепция
        Нейродинамика мобилизация нервных стволов Slump-тест натяжение седалищного нерва люмбоишиалгия корешковый синдром L4 L5 S1, нейродинамика бедренного нерва, срединного локтевого нервов
        Методика Маккензи McKenzie Extension Protocol декомпрессия грыжи поясничного отдела экстензия прогибы назад
      `,
      content: <LfkGuideRegistry />
    },
    {
      id: 'section-ortho-rom',
      volume: 'clinical',
      volumeNumber: '2.8',
      category: 'ortho_rom',
      title: '2.8 Стандарты клинической гониометрии суставов (ROM / SFTR Neutral-0 для 10 суставов)',
      subtitle: 'Международный анатомический стандарт Neutral-0 (SFTR система АТОР / AAOS): физиологические нормы активных и пассивных объемов движений, дефициты, классификатор конечного упора (End-Feel) и степени сгибательных/разгибательных контрактур',
      icon: <StraightenIcon sx={{ color: '#0F3C64' }} />,
      directAppPath: '/rom-standards',
      directAppLabel: 'Стандарты ROM',
      directAppTooltip: 'Открыть международный эталон углов и классификатор контрактур Neutral-0',
      tags: [
        'rom', 'гониометрия', 'neutral-0', 'sftr', 'углы', 'амплитуда', 'контрактура', 'end-feel', 'колено',
        'плечо', 'тбс', 'локоть', 'голеностоп', 'кисть', 'позвоночник', '10 суставов', 'цириакс', 'cyriax',
        'норма', 'дефицит', 'сгибание', 'разгибание', 'отведение', 'ротация', 'дауборн', 'шобер'
      ],
      searchableText: `
        Стандарты клинической гониометрии суставов ROM Range of Motion протокол Neutral-0 SFTR система АТОР AAOS 10 суставов
        Коленный сустав активное сгибание 130-145° пассивное 140-150° дефицит разгибания 0° норма сгибательная контрактура блокада мениска
        Плечевой сустав элевация сгибание вперед 160-180° отведение во фронтальной плоскости 160-180° болезненная дуга Дауборна 70-120° субакромиальный импинджмент наружная ротация 60-90° маркер капсулита внутренняя ротация 60-80° заведение кисти за спину до Th7-Th10 дефицит ретракции
        Тазобедренный сустав сгибание 115-125° контакт с животом отведение 40-45° внутренняя ротация 30-35° главный ранний маркер коксартроза FAI наружная ротация 40-45° сгибательная контрактура тест Томаса
        Голеностопный сустав тыльное сгибание дорсифлексия 20-25° ригидность ахилла подошвенное сгибание 45-50° супинация инверсия 30-35° пронация эверсия 15-20°
        I плюснефаланговый сустав стопы MTP-1 разгибание дорсифлексия 65-70° Hallux Valgus Rigidus подагра подошвенное 35-45°
        Локтевой сустав сгибание 140-150° разгибание 0° пронация супинация 80-90°
        Лучезапястный сустав тыльное сгибание 60-70° ладонное 60-80° радиальная девиация 20° ульнарная 30°
        Позвоночник шейный отдел флексия 40-45° экстензия 45-50° ротация 60-80° наклоны 45° поясничный отдел тест Шобера
        Классификатор конечного упора End-Feel по Cyriax: Костный Hard bony остеофиты анкилоз, Капсульный Firm leathery адгезивный капсулит фиброз артроз, Пружинящий Springy rebound упругий блок мениск ручка лейки суставная мышь Кёниг, Мышечный дефанс Muscle spasm спазм от острой боли, Пустой упор Empty pain прерывание боли до упора, Ватный упор Soft mushy отсутствие точки упора разрыв связок
        Клинические пресеты контрактур норма умеренная выраженная анкилоз
      `,
      content: <RomStandardsManager />
    }
  ], [navigate]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcuts (Ctrl+K, Cmd+K, "/", Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle URL query parameters (?volume=all|system|clinical, ?q=query, ?section=section-xyz, or hash #section-xyz)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const volumeParam = params.get('volume');
    const sectionParam = params.get('section') || (location.hash ? location.hash.replace('#', '') : null);
    const queryParam = params.get('q') || params.get('search');

    if (queryParam !== null && queryParam !== searchQuery) {
      setSearchQuery(queryParam);
    }

    if (volumeParam === 'system' || volumeParam === 'clinical' || volumeParam === 'all') {
      setSelectedVolume(volumeParam);
    }

    if (sectionParam) {
      const targetSec = sections.find(s => s.id === sectionParam);
      if (targetSec) {
        if (!volumeParam || volumeParam === 'all') {
          setSelectedVolume(targetSec.volume);
        }
        setExpandedSections(prev => ({
          ...prev,
          [sectionParam]: true
        }));
        setTimeout(() => {
          const el = document.getElementById(sectionParam);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    }
  }, [location.search, location.hash, sections]);

  const handleSelectVolume = (volume: 'all' | 'system' | 'clinical') => {
    setSelectedVolume(volume);
    setSelectedCategory('all');
    const params = new URLSearchParams(location.search);
    if (volume === 'all') {
      params.delete('volume');
    } else {
      params.set('volume', volume);
    }
    const newSearch = params.toString();
    navigate({
      pathname: location.pathname,
      search: newSearch ? `?${newSearch}` : '',
      hash: location.hash
    }, { replace: true });
  };

  const handleJumpToSection = (sectionId: string, sectionVolume?: 'system' | 'clinical') => {
    if (sectionVolume && selectedVolume !== 'all' && selectedVolume !== sectionVolume) {
      setSelectedVolume(sectionVolume);
    }
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: true
    }));
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Structured query parsing with transliteration and synonyms
  const parsedQuery = useMemo(() => {
    return parseAndExpandQuery(searchQuery);
  }, [searchQuery]);

  // Comprehensive full-text filtering with relevance statistics & snippet extraction
  const isSearchActive = Boolean(parsedQuery.raw && parsedQuery.raw.length > 0);

  const { filteredSections, sectionStats, totalMatchesCount, volumeBreakdown } = useMemo(() => {
    const stats: Record<string, { matchCount: number; snippet: string | null; matchedTags: string[] }> = {};
    let total = 0;
    const volCounts = { system: 0, clinical: 0 };

    const filtered = sections.filter((sec) => {
      // When NOT searching, filter strictly by selectedVolume and selectedCategory
      if (!isSearchActive) {
        if (selectedVolume !== 'all' && sec.volume !== selectedVolume) {
          return false;
        }
        if (selectedCategory !== 'all' && sec.category !== selectedCategory) {
          return false;
        }
        stats[sec.id] = { matchCount: 0, snippet: null, matchedTags: [] };
        return true;
      }

      // When searching, SEARCH WHOLE CONTEXT across all volumes and categories!
      const aggregate = `${sec.volumeNumber} ${sec.title} ${sec.subtitle} ${sec.tags.join(' ')} ${sec.searchableText}`;

      const isMatch = matchesQuery(aggregate, parsedQuery);
      if (!isMatch) return false;

      const count = countKeywordMatches(aggregate, parsedQuery.highlightTokens);
      const snippet = extractMatchSnippet(sec.searchableText, parsedQuery.highlightTokens, 85);
      const matchedTags = sec.tags.filter(tag => 
        parsedQuery.highlightTokens.some(tok => tag.toLowerCase().includes(tok.toLowerCase()))
      );

      const resolvedCount = Math.max(1, count);
      stats[sec.id] = { matchCount: resolvedCount, snippet, matchedTags };
      total += resolvedCount;
      volCounts[sec.volume]++;
      return true;
    });

    return { 
      filteredSections: filtered, 
      sectionStats: stats, 
      totalMatchesCount: total,
      volumeBreakdown: volCounts
    };
  }, [sections, selectedVolume, selectedCategory, parsedQuery, isSearchActive]);

  // Auto-expand matching sections when user types a search query
  useEffect(() => {
    if (parsedQuery.raw) {
      const newExpanded: Record<string, boolean> = {};
      filteredSections.forEach((s) => {
        newExpanded[s.id] = true;
      });
      setExpandedSections(newExpanded);
    }
  }, [parsedQuery.raw, filteredSections]);

  const handleToggleSection = (sectionId: string, nextExpanded?: boolean) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: nextExpanded !== undefined ? nextExpanded : !prev[sectionId]
    }));
  };

  const handleExpandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    sections.forEach(s => { allExpanded[s.id] = true; });
    setExpandedSections(allExpanded);
  };

  const handleCollapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    sections.forEach(s => { allCollapsed[s.id] = false; });
    setExpandedSections(allCollapsed);
  };

  // Dynamic Category filters based on selectedVolume
  const categoryFilters = useMemo(() => {
    const allDefs = [
      { id: 'all', label: 'Все разделы тома', volume: 'all' },
      // System categories (1.1 - 1.10)
      { id: 'architecture', label: '1.1 Архитектура & БД', volume: 'system' },
      { id: 'formulas', label: '1.2 Формулы & Маржа', volume: 'system' },
      { id: 'flow', label: '1.3 Поток визитов & Расчет', volume: 'system' },
      { id: 'workflow', label: '1.4 Ввод данных ЭМК', volume: 'system' },
      { id: 'screens', label: '1.5 Рабочие экраны', volume: 'system' },
      { id: 'fiscal', label: '1.6 Фискализация & POS', volume: 'system' },
      { id: 'services_health', label: '1.7 Сервисы сервера', volume: 'system' },
      { id: 'test_daemon', label: '1.8 Тесты потока', volume: 'system' },
      { id: 'print', label: '1.9 Печать & Экспорт', volume: 'system' },
      { id: 'faq', label: '1.10 FAQ & Диагностика', volume: 'system' },
      // Clinical categories (2.1 - 2.8)
      { id: 'ortho_templates', label: '2.1 Протоколы 2.0 (180)', volume: 'clinical' },
      { id: 'ortho_tests', label: '2.2 Реестр тестов (1 377)', volume: 'clinical' },
      { id: 'diagnostics', label: '2.3 Диагностика (381)', volume: 'clinical' },
      { id: 'ortho_manipulations', label: '2.4 Манипуляции (26)', volume: 'clinical' },
      { id: 'ortho_physiotherapy', label: '2.5 Физиотерапия (21)', volume: 'clinical' },
      { id: 'ortho_orthotics', label: '2.6 Ортезирование (26)', volume: 'clinical' },
      { id: 'ortho_lfk', label: '2.7 ЛФК (29)', volume: 'clinical' },
      { id: 'ortho_rom', label: '2.8 ROM Neutral-0 (10)', volume: 'clinical' },
    ];

    return allDefs
      .filter(item => {
        if (item.id === 'all') return true;
        if (selectedVolume === 'all') return true;
        return item.volume === selectedVolume;
      })
      .map(item => ({
        id: item.id,
        label: item.label,
        count: item.id === 'all'
          ? (selectedVolume === 'all' ? sections.length : sections.filter(s => s.volume === selectedVolume).length)
          : sections.filter(s => s.category === item.id).length
      }));
  }, [sections, selectedVolume]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1600px', margin: '0 auto', gap: 2, pb: 6 }}>
      {/* Hidden A4 Printable Template for react-to-print */}
      <Box sx={{ display: 'none' }}>
        <UserGuidePrintTemplate ref={printRef} version="2.0.1" />
        <PosFiscalManualPrintTemplate ref={posFiscalPrintRef} />
      </Box>

      {/* Top Header & Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.5px' }}>
              Полное Руководство пользователя МИС «ОртоERP»
            </Typography>
            <Chip
              label="v2.0.1"
              size="small"
              sx={{ bgcolor: '#EBF8FF', color: '#0F3C64', fontWeight: 800, border: '1px solid #BEE3F8' }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
            Интерактивный технологический регламент клиники: архитектура сущностей, параметры расчетов, сквозной поток (flow), мониторинг служб и печатные формы
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Tooltip title="Развернуть все разделы инструкции" arrow enterDelay={200}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<UnfoldMoreIcon />}
              onClick={handleExpandAll}
              sx={{
                borderColor: '#CBD5E1',
                color: '#475569',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': { borderColor: '#0F3C64', color: '#0F3C64' }
              }}
            >
              Развернуть все
            </Button>
          </Tooltip>

          <Tooltip title="Свернуть все разделы" arrow enterDelay={200}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<UnfoldLessIcon />}
              onClick={handleCollapseAll}
              sx={{
                borderColor: '#CBD5E1',
                color: '#475569',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': { borderColor: '#0F3C64', color: '#0F3C64' }
              }}
            >
              Свернуть все
            </Button>
          </Tooltip>

          <Tooltip title="Печать официального регламента клиники в формате А4 (или экспорт в PDF)" arrow enterDelay={200}>
            <Button
              variant="contained"
              size="small"
              startIcon={<PictureAsPdfIcon />}
              onClick={() => handlePrintTrigger()}
              sx={{
                bgcolor: '#0F3C64',
                color: '#FFFFFF',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: '0 2px 6px rgba(15, 60, 100, 0.25)',
                '&:hover': { bgcolor: '#156C9C' }
              }}
            >
              Печать руководства (А4 / PDF)
            </Button>
          </Tooltip>

          <Tooltip title="Специальный регламент кассира по эквайрингу и ККТ (А4)" arrow enterDelay={200}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ReceiptLongIcon />}
              onClick={() => handlePrintPosFiscalManual()}
              sx={{
                borderColor: '#0284C7',
                color: '#0284C7',
                bgcolor: '#F0F9FF',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { borderColor: '#0369A1', bgcolor: '#E0F2FE' }
              }}
            >
              Инструкция кассира (А4)
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Top-Level Volume Navigation Pillars (Том I: 1-10, Том II: 1-8, Все: 18) */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: 3,
          border: '1px solid #CBD5E1',
          bgcolor: '#F8FAFC',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 1.5
        }}
      >
        {/* Pillar 1: All Volumes */}
        <Tooltip
          title="Отобразить объединенный свод знаний клиники (все 18 разделов Системного и Клинического томов)"
          arrow
          enterDelay={200}
        >
          <Box
            onClick={() => handleSelectVolume('all')}
            sx={{
              p: 2,
              borderRadius: 2.5,
              cursor: 'pointer',
              border: selectedVolume === 'all' ? '2px solid #0F3C64' : '1px solid #E2E8F0',
              bgcolor: selectedVolume === 'all' ? '#FFFFFF' : '#FFFFFF',
              boxShadow: selectedVolume === 'all' ? '0 4px 14px rgba(15, 60, 100, 0.12)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              '&:hover': {
                borderColor: '#0F3C64',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(15, 60, 100, 0.08)'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoStoriesIcon sx={{ color: selectedVolume === 'all' ? '#0F3C64' : '#64748B', fontSize: 22 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: selectedVolume === 'all' ? '#0F3C64' : '#334155' }}>
                  Все разделы
                </Typography>
              </Box>
              <Chip
                label="18 разделов"
                size="small"
                sx={{
                  bgcolor: selectedVolume === 'all' ? '#EBF8FF' : '#F1F5F9',
                  color: selectedVolume === 'all' ? '#0F3C64' : '#64748B',
                  fontWeight: 800,
                  fontSize: '0.72rem'
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.35 }}>
              Сводный интерактивный каталог: полный технологический регламент, ККТ и доказательная ортопедия.
            </Typography>
          </Box>
        </Tooltip>

        {/* Pillar 2: Volume 1 System Guide */}
        <Tooltip
          title="Открыть Том I: Системное Руководство (п. 1.1–1.10) — архитектура БД, формулы маржи, 54-ФЗ эквайринг, серверные службы, печать и FAQ"
          arrow
          enterDelay={200}
        >
          <Box
            onClick={() => handleSelectVolume('system')}
            sx={{
              p: 2,
              borderRadius: 2.5,
              cursor: 'pointer',
              border: selectedVolume === 'system' ? '2px solid #0F3C64' : '1px solid #E2E8F0',
              bgcolor: selectedVolume === 'system' ? '#F0F9FF' : '#FFFFFF',
              boxShadow: selectedVolume === 'system' ? '0 4px 14px rgba(15, 60, 100, 0.15)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              '&:hover': {
                borderColor: '#0F3C64',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(15, 60, 100, 0.08)'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MenuBookIcon sx={{ color: selectedVolume === 'system' ? '#0F3C64' : '#0284C7', fontSize: 22 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: selectedVolume === 'system' ? '#0F3C64' : '#0F3C64' }}>
                  ТОМ I: Системное Руководство
                </Typography>
              </Box>
              <Chip
                label="10 разделов (1.1–1.10)"
                size="small"
                sx={{
                  bgcolor: selectedVolume === 'system' ? '#0F3C64' : '#EBF8FF',
                  color: selectedVolume === 'system' ? '#FFFFFF' : '#0F3C64',
                  fontWeight: 800,
                  fontSize: '0.72rem'
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.35 }}>
              Архитектура SQLite (96 таблиц), формулы наценки 1.15, 54-ФЗ эквайринг Arcus-2/АТОЛ, мониторинг 6 служб, печать А4 и FAQ.
            </Typography>
          </Box>
        </Tooltip>

        {/* Pillar 3: Volume 2 Clinical Guide */}
        <Tooltip
          title="Открыть Том II: Клиническое Руководство (п. 2.1–2.8) — 180 шаблонов 2.0, 1377 тестов, 381 метод диагностики, манипуляции, физио, ортезы, ЛФК, ROM"
          arrow
          enterDelay={200}
        >
          <Box
            onClick={() => handleSelectVolume('clinical')}
            sx={{
              p: 2,
              borderRadius: 2.5,
              cursor: 'pointer',
              border: selectedVolume === 'clinical' ? '2px solid #059669' : '1px solid #E2E8F0',
              bgcolor: selectedVolume === 'clinical' ? '#F0FDF4' : '#FFFFFF',
              boxShadow: selectedVolume === 'clinical' ? '0 4px 14px rgba(5, 150, 105, 0.15)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              '&:hover': {
                borderColor: '#059669',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.08)'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BiotechIcon sx={{ color: selectedVolume === 'clinical' ? '#059669' : '#047857', fontSize: 22 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: selectedVolume === 'clinical' ? '#047857' : '#065F46' }}>
                  ТОМ II: Клиническое Руководство
                </Typography>
              </Box>
              <Chip
                label="8 стандартов (2.1–2.8)"
                size="small"
                sx={{
                  bgcolor: selectedVolume === 'clinical' ? '#059669' : '#ECFDF5',
                  color: selectedVolume === 'clinical' ? '#FFFFFF' : '#047857',
                  fontWeight: 800,
                  fontSize: '0.72rem'
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.35 }}>
              Доказательная ортопедия (EBM): 180 протоколов 2.0, 1377 тестов (Se/Sp), 381 метод УЗИ/МРТ, PRP Cortexil, SIS, Formthotics, Silbernagel, ROM Neutral-0.
            </Typography>
          </Box>
        </Tooltip>
      </Paper>

      {/* Search & Intelligence Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: '1.5px solid #CBD5E1',
          borderRadius: 2.5,
          bgcolor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          boxShadow: '0 2px 10px rgba(15, 60, 100, 0.05)',
          transition: 'all 0.2s ease',
          '&:focus-within': {
            borderColor: '#0F3C64',
            boxShadow: '0 4px 20px rgba(15, 60, 100, 0.12)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            inputRef={searchInputRef}
            fullWidth
            size="small"
            placeholder="Интеллектуальный сквозной поиск: узи*, *пластика, PRP Cortexil, HILT 1064, SIS 3 Тл, Formthotics, Silbernagel, Лахман, 54-ФЗ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#0F3C64', fontSize: 22 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end" sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                    {searchQuery ? (
                      <IconButton size="small" onClick={() => setSearchQuery('')} title="Очистить (Esc)">
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    ) : (
                      <Tooltip title="Нажмите / или Ctrl+K для быстрого перехода к поиску" arrow>
                        <Chip
                          label="Ctrl + K"
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            bgcolor: '#F1F5F9',
                            color: '#475569',
                            border: '1px solid #CBD5E1',
                            cursor: 'pointer'
                          }}
                          onClick={() => searchInputRef.current?.focus()}
                        />
                      </Tooltip>
                    )}
                  </InputAdornment>
                )
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#F8FAFC',
                '& fieldset': { borderColor: '#CBD5E1' },
                '&:hover fieldset': { borderColor: '#0F3C64' },
                '&.Mui-focused fieldset': { borderColor: '#0F3C64' }
              }
            }}
          />
        </Box>

        {/* Category Filters Bar */}
        <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', alignItems: 'center', pt: 0.5, borderTop: '1px dashed #E2E8F0' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mr: 0.5 }}>
            Категории:
          </Typography>
          {categoryFilters.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <Chip
                key={cat.id}
                label={`${cat.label} (${cat.count})`}
                onClick={() => setSelectedCategory(cat.id)}
                size="small"
                sx={{
                  fontWeight: isSelected ? 800 : 500,
                  bgcolor: isSelected ? '#0F3C64' : '#F1F5F9',
                  color: isSelected ? '#FFFFFF' : '#334155',
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: isSelected ? '#0F3C64' : '#E2E8F0'
                  }
                }}
              />
            );
          })}
        </Box>
      </Paper>

      {/* Live Search Results Summary Bar */}
      {parsedQuery.raw && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            px: 2,
            bgcolor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Chip
              label={`🟢 Найдено разделов: ${filteredSections.length} из ${sections.length} (Том I: ${volumeBreakdown.system}, Том II: ${volumeBreakdown.clinical})`}
              size="small"
              sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800, fontSize: '0.78rem' }}
            />
            <Chip
              label={`🎯 Всего совпадений: ${totalMatchesCount}`}
              size="small"
              sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: '0.78rem' }}
            />
            <Typography variant="body2" sx={{ color: '#166534', fontSize: '0.88rem' }}>
              по запросу «<strong>{searchQuery}</strong>»
              <span style={{ color: '#0F3C64', fontSize: '0.8rem', marginLeft: '6px', fontWeight: 600 }}>
                (сквозной поиск по всему руководству: подстановки *, ?, словоформы, синонимы)
              </span>
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSearchQuery('')}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: '#166534',
              borderColor: '#86EFAC',
              '&:hover': { bgcolor: '#DCFCE7', borderColor: '#166534' }
            }}
          >
            Сбросить поиск (Esc)
          </Button>
        </Paper>
      )}

      {/* Executive Table of Contents & Direct Link Directory */}
      <Paper
        elevation={0}
        sx={{
          p: showTableOfContents ? 2.5 : 1.25,
          px: 2,
          border: '1px solid #CBD5E1',
          borderRadius: 2.5,
          bgcolor: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(15, 60, 100, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: showTableOfContents ? 2 : 0,
          transition: 'all 0.2s ease'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box
            onClick={() => setShowTableOfContents(prev => !prev)}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.2, cursor: 'pointer' }}
          >
            <TocIcon sx={{ color: '#0F3C64', fontSize: 24 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.96rem', letterSpacing: '-0.2px' }}>
              Оглавление и экспресс-переход по разделам руководства
            </Typography>
            <Chip
              label="18 глав"
              size="small"
              sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 800, fontSize: '0.74rem' }}
            />
          </Box>
          <Button
            size="small"
            variant="text"
            onClick={() => setShowTableOfContents(prev => !prev)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: '#0F3C64',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            {showTableOfContents ? 'Свернуть оглавление' : 'Развернуть оглавление'}
            <ExpandMoreIcon
              sx={{
                fontSize: 20,
                transform: showTableOfContents ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease'
              }}
            />
          </Button>
        </Box>

        {showTableOfContents && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              gap: 2.5,
              pt: 1,
              borderTop: '1px solid #F1F5F9'
            }}
          >
            {/* Column 1: Volume I (1.1 - 1.10) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, pb: 0.5, borderBottom: '2px solid #0284C7' }}>
                <MenuBookIcon sx={{ color: '#0284C7', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                  ТОМ I: Системное Руководство (1.1 — 1.10)
                </Typography>
                <Chip label="10 глав" size="small" sx={{ ml: 'auto', height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: '#E0F2FE', color: '#0369A1' }} />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                {sections.filter(s => s.volume === 'system').map((sec) => (
                  <Box
                    key={sec.id}
                    onClick={() => handleJumpToSection(sec.id, sec.volume)}
                    sx={{
                      p: 1.2,
                      borderRadius: 1.5,
                      border: '1px solid #E2E8F0',
                      bgcolor: '#F8FAFC',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.4,
                      '&:hover': {
                        borderColor: '#0284C7',
                        bgcolor: '#F0F9FF',
                        transform: 'translateX(3px)',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.1)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <Chip
                          label={sec.volumeNumber}
                          size="small"
                          sx={{
                            height: 20,
                            minWidth: 32,
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            bgcolor: '#0F3C64',
                            color: '#FFFFFF'
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: '#0F3C64',
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {sec.title.replace(/^[\d.]+\s*/, '')}
                        </Typography>
                      </Box>
                      {sec.directAppPath && (
                        <Tooltip title={sec.directAppTooltip || `Перейти в экран: ${sec.directAppLabel}`} arrow>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(sec.directAppPath!);
                            }}
                            sx={{
                              height: 22,
                              px: 0.8,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              textTransform: 'none',
                              color: '#0284C7',
                              borderColor: '#BAE6FD',
                              bgcolor: '#FFFFFF',
                              flexShrink: 0,
                              '&:hover': { bgcolor: '#E0F2FE', borderColor: '#0284C7' }
                            }}
                          >
                            {sec.directAppLabel || 'В модуль'}
                          </Button>
                        </Tooltip>
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#64748B',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {sec.subtitle}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Column 2: Volume II (2.1 - 2.8) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, pb: 0.5, borderBottom: '2px solid #059669' }}>
                <BiotechIcon sx={{ color: '#059669', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#065F46', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                  ТОМ II: Клиническое Руководство (2.1 — 2.8)
                </Typography>
                <Chip label="8 глав" size="small" sx={{ ml: 'auto', height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: '#DCFCE7', color: '#166534' }} />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                {sections.filter(s => s.volume === 'clinical').map((sec) => (
                  <Box
                    key={sec.id}
                    onClick={() => handleJumpToSection(sec.id, sec.volume)}
                    sx={{
                      p: 1.2,
                      borderRadius: 1.5,
                      border: '1px solid #E2E8F0',
                      bgcolor: '#F8FAFC',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.4,
                      '&:hover': {
                        borderColor: '#059669',
                        bgcolor: '#F0FDF4',
                        transform: 'translateX(3px)',
                        boxShadow: '0 2px 8px rgba(5, 150, 105, 0.1)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <Chip
                          label={sec.volumeNumber}
                          size="small"
                          sx={{
                            height: 20,
                            minWidth: 32,
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            bgcolor: '#059669',
                            color: '#FFFFFF'
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: '#065F46',
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {sec.title.replace(/^[\d.]+\s*/, '')}
                        </Typography>
                      </Box>
                      {sec.directAppPath && (
                        <Tooltip title={sec.directAppTooltip || `Перейти в экран: ${sec.directAppLabel}`} arrow>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(sec.directAppPath!);
                            }}
                            sx={{
                              height: 22,
                              px: 0.8,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              textTransform: 'none',
                              color: '#059669',
                              borderColor: '#A7F3D0',
                              bgcolor: '#FFFFFF',
                              flexShrink: 0,
                              '&:hover': { bgcolor: '#DCFCE7', borderColor: '#059669' }
                            }}
                          >
                            {sec.directAppLabel || 'В модуль'}
                          </Button>
                        </Tooltip>
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#64748B',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {sec.subtitle}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Accordion Sections List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredSections.map((section) => {
          const isExpanded = Boolean(expandedSections[section.id]);
          const stats = sectionStats[section.id];
          const hasMatches = Boolean(stats && stats.matchCount > 0);

          return (
            <Accordion
              key={section.id}
              id={section.id}
              expanded={isExpanded}
              onChange={(_, nextExpanded) => handleToggleSection(section.id, nextExpanded)}
              slotProps={{ transition: { unmountOnExit: true } }}
              elevation={0}
              sx={{
                border: isExpanded ? '1.5px solid #0F3C64' : hasMatches ? '1.5px solid #F59E0B' : '1px solid #CBD5E1',
                borderRadius: '12px !important',
                '&:before': { display: 'none' },
                overflow: 'hidden',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: isExpanded ? '0 4px 12px rgba(15, 60, 100, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                '&:hover': { borderColor: '#0F3C64' }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: isExpanded ? '#0F3C64' : '#64748B' }} />}
                sx={{
                  bgcolor: isExpanded ? '#F8FAFC' : hasMatches ? '#FFFBEB' : '#FFFFFF',
                  px: 2.5,
                  py: 1.5,
                  borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none',
                  '& .MuiAccordionSummary-content': { margin: '8px 0' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, width: '100%', pr: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: isExpanded ? '#EBF8FF' : '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 0.3
                    }}
                  >
                    {section.icon}
                  </Box>

                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={section.volume === 'system' ? `Том I: ${section.volumeNumber}` : `Том II: ${section.volumeNumber}`}
                          size="small"
                          sx={{
                            bgcolor: section.volume === 'system' ? '#EBF8FF' : '#ECFDF5',
                            color: section.volume === 'system' ? '#0F3C64' : '#047857',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            border: `1px solid ${section.volume === 'system' ? '#BEE3F8' : '#A7F3D0'}`
                          }}
                        />
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '1.05rem', lineHeight: 1.3 }}>
                          {parsedQuery.raw ? (
                            <HighlightMatch text={section.title} tokens={parsedQuery.expandedTokens} />
                          ) : (
                            <LatexText text={section.title} />
                          )}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {section.directAppPath && (
                          <Tooltip title={section.directAppTooltip || `Перейти в экран ${section.directAppLabel || ''}`} arrow enterDelay={200}>
                            <Button
                              size="small"
                              variant="outlined"
                              endIcon={<OpenInNewIcon sx={{ fontSize: '13px !important' }} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(section.directAppPath!);
                              }}
                              sx={{
                                py: 0.2,
                                px: 1,
                                height: 26,
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                textTransform: 'none',
                                borderColor: section.volume === 'clinical' ? '#10B981' : '#38BDF8',
                                color: section.volume === 'clinical' ? '#047857' : '#0369A1',
                                bgcolor: section.volume === 'clinical' ? '#F0FDF4' : '#F0F9FF',
                                borderRadius: 1.5,
                                '&:hover': {
                                  bgcolor: section.volume === 'clinical' ? '#DCFCE7' : '#E0F2FE',
                                  borderColor: section.volume === 'clinical' ? '#059669' : '#0284C7',
                                }
                              }}
                            >
                              {section.directAppLabel || 'В систему'}
                            </Button>
                          </Tooltip>
                        )}

                        {hasMatches && (
                          <Chip
                            icon={<SearchIcon sx={{ fontSize: '13px !important' }} />}
                            label={`${stats.matchCount} совпадений`}
                            size="small"
                            sx={{
                              bgcolor: '#FEF3C7',
                              color: '#92400E',
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              border: '1px solid #FDE047'
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.85rem', mt: 0.3, lineHeight: 1.4 }}>
                      {parsedQuery.raw ? (
                        <HighlightMatch text={section.subtitle} tokens={parsedQuery.expandedTokens} />
                      ) : (
                        <LatexText text={section.subtitle} />
                      )}
                    </Typography>

                    {/* Matched tags preview */}
                    {hasMatches && stats.matchedTags && stats.matchedTags.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', mt: 0.8 }}>
                        {stats.matchedTags.slice(0, 5).map((tag) => (
                          <Chip
                            key={tag}
                            label={`#${tag}`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              bgcolor: '#ECFDF5',
                              color: '#047857',
                              border: '1px solid #A7F3D0'
                            }}
                          />
                        ))}
                      </Box>
                    )}

                    {/* Snippet from deep searchable text if match occurred inside */}
                    {hasMatches && stats.snippet && (
                      <Box
                        sx={{
                          mt: 1,
                          p: 0.8,
                          px: 1.2,
                          bgcolor: '#FEF9C3',
                          border: '1px solid #FDE047',
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          maxWidth: '100%'
                        }}
                      >
                        <SearchIcon sx={{ fontSize: 15, color: '#854D0E', flexShrink: 0 }} />
                        <Typography variant="caption" sx={{ color: '#78350F', fontSize: '0.78rem', lineHeight: 1.4 }}>
                          <strong>В материалах раздела:</strong>{' '}
                          <HighlightMatch text={stats.snippet} tokens={parsedQuery.expandedTokens} />
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ p: 3, bgcolor: '#FFFFFF' }}>
                {section.content}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Box>
  );
}

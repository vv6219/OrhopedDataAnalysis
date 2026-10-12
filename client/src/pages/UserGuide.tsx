import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import DnsIcon from '@mui/icons-material/Dns';
import SmartToyIcon from '@mui/icons-material/SmartToy';

import { UserGuidePrintTemplate } from '../components/UserGuidePrintTemplate';

interface GuideSection {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  icon: React.ReactElement;
  tags: string[];
  searchableText: string;
  content: React.ReactNode;
}

export default function UserGuide() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'section-entities': true,
    'section-formulas': true,
    'section-flow': true,
    'section-input': false,
    'section-screens': false,
    'section-fiscal': false,
    'section-services-health': false,
    'section-test-daemon': false,
    'section-print': false,
    'section-faq': false,
  });

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintTrigger = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Руководство_пользователя_ОртоERP_v1.4.1_${new Date().toISOString().slice(0, 10)}`,
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
      category: 'architecture',
      title: '1. Концептуальная модель данных и взаимосвязь сущностей',
      subtitle: 'Реляционная архитектура базы данных SQLite, ключевые таблицы и связи по внешним ключам (ER)',
      icon: <AccountTreeIcon sx={{ color: '#0F3C64' }} />,
      tags: ['сущности', 'er', 'база данных', 'foreign keys', 'пациенты', 'сотрудники', 'сервисы', 'bom', 'склад', 'начисления', 'фискальные чеки'],
      searchableText: `
        Реляционная модель данных SQLite foreign_keys = ON PRAGMA контроль целостности каскадные связи
        Таблицы patients mednum full_name phone last_visit_date appointments визиты operation_transactions транзакции
        staff role department is_active staff_payout_settings staff_payout_schemes staff_operation_rates
        operations price каталог услуг operation_materials спецификация расходников BOM quantity
        materials_catalog current_unit_cost package_cost unit_of_measure склад медикаментов препараты
        staff_payout_schemes Хирургия 35% Консультации 25% Сестринское 10% max_team_cap_percent 60%
        procedure_records margin_base dedup_hash защита от повторного включения в оплату дедупликация
        staff_payout_accruals final_payout sheet_id status начисления выплат ведомость staff_payout_sheets
        service_calculation_locks lock_token soft lock мягкая блокировка 30 минут таймаут
        fiscal_profiles АТОЛ 91Ф COM3 Mock org_name ИЧП Добрушкин А.М. ИНН 450107060083 ОГРНИП 323237500208220
        fiscal_receipts 54-ФЗ fiscal_document_number ФД fiscal_sign ФПД fn_number ФН тег 1008 ОФД sell sell_return
        fiscal_audit_logs Serilog log_level fptr10 кассовые события аудит
      `,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
            Система МИС «ОртоERP» построена на единой реляционной СУБД SQLite с включенным контролем внешних ключей (<code>PRAGMA foreign_keys = ON</code>). Это гарантирует, что ни один сервис, визит или начисление не могут существовать без родительских записей пациента и врача.
          </Typography>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Сущность</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Таблица в БД</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Ключевые поля</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Взаимосвязи</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Пациенты (ЭМК)</TableCell>
                  <TableCell><code>patients</code></TableCell>
                  <TableCell><code>id</code>, <code>mednum</code>, <code>full_name</code>, <code>phone</code>, <code>last_visit_date</code></TableCell>
                  <TableCell>Родитель для визитов (<code>appointments</code>) и транзакций (<code>operation_transactions</code>)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Сотрудники клиники</TableCell>
                  <TableCell><code>staff</code></TableCell>
                  <TableCell><code>id</code>, <code>full_name</code>, <code>role</code>, <code>department</code>, <code>is_active</code></TableCell>
                  <TableCell>Связан со схемами выплат, ставками и ролями в сервисах</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Каталог сервисов</TableCell>
                  <TableCell><code>operations</code></TableCell>
                  <TableCell><code>id</code>, <code>name</code>, <code>price</code></TableCell>
                  <TableCell>Содержит спецификацию расхода материалов (BOM) в <code>operation_materials</code></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Склад материалов</TableCell>
                  <TableCell><code>materials_catalog</code></TableCell>
                  <TableCell><code>id</code>, <code>material_name</code>, <code>current_unit_cost</code>, <code>package_cost</code></TableCell>
                  <TableCell>Списывается в сервисах и транзакциях (<code>transaction_actual_materials</code>)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Схемы выплат</TableCell>
                  <TableCell><code>staff_payout_schemes</code></TableCell>
                  <TableCell><code>id</code>, <code>scheme_name</code>, <code>default_rate_percent</code>, <code>max_team_cap_percent</code></TableCell>
                  <TableCell>Определяет правила расчета для категорий: Хирургия (35%), Консультации (25%), Сестринское (10%)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Записи сервисов</TableCell>
                  <TableCell><code>procedure_records</code></TableCell>
                  <TableCell><code>id</code>, <code>source_type</code>, <code>source_id</code>, <code>margin_base</code>, <code>dedup_hash</code></TableCell>
                  <TableCell>Фиксирует факт расчета сервиса; защищает от повторного включения в оплату</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Начисления выплат</TableCell>
                  <TableCell><code>staff_payout_accruals</code></TableCell>
                  <TableCell><code>id</code>, <code>sheet_id</code>, <code>staff_id</code>, <code>final_payout</code>, <code>status</code></TableCell>
                  <TableCell>Строки выплат сотрудникам; группируются в ведомость (<code>staff_payout_sheets</code>)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Мягкие блокировки</TableCell>
                  <TableCell><code>service_calculation_locks</code></TableCell>
                  <TableCell><code>source_type</code>, <code>source_id</code>, <code>lock_token</code>, <code>expires_at</code></TableCell>
                  <TableCell>Защищают сервисы от параллельного расчета несколькими операторами (таймаут 30 мин)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Профили ККТ «АТОЛ 91Ф»</TableCell>
                  <TableCell><code>fiscal_profiles</code></TableCell>
                  <TableCell><code>id</code>, <code>profile_name</code>, <code>port</code>, <code>is_mock</code>, <code>org_name</code>, <code>inn</code>, <code>tax_rate</code></TableCell>
                  <TableCell>Хранит параметры связи с ККТ, реквизиты клиники для чека, СНО, ставку НДС и кассира</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Фискальные чеки (54-ФЗ)</TableCell>
                  <TableCell><code>fiscal_receipts</code></TableCell>
                  <TableCell><code>id</code>, <code>transaction_id</code>, <code>patient_id</code>, <code>fiscal_document_number</code>, <code>fiscal_sign</code>, <code>is_fiscalized</code></TableCell>
                  <TableCell>Реестр пробитых чеков: приход/возврат, суммы, ФД №, ФПД, ФН, тег 1008, статусы</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Аудит ККТ (Serilog)</TableCell>
                  <TableCell><code>fiscal_audit_logs</code></TableCell>
                  <TableCell><code>id</code>, <code>log_level</code>, <code>action_name</code>, <code>message</code>, <code>timestamp</code></TableCell>
                  <TableCell>Структурированный Serilog-журнал всех кассовых событий, вызовов fptr10 и ошибок</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )
    },
    {
      id: 'section-formulas',
      category: 'formulas',
      title: '2. Параметры настройки и математические алгоритмы расчетов',
      subtitle: 'Формулы себестоимости, наценка 1.15, маржинальная база, гарантированные минимумы и Cap бригады',
      icon: <CalculateIcon sx={{ color: '#0F3C64' }} />,
      tags: ['параметры', 'формулы', 'расчет', 'маржа', '1.15', 'коэффициент', 'cap', 'гарантированный минимум', 'себестоимость', 'соло', 'бригада'],
      searchableText: `
        Формула наценки на материалы material_cost_factor 1.15 себестоимость накладные расходы
        Себестоимость материалов = ∑ (Количество_i × Цена_ед_i) × 1.15
        Маржинальная база клиники Margin Base = max(0, Цена сервиса для пациента − Себестоимость материалов)
        Нулевая маржа дефицит клиники Кейс C высокозатратные расходники превышают цену услуги
        Сдельное вознаграждение специалиста Staff Payout = max(Маржинальная база × (Ставка % / 100), Гарантированный минимум)
        fixed_min_payout гарантированный минимум врача 1500 медсестры 400
        Контроль перерасхода фонда оплаты труда Team Cap Guard max_team_cap_percent = 60%
        Лимит бригады 60% предупреждение isExceedingCap: true
        Случай Соло-врач (Single Staff): медсестра nurse_id null выплата сестре строго 0 ставка 0%
        Случай Бригада (Multi Staff): ведущий хирург 35% операционная медсестра 10% раздельный учет маржи
      `,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              1. Себестоимость расходных материалов технологической карты (BOM)
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1 }}>
              Материалы списываются с учетом коэффициента накладных расходов клиники <code>material_cost_factor</code> (по умолчанию <strong>1.15</strong>, т.е. +15% на доставку, хранение и стерилизацию):
            </Typography>
            <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: '0.88rem' }}>
              Себестоимость материалов = ∑ (Количество_i × Цена_ед_i) × 1.15
            </Paper>
          </Box>

          <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              2. Маржинальная база клиники (Margin Base)
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1 }}>
              Маржинальная база — это очищенный финансовый остаток стоимости сервиса после покрытия всех прямых расходов на медикаменты. База ограничена снизу нулем:
            </Typography>
            <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: '0.88rem' }}>
              Маржинальная база = max(0, Цена сервиса для пациента − Себестоимость материалов)
            </Paper>
            <Alert severity="info" sx={{ mt: 1.5, borderRadius: 1.5 }}>
              Если стоимость расходников превышает цену сервиса (высокозатратный сервис, Кейс C), маржинальная база равна 0 ₽, но врач и медсестра гарантированно получают оплату по своим минимальным тарифам (1 500 ₽ и 400 ₽ соответственно).
            </Alert>
          </Box>

          <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              3. Сдельное вознаграждение специалиста (Staff Payout) и распределение ролей
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1 }}>
              Выплата рассчитывается по процентной ставке специалиста с проверкой персонального гарантированного минимума (<code>fixed_min_payout</code>):
            </Typography>
            <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: '0.88rem', mb: 1.5 }}>
              Выплата = max(Маржинальная база × (Ставка % / 100), Гарантированный минимум)
            </Paper>
            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.88rem' }}>
              • <strong>Соло-врач (Solo Doctor):</strong> если назначение медсестры отсутствует (<code>nurse_id: null</code>), начисление медсестре строго равно 0 ₽, а врач получает полное вознаграждение.<br />
              • <strong>Полная бригада (Brigade):</strong> при участии хирурга и медсестры маржинальная база распределяется согласно ставкам схемы (например, 35% хирургу и 10% операционной сестре).
            </Typography>
          </Box>

          <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              4. Контроль перерасхода фонда оплаты труда (Team Cap Guard)
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1 }}>
              В каждой тарифной схеме зафиксирован максимальный лимит суммарной доли бригады (<code>max_team_cap_percent</code> = 60%). Если суммарная ставка хирурга (35%), ассистента (25%) и сестры (15%) дает 75%, система выдает флаг <code>isExceedingCap: true</code> и уведомляет экономиста о перерасходе до проведения окончательного коммита.
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'section-flow',
      category: 'flow',
      title: '3. Регламентный поток бизнес-процесса (Flow) и комбинации визитов',
      subtitle: 'Жизненный цикл оказания сервисов: Single/Multi услуги, Solo/Brigade персонал, блокировки, ACID коммит и сторно',
      icon: <TimelineIcon sx={{ color: '#0F3C64' }} />,
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
            Система поддерживает все возможные клинические комбинации объема услуг и состава медицинской бригады:
          </Typography>

          {/* Visit Combinations Table */}
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Код сценария</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Услуги визита</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Назначение персонала</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Регламент расчета и результат в БД</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#0284C7' }}>FL-V01</TableCell>
                  <TableCell><strong>Single Service:</strong> 1 консультация (5 000 ₽)</TableCell>
                  <TableCell><strong>Solo Doctor:</strong> только врач (<code>nurse_id: null</code>)</TableCell>
                  <TableCell>Сестре строго 0 ₽ (ставка 0%). Врачу: 30% (1 500 ₽). Коммит: 1 процедура, 1 начисление.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#0284C7' }}>FL-V02</TableCell>
                  <TableCell><strong>Single Service:</strong> 1 инвазия (PRP 18 000 ₽, мат. 3 500 ₽)</TableCell>
                  <TableCell><strong>Brigade:</strong> Хирург (35%) + Медсестра (10%)</TableCell>
                  <TableCell>Маржа 14 500 ₽. Хирург: 5 075 ₽, медсестра: 1 450 ₽. Коммит: 1 процедура, 2 начисления.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#0284C7' }}>FL-V03</TableCell>
                  <TableCell><strong>Multi Services:</strong> Пакет из 2 услуг (Консультация 5k + Блокада 8k)</TableCell>
                  <TableCell><strong>Solo Doctor:</strong> только врач (<code>nurse_id: null</code>)</TableCell>
                  <TableCell>Обе услуги в рамках одного визита. Сестре 0 ₽ по обеим. Коммит: 2 процедуры, 2 начисления врачу.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#0284C7' }}>FL-V04</TableCell>
                  <TableCell><strong>Multi Services:</strong> Пакет из 2 операций (Артроскопия 35k + PRP 18k = 53k)</TableCell>
                  <TableCell><strong>Brigade:</strong> Хирург (35%) + Медсестра (10%)</TableCell>
                  <TableCell>Раздельный расчет маржи по каждой позиции пакета. Коммит: 2 процедуры, 4 начисления (по 2 каждому).</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#0284C7' }}>FL-V05</TableCell>
                  <TableCell><strong>Appointment Flow:</strong> прием из расписания (<code>status='completed'</code>)</TableCell>
                  <TableCell><strong>Лечащий врач:</strong> лечащий врач приема</TableCell>
                  <TableCell>Поступает со <code>source_type: 'appointment'</code>, коммит связывается с <code>appointment_id</code>.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* 4-Step Flow */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon fontSize="small" sx={{ color: '#16A34A' }} /> Шаг 1: Фиксация приема и сервисов
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.8, fontSize: '0.85rem' }}>
                Врач или регистратура через Мастер оформления визита регистрирует завершение приема. Запись попадает в таблицу <code>operation_transactions</code> со статусом «Нерассчитана».
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockIcon fontSize="small" sx={{ color: '#D97706' }} /> Шаг 2: Захват мягкой блокировки (Lock)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.8, fontSize: '0.85rem' }}>
                Бухгалтер в модуле «Выплаты сотрудникам» выбирает сервисы месяца. Сервер блокирует выбранные строки на 30 минут, генерируя <code>lockToken</code>. Другой бухгалтер не сможет взять те же сервисы в параллельный расчет.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalculateIcon fontSize="small" sx={{ color: '#2563EB' }} /> Шаг 3: Предварительный расчет (Preview)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.8, fontSize: '0.85rem' }}>
                Сервер производит расчет на лету: проверяет персональные ставки, наценку на материалы 1.15, рассчитывает доли врачей и проверяет превышение лимита Cap.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedUserIcon fontSize="small" sx={{ color: '#059669' }} /> Шаг 4: Атомарный коммит (Commit)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.8, fontSize: '0.85rem' }}>
                После одобрения бухгалтер нажимает «Зафиксировать начисления». В единой ACID-транзакции создаются строки в <code>procedure_records</code> и <code>staff_payout_accruals</code>, а мягкая блокировка мгновенно снимается.
              </Typography>
            </Paper>
          </Box>

          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            <strong>Защита от дублей (Dedup Guard):</strong> Каждый сервис получает уникальный хэш <code>dedup_hash</code>. Повторный запуск коммита тех же сервисов не создаст дублирующих начислений — система просто пропустит уже рассчитанные записи.
          </Alert>

          <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 0.5 }}>
              Корректировки и Сторнирование (Storno)
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.88rem' }}>
              • <strong>Ручная корректировка:</strong> бухгалтер может добавить премию или штраф к начислению (поле <code>manual_adjustment</code>). Сумма пересчитывается автоматически с сохранением комментария.<br />
              • <strong>Сторнирование:</strong> при отмене приема исходное начисление помечается как <code>storno</code>, и создается парная запись со статусом <code>storno_reversal</code> с отрицательной суммой. Это полностью обнуляет выплату без физического удаления строк, сохраняя аудиторский след.
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'section-input',
      category: 'workflow',
      title: '4. Порядок определения и ввода первичных данных',
      subtitle: 'Регламент заведения номенклатуры, спецификаций BOM, картотеки пациентов и врачей',
      icon: <InputIcon sx={{ color: '#0F3C64' }} />,
      tags: ['ввод данных', 'инструкция', 'номенклатура', 'bom', 'пациенты', 'сотрудники', 'порядок', 'маршрут'],
      searchableText: `
        Порядок заведения первичных данных регламент номенклатура BOM пациенты сотрудники
        1. Склад материалов /inventory номенклатура учетная стоимость единицы цена упаковки единица измерения
        2. Каталог сервисов /operations цена процедуры кнопка Расходники BOM привязка материалов
        3. Сотрудники и врачи /staff должности Хирургия 35 Консультации 25 Сестринское 10 фикс-минимум
        4. Картотека пациентов /patients ЭМК дата рождения телефон полис ДМС
        5. Оформление визита /checkout выбор пациента врача сервисов расходников форма оплаты
      `,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
            Для обеспечения корректности финансовой модели данные заносятся в систему строго по следующему маршруту:
          </Typography>

          <Box component="ol" sx={{ pl: 2.5, m: 0, color: '#334155', '& li': { mb: 1.5, lineHeight: 1.5 } }}>
            <li>
              <strong>Склад материалов и медикаментов (`/inventory`):</strong> заведение номенклатурных позиций (наименование, учетная стоимость единицы, цена упаковки, единица измерения). Заполнение нулевых стоимостей обязательно для корректной оценки себестоимости.
            </li>
            <li>
              <strong>Каталог сервисов (`/operations`):</strong> создание позиций сервисов, задание цены для пациента, привязка нормативного комплекта расходных материалов через кнопку <strong>«Расходники (BOM)»</strong> с указанием количества.
            </li>
            <li>
              <strong>Сотрудники и врачи (`/staff`):</strong> ввод сотрудников, распределение по должностям, выбор базовой тарифной схемы (Хирургия 35%, Консультации 25%, Сестринское 10%), назначение персональных фикс-минимумов.
            </li>
            <li>
              <strong>Картотека пациентов (`/patients`):</strong> создание электронной медицинской карты (ЭМК), заполнение ФИО, даты рождения, телефона и полиса ДМС.
            </li>
            <li>
              <strong>Оформление визита (`/checkout`):</strong> выбор пациента, лечащего врача, сервисов и фактических расходников с фиксацией способа оплаты.
            </li>
          </Box>
        </Box>
      )
    },
    {
      id: 'section-screens',
      category: 'screens',
      title: '5. Рабочие экраны и функции системы',
      subtitle: 'Подробное руководство по функционалу каждого раздела веб-приложения',
      icon: <DesktopWindowsIcon sx={{ color: '#0F3C64' }} />,
      tags: ['экраны', 'интерфейс', 'навигация', 'пациенты', 'склад', 'выплаты', 'параметры', 'би', 'чек', 'сервер', 'демо'],
      searchableText: `
        Рабочие экраны интерфейс Картотека пациентов /patients ЭМК поиск история визитов аудит
        Склад материалов /inventory номенклатура препараты упаковки аудит балансовая стоимость
        Выплаты сотрудникам /staff-payouts Мастер расчета Реестр начислений Ведомости BI Аналитика рейтинг врачей ROI
        Параметры клиники /parameters системные коэффициенты material_cost_factor 1.15 реквизиты
        Параметры ККТ АТОЛ 91Ф /admin/fiscal-settings fiscal_profiles COM3 115200 Mock ИЧП Добрушкин А.М.
        Мастер тестов ККТ /admin/fiscal-test-wizard пошаговая верификация связь чек X Z отчеты Popper test
        Журнал аудита ККТ /fiscal-audit DataGrid ФД ФПД ФН термолента 57 мм Serilog sell_return возврат прихода
        Оформление визита /checkout мастер визита кассовый расчет тег 1008 телефон email ОФД карта нал СБП
        Службы бэкенда Health /admin/server-health мониторинг Express SQLite Fiscal Firebird Swagger Backups
        Управление демо-данными /admin/daemon-data генерация seed очистка purge 45 тестов
      `,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Картотека пациентов (`/patients`)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.85rem' }}>
                • Полнотекстовый поиск по 61 000+ пациентов (ЭМК, ФИО, телефон).<br />
                • Карточка ЭМК с историей всех приемов и протоколами.<br />
                • Аудит качества данных (индекс заполнения, паспорт, телефон).<br />
                • Создание нового пациента с автоприсвоением № ЭМК.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Склад материалов (`/inventory`)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.85rem' }}>
                • Полнотекстовый поиск номенклатуры и препаратов.<br />
                • Учет цен единиц и упаковок, автоопределение финансовых счетов.<br />
                • Аудит качества данных (выявление нулевых цен и нетипичных единиц).<br />
                • Складской подвал с общей балансовой суммой и средней ценой.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Выплаты сотрудникам (`/staff-payouts`)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.85rem' }}>
                • Вкладка 1: Мастер расчета с очередью нерассчитанных сервисов.<br />
                • Вкладка 2: Реестр начислений с корректировками и сторно.<br />
                • Вкладка 3: Ведомости за периоды с печатью бланка А4 и экспортом в CSV.<br />
                • Вкладка 4: BI Аналитика и рейтинг врачей с окупаемостью (ROI).
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Параметры расчетов (`/parameters`)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.85rem' }}>
                • Управление системными коэффициентами клиники.<br />
                • Коэффициент наценки на расходники (material_cost_factor = 1.15).<br />
                • Реквизиты, адрес и телефоны клиники для бланков.<br />
                • Полнотекстовый поиск по параметрам и их значениям.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Службы бэкенда и мониторинг (`/admin/server-health`)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.85rem' }}>
                • Сводный мониторинг 6 компонентов (Express, SQLite, Fiscal Daemon, Firebird, Swagger, Backups).<br />
                • Измерение времени отклика (latency ms), памяти Node.js (RSS/Heap) и целостности БД.<br />
                • Кнопка «Запустить тест всех служб» с детальным хронологическим протоколом в терминале.<br />
                • Быстрый переход к инструментам администрирования каждого компонента.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Управление демо-данными [TEST_DAEMON] (`/admin/daemon-data`)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.85rem' }}>
                • Изолированный тестовый контур для верификации финансовой модели и обучения персонала.<br />
                • Автоматическая генерация тестовых пациентов, врачей, 3 периодов ведомостей и очередей.<br />
                • Запуск 45 сквозных тестов потока (Single/Multi Services, Solo/Brigade staff, Cap, Storno, BI).<br />
                • Мгновенная каскадная очистка всех тестовых данных одной кнопкой.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Параметры ККТ АТОЛ 91Ф (`/admin/fiscal-settings`)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.85rem' }}>
                • Управление кассовыми профилями в базе данных SQLite (таблица <code>fiscal_profiles</code>).<br />
                • Настройка порта (COM3), скорости обмена (115200) и переключатель режима эмуляции (Mock).<br />
                • Реквизиты организации в чеке: ИЧП Добрушкин А.М., ИНН, ОГРНИП, адрес и система налогообложения.<br />
                • Ставка НДС с валидацией, кассир по умолчанию и аудит изменений через Serilog.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Оформление визита и кассовый расчет (`/checkout`)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.85rem' }}>
                • Пошаговое оформление визита пациента с привязкой врача, сервисов и расходников.<br />
                • Интегрированный тумблер «Пробить фискальный чек на ККТ (54-ФЗ)».<br />
                • Автоподстановка контакта пациента для передачи в ОФД (Тег 1008 — телефон или e-mail).<br />
                • Выбор типа оплаты (карта, наличные, СБП) и мгновенное получение реквизитов ФД и ФПД.
              </Typography>
            </Paper>
          </Box>
        </Box>
      )
    },
    {
      id: 'section-fiscal',
      category: 'fiscal',
      title: '6. Фискальный регистратор «АТОЛ 91Ф» и сервис фискализации (54-ФЗ)',
      subtitle: 'Архитектурный контур, монопольный доступ к COM-порту, Popper Test, чеки, смены и регламент кассира',
      icon: <PointOfSaleIcon sx={{ color: '#0F3C64' }} />,
      tags: ['ккт', 'атол', 'атол 91ф', 'фискализация', '54-фз', 'чек', 'фд', 'фпд', 'фн', 'тег 1008', 'офд', 'mock', 'com-порт', 'popper test', 'z-отчет', 'х-отчет', 'смена', 'смены', 'кассир', 'serilog', 'калькулятор купюр', 'сверка кассы', '24 часа', 'мнемонический номер'],
      searchableText: `
        Фискальный регистратор АТОЛ 91Ф ДТО 10 54-ФЗ fptr10.dll COM3 115200 Single-Consumer Queue
        React SPA /checkout Express.js API Gateway C# .NET Fiscal Daemon OrthoErp.FiscalService порт 5050
        Монопольный доступ к COM-порту ошибка Порт занят -6 строгая последовательная очередь задач
        Критерий истинности фискализации Popper Test обрыв ленты замятие бумаги не отменяет запись в ФН
        ФД № ФПД закрытие документа LIBFPTR_PARAM_DOCUMENT_CLOSED: true печать дубликата в журнале
        Тег 1008 телефон email пациента отправка в ОФД форма оплаты карта наличные СБП безналичный
        Регламент кассира открытие смены X-отчет без гашения Z-отчет с гашением длительность смены до 24 часов
        Мнемонический номер смены СМ-YYYYMMDD-NNN авто-открытие смены при первом чеке
        Калькулятор купюр и монет 5000 2000 1000 500 200 100 сверка наличности излишек недостача
        Печать Z-отчета термолента 80мм бухгалтерский акт А4 журнал смен /admin/fiscal-shifts экспорт Excel JSON
        Возврат прихода LIBFPTR_RT_SELL_RETURN sell_return зеркальная запись в МИС
        Управление профилями fiscal_profiles ИЧП Добрушкин А.М. ИНН 450107060083 ОГРНИП 323237500208220
        Автономный режим эмуляции Mock Mode бесперебойная работа при отключенной кассе
      `,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              6.1. Архитектурная модель сервиса фискализации и монопольный доступ к COM-порту
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1.5, lineHeight: 1.6 }}>
              Интеграция кассового аппарата <strong>АТОЛ 91Ф</strong> (работающего в режиме фискального регистратора по протоколу ДТО 10) построена по многоуровневой отказоустойчивой схеме:
            </Typography>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: '0.82rem', whiteSpace: 'pre-wrap', lineHeight: 1.5, mb: 1.5 }}>
{`React SPA (Оформление визита /checkout, порт 5174/5175)
   │  [✓] Пробить чек на ККТ  •  Тег 1008 (тел/email)  •  Способ оплаты (карта / наличные / СБП)
   ▼
Express.js API Gateway (сервер ОртоERP, порт 5000, routes: /api/fiscal/*)
   │  Контроль транзакций, чтение настроек из SQLite fiscal_profiles, проксирование
   ▼
C# .NET Fiscal Daemon (OrthoErp.FiscalService, порт 5050 / Kestrel REST API)
   │  Single-Consumer Queue (Channel<FiscalTask>) — монопольная последовательная очередь
   ▼
Физический драйвер Atol DTO 10 (fptr10.dll, COM3, 115200 бод) ИЛИ AtolMockDriver (эмулятор)
   │
   ▼
Таблицы аудита SQLite (fiscal_receipts, fiscal_audit_logs) + Serilog Rolling File Logs`}
            </Paper>

            <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 1.5 }}>
              <strong>Монопольный доступ к COM-порту:</strong> Виртуальный COM-порт (COM3) и библиотека <code>fptr10.dll</code> не поддерживают параллельных потоков. Любая попытка параллельного вызова приводит к ошибке «Порт занят» (-6) или блокировке аппарата. Все кассовые операции в ОртоERP строго упорядочены в единую очередь задач (Single-Consumer Queue / FIFO).
            </Alert>

            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
              <strong>Критерий истинности фискализации (Popper Test):</strong> Факт обрыва бумаги или замятия ленты 57 мм не отменяет запись документа в Фискальный Накопитель (ФН). Решающим критерием успеха является закрытие документа в ФН (<code>LIBFPTR_PARAM_DOCUMENT_CLOSED: true</code>) и присвоение реквизитов <strong>ФД №</strong> и <strong>ФПД</strong>, а не физическая печать на бумаге.
            </Alert>
          </Box>

          <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              6.2. Регламент кассира: пробитие чека при оформлении визита (`/checkout`)
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1.5 }}>
              При расчете с пациентом за оказанные медицинские сервисы оператор выполняет следующие действия:
            </Typography>

            <Box component="ol" sx={{ pl: 2.5, m: 0, color: '#334155', '& li': { mb: 1.2, lineHeight: 1.5 } }}>
              <li>
                <strong>Шаг 1: Формирование позиций визита.</strong> В мастере <code>/checkout</code> оператор выбирает пациента, лечащего врача и состав медицинских сервисов с фактическими расходниками.
              </li>
              <li>
                <strong>Шаг 2: Включение фискализации.</strong> На этапе «Оплата» оператор активирует чекбокс <strong>«Пробить фискальный чек на ККТ (54-ФЗ)»</strong>.
              </li>
              <li>
                <strong>Шаг 3: Проверка контакта покупателя (Тег 1008).</strong> В поле «Телефон или E-mail пациента» автоматически подставляется контакт из ЭМК (например, <code>+79881234567</code>). Это обязательное требование 54-ФЗ для отправки электронного чека оператором фискальных данных (ОФД).
              </li>
              <li>
                <strong>Шаг 4: Выбор формы оплаты.</strong> Оператор указывает форму расчета (банковская карта, наличные, СБП, безналичный расчет).
              </li>
              <li>
                <strong>Шаг 5: Пробитие и печать чека.</strong> Оператор нажимает <strong>«Оплатить визит и пробить чек»</strong>. Документ закрывается в ФН, касса печатает чек, а в МИС фиксируются реквизиты: <strong>№ ФД</strong>, <strong>ФПД</strong>, <strong>№ ФН</strong> и QR-код.
              </li>
            </Box>
          </Box>

          <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              6.3. Управление кассовыми сменами, сверка наличности и Z-отчет (54-ФЗ)
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1.5, lineHeight: 1.6 }}>
              Подсистема управления кассовыми сменами в ОртоERP реализует строгий регламент Федерального закона № 54-ФЗ с автоматизацией жизненного цикла смены и кассовой дисциплины:
            </Typography>

            <Box component="ul" sx={{ pl: 2.5, m: 0, color: '#334155', '& li': { mb: 1.2, lineHeight: 1.5 } }}>
              <li>
                <strong>Автоматическое открытие смены:</strong> Смена открывается автоматически при пробитии первого фискального чека за день, либо вручную через бейдж кассы в шапке или в разделе <code>/admin/fiscal-shifts</code>. Номер смены формируется в мнемоническом формате: <code>СМ-YYYYMMDD-NNN</code> (например, <code>СМ-20261011-001</code>).
              </li>
              <li>
                <strong>Контроль 24-часового лимита смены (54-ФЗ):</strong> Согласно ст. 4.3 54-ФЗ, продолжительность смены не может превышать 24 часа. В шапке системы отображается таймер обратного отсчета с цветовой индикацией (зеленый &gt; 2ч, желтый &lt; 2ч, красный — смена истекла). По истечении 24 часов фискализация новых чеков блокируется до закрытия смены Z-отчетом.
              </li>
              <li>
                <strong>Промежуточный X-отчет (без гашения):</strong> Позволяет в любой момент проверить текущую выручку по типам оплат (наличные, карта, СБП) и сумму в денежном ящике без закрытия смены.
              </li>
              <li>
                <strong>Закрытие смены (Z-отчет) и сверка кассы:</strong> Мастер закрытия смены включает встроенный <em>калькулятор купюр и монет</em> (5000, 2000, 1000, 500, 200, 100 ₽, монеты). Система сравнивает фактическую сумму с расчетным остатком и автоматически определяет излишек, недостачу или точное совпадение.
              </li>
              <li>
                <strong>Печать и архивация отчетов:</strong> Предусмотрены два режима печати: чек Z-отчета на узкой термоленте (80 мм / 58 мм) для кассовой книги и полностраничный бухгалтерский акт А4 с подписями кассира и главбуха. Все смены архивируются в таблице <code>fiscal_shifts</code> с возможностью выгрузки в Excel и JSON.
              </li>
            </Box>
          </Box>
        </Box>
      )
    },
    {
      id: 'section-services-health',
      category: 'services_health',
      title: '7. Мониторинг и диагностика доступности служб бэкенда',
      subtitle: 'Контроль состояния 6 серверных служб клиники: Express, SQLite, Fiscal Daemon, Firebird, Swagger, Backups',
      icon: <DnsIcon sx={{ color: '#0F3C64' }} />,
      tags: ['сервер', 'службы', 'бэкенд', 'health', 'мониторинг', 'диагностика', 'express', 'sqlite', 'firebird', 'fiscal daemon', 'swagger', 'backups'],
      searchableText: `
        Мониторинг служб бэкенда диагностика доступности /admin/server-health GET /api/admin/services/status POST /api/admin/services/test-all
        1. Express REST API Gateway порт 5000 Node.js PID Uptime RAM RSS Heap память
        2. SQLite Database Storage orthopedic_data_center.sqlite WAL PRAGMA quick_check integrity ok foreign_keys ON 40 таблиц 61301 пациентов
        3. OrthoErp.FiscalService .NET Daemon порт 5050 KКТ АТОЛ 91Ф COM3 смена №14 Serilog SQLite sink
        4. Firebird SQL Server MEDICAL.FDB порт 3050 61298 пациентов 37538 визитов 36560 договоров 22 канала 19 страховщиков 97 ДМС карт
        5. OpenAPI Swagger UI /api-docs спецификация 3.0 интерактивная документация REST API
        6. SQLite Hot Backup Subsystem VACUUM INTO backups/ авторезервирование ротация 7 снимков
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
                  <TableCell sx={{ fontWeight: 600 }}>Express API Gateway</TableCell>
                  <TableCell><code>http://localhost:5000</code></TableCell>
                  <TableCell>Node.js версия, PID процесса, время непрерывной работы (Uptime), память RSS и Heap</TableCell>
                  <TableCell>HTTP 200, отклик &lt; 50 мс</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>SQLite Database</TableCell>
                  <TableCell><code>db/orthopedic_data_center.sqlite</code></TableCell>
                  <TableCell><code>PRAGMA quick_check = ok</code>, режим WAL, <code>foreign_keys = ON</code>, число таблиц (40) и записей</TableCell>
                  <TableCell>Целостность подтверждена (OK)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>OrthoErp.FiscalService</TableCell>
                  <TableCell><code>http://localhost:5050</code></TableCell>
                  <TableCell>.NET Daemon, готовность кассы АТОЛ 91Ф на COM3, статус смены, активность Serilog Sink</TableCell>
                  <TableCell>Online: true, порт доступен</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Firebird SQL Server</TableCell>
                  <TableCell><code>localhost:3050 (MEDICAL.FDB)</code></TableCell>
                  <TableCell>Доступность внешней МИС: картотека 61 298 пациентов, 37 538 визитов, 36 560 договоров, ДМС</TableCell>
                  <TableCell>Успешный пинг и чтение таблиц</TableCell>
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
      category: 'test_daemon',
      title: '8. Автономный контур тестирования [TEST_DAEMON] (45 проверок)',
      subtitle: 'Изолированный контур валидации: Single/Multi услуги, Solo/Brigade персонал, ACID коммиты и BI сходимость',
      icon: <SmartToyIcon sx={{ color: '#0F3C64' }} />,
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
      category: 'print',
      title: '9. Печатные регламентные формы и экспорт данных',
      subtitle: 'Стандарты вывода на печать бланков формата А4, термочеков 57 мм, сохранение в PDF и экспорт в MS Excel',
      icon: <DescriptionIcon sx={{ color: '#0F3C64' }} />,
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
      category: 'faq',
      title: '10. Частые вопросы и диагностика неисправностей (FAQ)',
      subtitle: 'Решение типовых ситуаций, снятие зависших блокировок, сбои ККТ, проверка служб и бэкапы',
      icon: <HelpOutlineIcon sx={{ color: '#0F3C64' }} />,
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
    }
  ], []);

  // Split query into individual search tokens
  const searchTokens = useMemo(() => {
    return searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
  }, [searchQuery]);

  // Comprehensive full-text filtering
  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      const matchesCategory = selectedCategory === 'all' || sec.category === selectedCategory;
      if (!matchesCategory) return false;

      if (searchTokens.length === 0) return true;

      // Full-text aggregate across all textual contents, tags, title and subtitle
      const aggregate = `${sec.title} ${sec.subtitle} ${sec.tags.join(' ')} ${sec.searchableText}`.toLowerCase();
      return searchTokens.every(token => aggregate.includes(token));
    });
  }, [sections, selectedCategory, searchTokens]);

  // Auto-expand matching sections when user types a search query
  useEffect(() => {
    if (searchTokens.length > 0) {
      const newExpanded: Record<string, boolean> = {};
      filteredSections.forEach((s) => {
        newExpanded[s.id] = true;
      });
      setExpandedSections(newExpanded);
    }
  }, [searchTokens, filteredSections]);

  const handleToggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
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

  // Category filter items
  const categoryFilters = [
    { id: 'all', label: 'Все разделы', count: sections.length },
    { id: 'architecture', label: '1. Архитектура & БД', count: sections.filter(s => s.category === 'architecture').length },
    { id: 'formulas', label: '2. Формулы & Маржа', count: sections.filter(s => s.category === 'formulas').length },
    { id: 'flow', label: '3. Поток визитов & Расчет', count: sections.filter(s => s.category === 'flow').length },
    { id: 'workflow', label: '4. Ввод данных', count: sections.filter(s => s.category === 'workflow').length },
    { id: 'screens', label: '5. Рабочие экраны', count: sections.filter(s => s.category === 'screens').length },
    { id: 'fiscal', label: '6. Фискализация ККТ', count: sections.filter(s => s.category === 'fiscal').length },
    { id: 'services_health', label: '7. Сервисы сервера', count: sections.filter(s => s.category === 'services_health').length },
    { id: 'test_daemon', label: '8. Тесты [TEST_DAEMON]', count: sections.filter(s => s.category === 'test_daemon').length },
    { id: 'print', label: '9. Печать & Экспорт', count: sections.filter(s => s.category === 'print').length },
    { id: 'faq', label: '10. FAQ & Ошибки', count: sections.filter(s => s.category === 'faq').length },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1440px', margin: '0 auto', gap: 3, pb: 6 }}>
      {/* Hidden A4 Printable Template for react-to-print */}
      <Box sx={{ display: 'none' }}>
        <UserGuidePrintTemplate ref={printRef} version="1.4.1" />
      </Box>

      {/* Top Header & Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.5px' }}>
              Инструкция пользователя МИС «ОртоERP»
            </Typography>
            <Chip
              label="v1.4.1"
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
              sx={{ textTransform: 'none', fontWeight: 600, color: '#0F3C64', borderColor: '#CBD5E1' }}
            >
              Развернуть все
            </Button>
          </Tooltip>
          <Tooltip title="Свернуть все разделы инструкции" arrow enterDelay={200}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<UnfoldLessIcon />}
              onClick={handleCollapseAll}
              sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#CBD5E1' }}
            >
              Свернуть все
            </Button>
          </Tooltip>
          <Tooltip title="Сформировать и сохранить официальную версию инструкции в PDF (формат А4)" arrow enterDelay={200}>
            <Button
              variant="contained"
              startIcon={<PictureAsPdfIcon />}
              onClick={() => handlePrintTrigger()}
              sx={{
                bgcolor: '#0F3C64',
                textTransform: 'none',
                fontWeight: 700,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#0A2744' }
              }}
            >
              Печать / Скачать PDF
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Search and Filter Panel */}
      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #E2E8F0', borderRadius: 2.5, bgcolor: '#FFFFFF' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Полнотекстовый поиск по руководству (например: маржинальная база, 1.15, Cap 60%, мульти визит, бригада, сторно, Soft Lock, 5000, АТОЛ 91Ф, Popper, SQLite)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#64748B' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')} title="Очистить поиск">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#F8FAFC',
                '&:hover': { bgcolor: '#F1F5F9' },
                '&.Mui-focused': { bgcolor: '#FFFFFF' }
              }
            }}
          />

          {/* Category Chips and Match Stats */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              {categoryFilters.map((cat) => (
                <Chip
                  key={cat.id}
                  label={`${cat.label} (${cat.count})`}
                  onClick={() => setSelectedCategory(cat.id)}
                  color={selectedCategory === cat.id ? 'primary' : 'default'}
                  variant={selectedCategory === cat.id ? 'filled' : 'outlined'}
                  size="small"
                  sx={{
                    fontWeight: selectedCategory === cat.id ? 700 : 500,
                    borderRadius: 1.5,
                    cursor: 'pointer'
                  }}
                />
              ))}
            </Box>

            <Chip
              label={`Найдено разделов: ${filteredSections.length} из ${sections.length}`}
              color={filteredSections.length > 0 ? 'info' : 'warning'}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Zero search results alert */}
      {filteredSections.length === 0 && (
        <Alert
          severity="info"
          sx={{ borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
              Сбросить поиск
            </Button>
          }
        >
          По запросу «<strong>{searchQuery}</strong>» в выбранной категории не найдено разделов. Попробуйте изменить формулировку или сбросить фильтр.
        </Alert>
      )}

      {/* Guide Accordions */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {filteredSections.map((sec) => {
          const isExpanded = !!expandedSections[sec.id];
          return (
            <Accordion
              key={sec.id}
              expanded={isExpanded}
              onChange={() => handleToggleSection(sec.id)}
              elevation={0}
              sx={{
                border: '1px solid #E2E8F0',
                borderRadius: '12px !important',
                mb: 1,
                bgcolor: '#FFFFFF',
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  boxShadow: '0 4px 16px rgba(15, 60, 100, 0.06)',
                  borderColor: '#CBD5E1'
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#0F3C64' }} />}
                sx={{
                  px: 2.5,
                  py: 1,
                  '&.Mui-expanded': { borderBottom: '1px solid #F1F5F9' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sec.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.3 }}>
                      {sec.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.2 }}>
                      {sec.subtitle}
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3, bgcolor: '#FAFCFE' }}>
                {sec.content}

                {/* Section tags */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 3, pt: 2, borderTop: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', mr: 0.5, alignSelf: 'center', fontWeight: 600 }}>
                    Теги:
                  </Typography>
                  {sec.tags.map((t) => (
                    <Chip
                      key={t}
                      label={`#${t}`}
                      size="small"
                      onClick={() => setSearchQuery(t)}
                      sx={{ fontSize: '0.72rem', height: 22, bgcolor: '#F1F5F9', color: '#475569', cursor: 'pointer', '&:hover': { bgcolor: '#E2E8F0' } }}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Box>
  );
}

import React, { useState, useMemo, useRef } from 'react';
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
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

import { UserGuidePrintTemplate } from '../components/UserGuidePrintTemplate';

interface GuideSection {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  icon: React.ReactElement;
  tags: string[];
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
    'section-print': false,
    'section-faq': false,
  });

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintTrigger = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Руководство_пользователя_ОртоERP_v1.3.0_${new Date().toISOString().slice(0, 10)}`,
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
      tags: ['сущности', 'er', 'база данных', 'foreign keys', 'пациенты', 'сотрудники', 'сервисы', 'bom', 'склад', 'начисления'],
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
      tags: ['параметры', 'формулы', 'расчет', 'маржа', '1.15', 'коэффициент', 'cap', 'гарантированный минимум', 'себестоимость'],
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
              Если стоимость расходников превышает цену сервиса (высокозатратный сервис), маржинальная база равна 0 ₽, но врач гарантированно получает оплату по своему минимальному тарифу.
            </Alert>
          </Box>

          <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              3. Сдельное вознаграждение специалиста (Staff Payout)
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1 }}>
              Выплата рассчитывается по процентной ставке специалиста с проверкой персонального гарантированного минимума (<code>fixed_min_payout</code>):
            </Typography>
            <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: '0.88rem' }}>
              Выплата = max(Маржинальная база × (Ставка % / 100), Гарантированный минимум)
            </Paper>
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
      title: '3. Регламентный поток бизнес-процесса (Flow)',
      subtitle: 'Жизненный цикл оказания сервисов: регистрация, мягкая блокировка, предварительный расчет, ACID коммит, сторно',
      icon: <TimelineIcon sx={{ color: '#0F3C64' }} />,
      tags: ['flow', 'бизнес-процесс', 'жизненный цикл', 'блокировка', 'коммит', 'сторно', 'корректировка', 'ведомость'],
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
            Весь процесс начисления сдельной оплаты труда сотрудников регламентирован строгой последовательностью фаз:
          </Typography>

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
      tags: ['ввод данных', 'инструкция', 'номенклатура', 'bom', 'пациенты', 'сотрудники', 'порядок'],
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
      tags: ['экраны', 'интерфейс', 'навигация', 'пациенты', 'склад', 'выплаты', 'параметры', 'би'],
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
                Мастер тестов ККТ [TEST_DAEMON] (`/admin/fiscal-test-wizard`)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.85rem' }}>
                • Пошаговая верификация ККТ: 1) связь и статус смены; 2) тестовый чек; 3) Х/Z отчеты; 4) Popper test.<br />
                • Проверка печати и закрытия чека при обрыве/замятии ленты 57 мм.<br />
                • Генерация изолированных тестовых чеков прихода и возврата с маркером <code>[TEST_DAEMON]</code>.<br />
                • Быстрая очистка тестовых данных одной кнопкой без ущерба рабочей отчетности.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Журнал аудита ККТ и чеков (`/fiscal-audit`)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.85rem' }}>
                • Реестр всех пробитых фискальных чеков (DataGrid с поиском по ФД, ФПД, ФН и пациентам).<br />
                • Просмотр детального чека с QR-кодом, печать дубликата на термоленту 57 мм и экспорт в PDF.<br />
                • Вкладка «Журнал аудита (Serilog)»: просмотр технических событий драйвера fptr10 и ошибок ККТ.<br />
                • Оформление возврата прихода (Sell Return) по зарегистрированным чекам.
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
      tags: ['ккт', 'атол', 'атол 91ф', 'фискализация', '54-фз', 'чек', 'фд', 'фпд', 'фн', 'тег 1008', 'офд', 'mock', 'com-порт', 'popper test', 'z-отчет', 'х-отчет', 'смена', 'кассир', 'serilog', 'чеки'],
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* 6.1. АРХИТЕКТУРНЫЙ КОНТУР */}
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              6.1. Архитектурная модель сервиса фискализации и монопольный доступ к COM-порту
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1.5, lineHeight: 1.6 }}>
              Интеграция кассового аппарата <strong>АТОЛ 91Ф</strong> (работающего в режиме фискального регистратора по протоколу ДТО 10) построена по многоуровневой отказоустойчивой схеме:
            </Typography>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: '0.82rem', whiteSpace: 'pre-wrap', lineHeight: 1.5, mb: 1.5 }}>
{`React SPA (Оформление визита /checkout, порт 5174)
   │  [✓] Пробить чек на ККТ  •  Тег 1008 (тел/email)  •  Способ оплаты (карта / наличные / СБП)
   ▼
Express.js API Gateway (сервер ОртоERP, порт 5000, routes: /api/fiscal/*)
   │  Контроль транзакций, чтение настроек из SQLite fiscal_profiles, проксирование
   ▼
C# .NET 8/9 Fiscal Daemon (OrthoErp.FiscalService, порт 5050 / Kestrel REST API)
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

          {/* 6.2. РЕГЛАМЕНТ КАССИРА ПРИ ОФОРМЛЕНИИ ВИЗИТА */}
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
                <strong>Шаг 4: Выбор формы оплаты.</strong> Оператор указывает форму расчета:
                <br />• <strong>Банковская карта (электронные):</strong> терминал эквайринга;
                <br />• <strong>Наличные:</strong> оплата наличными деньгами в кассу клиники;
                <br />• <strong>СБП (электронные):</strong> оплата по QR-коду Системы быстрых платежей;
                <br />• <strong>Безналичный расчет:</strong> по договору / счету организации.
              </li>
              <li>
                <strong>Шаг 5: Пробитие и печать чека.</strong> Оператор нажимает <strong>«Оплатить визит и пробить чек»</strong>:
                <br />• Сервер передает чек в очередь ККТ, аппарат регистрирует позиции сервисов с указанием ставки НДС (по умолчанию «Без НДС» по ст. 149 НК РФ);
                <br />• Документ закрывается в ФН, касса печатает чек на ленте 57 мм;
                <br />• В МИС мгновенно отображаются реквизиты: <strong>№ ФД</strong>, <strong>ФПД</strong>, <strong>№ ФН</strong>, номер смены и QR-код для верификации в ФНС.
              </li>
            </Box>
          </Box>

          {/* 6.3. КАССОВЫЕ СМЕНЫ И РЕГЛАМЕНТНЫЕ ОТЧЕТЫ (X / Z) */}
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              6.3. Кассовые смены и регламентные отчеты (Открытие смены, Х-отчет, Z-отчет)
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1.5 }}>
              Работа с кассовой сменой подчиняется строгим правилам налогового законодательства РФ:
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon fontSize="small" sx={{ color: '#16A34A' }} /> 1. Открытие смены
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 0.8, fontSize: '0.85rem' }}>
                  Смена открывается автоматически при печати первого чека за день, либо вручную в <strong>Мастере тестов ККТ</strong>. Печатается отчет об открытии смены с фиксацией даты и времени.
                </Typography>
              </Paper>

              <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptLongIcon fontSize="small" sx={{ color: '#2563EB' }} /> 2. Х-отчет (без гашения)
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 0.8, fontSize: '0.85rem' }}>
                  Промежуточный отчет для кассира. Позволяет в любой момент рабочего дня сверить фактическую сумму наличных и безналичных оплат в кассе без закрытия смены и без отправки данных в ФНС.
                </Typography>
              </Paper>

              <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LockIcon fontSize="small" sx={{ color: '#DC2626' }} /> 3. Z-отчет (с гашением)
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 0.8, fontSize: '0.85rem' }}>
                  Обязательное закрытие смены в конце рабочего дня. Фискальный документ закрытия смены передается в ОФД. <strong>Внимание:</strong> длительность смены не должна превышать 24 часа.
                </Typography>
              </Paper>
            </Box>
          </Box>

          {/* 6.4. ВОЗВРАТЫ И СТОРНИРОВАНИЕ ЧЕКОВ */}
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              6.4. Возврат прихода (Storno чека)
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1 }}>
              Если пациент отказался от сервиса или произошла ошибка в сумме, оформляется чек <strong>«Возврат прихода»</strong> (<code>LIBFPTR_RT_SELL_RETURN</code>):
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.88rem' }}>
              • В разделе <strong>«Журнал чеков»</strong> (<code>/fiscal-audit</code>) оператор выбирает нужный чек и нажимает кнопку <strong>«Оформить возврат прихода»</strong>.<br />
              • Аппарат пробивает чек возврата с отрицательным движением по регистру оплат и привязкой к реквизитам исходного чека прихода.<br />
              • В МИС создается зеркальная запись со статусом <code>sell_return</code>, исключающая расхождение между кассой и банковской выпиской.
            </Typography>
          </Box>

          {/* 6.5. УПРАВЛЕНИЕ ПАРАМЕТРАМИ ККТ В БД И АУДИТ SERILOG */}
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              6.5. Управление параметрами ККТ в БД (`/admin/fiscal-settings`) и аудит Serilog
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1.5 }}>
              Все параметры фискального регистратора перенесены из конфигурационных файлов в реляционную таблицу <code>fiscal_profiles</code>:
            </Typography>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #CBD5E1', borderRadius: 2, mb: 1.5 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#EDF2F7' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Параметр</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Значение по умолчанию</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Назначение и влияние на чек</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Организация в чеке</TableCell>
                    <TableCell><code>ИЧП Добрушкин А.М.</code></TableCell>
                    <TableCell>Наименование юридического лица / ИП (тег 1048)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Подразделение / Клиника</TableCell>
                    <TableCell><code>Клиника доктора Добрушкина</code></TableCell>
                    <TableCell>Торговый объект / место расчетов (тег 1009)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Адрес расчетов</TableCell>
                    <TableCell><code>г. Сочи, ул. Транспортная 65</code></TableCell>
                    <TableCell>Фактический адрес установки ККТ (тег 1009)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>ИНН организации</TableCell>
                    <TableCell><code>450107060083</code></TableCell>
                    <TableCell>Идентификационный номер налогоплательщика (тег 1018)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>ОГРНИП</TableCell>
                    <TableCell><code>323237500208220</code></TableCell>
                    <TableCell>ОГРН индивидуального предпринимателя</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Ставка НДС</TableCell>
                    <TableCell><code>Без НДС (ст. 149 НК РФ)</code></TableCell>
                    <TableCell>Валидация любого значения (Без НДС, 0%, 20%). Для медицинских сервисов применяется освобождение от НДС</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Кассир по умолчанию</TableCell>
                    <TableCell><code>Добрушкин А.М.</code></TableCell>
                    <TableCell>ФИО кассира (тег 1021) и ИНН кассира (тег 1203)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>COM-порт и Скорость</TableCell>
                    <TableCell><code>COM3 • 115200 бод</code></TableCell>
                    <TableCell>Физический интерфейс связи с ньюджером АТОЛ 91Ф</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Режим Mock-эмулятора</TableCell>
                    <TableCell><code>false / true</code></TableCell>
                    <TableCell>Переключатель между физическим аппаратом и программным эмулятором</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.88rem' }}>
              <strong>Аудиторский след (Serilog):</strong> Любое изменение профиля (смена порта, ИНН, кассира, ставки НДС) атомарно записывается в таблицу <code>fiscal_audit_logs</code> с указанием автора, старых и новых значений, обеспечивая полную прозрачность настроек.
            </Typography>
          </Box>

          {/* 6.6. АВТОНОМНЫЙ РЕЖИМ ЭМУЛЯЦИИ И ТЕСТОВЫЙ МАСТЕР */}
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              6.6. Автономный режим эмуляции (Mock Mode) и тестовый мастер [TEST_DAEMON]
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mb: 1.5 }}>
              Для обеспечения непрерывности работы клиники и проведения безопасного обучения персонала в систему внедрен Mock-контур:
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                  Бесперебойная работа клиники при сбое ККТ
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 0.8, fontSize: '0.85rem' }}>
                  Если кассовый кабель отключен, закончился ресурс ФН или аппарат находится в ремонте, администратор активирует флаг <strong>«Использовать Mock-эмулятор»</strong> в параметрах. Приложение продолжает оформлять визиты и рассчитывать сдельные выплаты врачам без аварийных остановок.
                </Typography>
              </Paper>

              <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                  Мастер тестов ККТ (`/admin/fiscal-test-wizard`)
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 0.8, fontSize: '0.85rem' }}>
                  Позволяет в реальном времени проверить состояние кассы по 4 шагам, сгенерировать изолированные тестовые чеки <code>[TEST_DAEMON]</code> и протестировать поведение системы при обрыве чековой ленты (Popper Test). Тестовые чеки удаляются одной кнопкой.
                </Typography>
              </Paper>
            </Box>
          </Box>
        </Box>
      )
    },
    {
      id: 'section-print',
      category: 'print',
      title: '7. Печатные регламентные формы и экспорт данных',
      subtitle: 'Стандарты вывода на печать бланков формата А4, термочеков 57 мм, сохранение в PDF и экспорт в MS Excel',
      icon: <DescriptionIcon sx={{ color: '#0F3C64' }} />,
      tags: ['печать', 'pdf', 'а4', 'ведомость', 'экспорт', 'excel', 'csv', 'react-to-print', 'термолента', 'чек'],
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
              • Файлы выгружаются с кодировкой UTF-8 и байтовым маркером <code>\\uFEFF</code>.<br />
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
      title: '8. Частые вопросы и диагностика неисправностей (FAQ)',
      subtitle: 'Решение типовых ситуаций, снятие зависших блокировок, сбои ККТ и регламент резервного копирования',
      icon: <HelpOutlineIcon sx={{ color: '#0F3C64' }} />,
      tags: ['faq', 'ошибки', 'блокировка', 'backup', 'база данных', 'вопросы', 'ккт', 'атол', 'com-порт', 'смена 24'],
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
              Вопрос: В процессе печати чека закончилась или замялась бумага (Popper Test). Фискализирован ли чек?
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontSize: '0.88rem' }}>
              Да! В соответствии с архитектурным принципом Popper Test, если документ закрыт в Фискальном Накопителе (получен номер ФД), операция юридически совершена и передана в ОФД. Заправьте новый рулон ленты 57 мм и в Журнале чеков (<code>/fiscal-audit</code>) нажмите <strong>«Печать копии чека»</strong> для выдачи пациенту бумажного дубликата. Повторно пробивать чек через оформление визита <strong>не требуется</strong>!
            </Typography>
          </Box>

          <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
              Вопрос: Ошибка ККТ: «Смена превысила 24 часа». Как продолжить работу?
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontSize: '0.88rem' }}>
              По требованиям 54-ФЗ кассовая смена не может длиться более 24 часов. Если смена не была закрыта вчера вечером, касса заблокирует печать чеков прихода. Перейдите в <strong>«Мастер тестов ККТ»</strong> (<code>/admin/fiscal-test-wizard</code>) на Шаг 3 и нажмите <strong>«Сформировать Z-отчет (Закрыть смену)»</strong>. После успешного закрытия смены касса готова к работе, и следующая смена откроется автоматически при первом чеке.
            </Typography>
          </Box>

          <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
              Вопрос: Как работают резервные копии базы данных?
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontSize: '0.88rem' }}>
              Сервер делает автоматические горячие резервные снимки (Hot Backup) при каждом запуске и каждые 6 часов в папку <code>db/backups/</code>. Для отката достаточно скопировать нужный <code>.sqlite</code> файл поверх основного.
            </Typography>
          </Box>

          <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
              Вопрос: Как работает тестовый набор демо-данных [TEST_DAEMON]?
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontSize: '0.88rem' }}>
              В разделах <strong>«Администратор → Демо-данные»</strong> и <strong>«Мастер тестов ККТ»</strong> доступен автономный контур тестирования. Он создает полностью изолированные карточки пациентов, врачей, сервисы, ведомости и чеки с префиксом <code>[TEST_DAEMON]</code>. Они не влияют на базовую отчетность клиники и удаляются одной кнопкой.
            </Typography>
          </Box>
        </Box>
      )
    }
  ], []);

  // Filter sections by search and category
  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      const matchesCategory = selectedCategory === 'all' || sec.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const inTitle = sec.title.toLowerCase().includes(q);
      const inSubtitle = sec.subtitle.toLowerCase().includes(q);
      const inTags = sec.tags.some(t => t.toLowerCase().includes(q));
      return inTitle || inSubtitle || inTags;
    });
  }, [sections, selectedCategory, searchQuery]);

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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1440px', margin: '0 auto', gap: 3, pb: 6 }}>
      {/* Hidden A4 Printable Template for react-to-print */}
      <Box sx={{ display: 'none' }}>
        <UserGuidePrintTemplate ref={printRef} version="1.3.0" />
      </Box>

      {/* Top Header & Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.5px' }}>
              Инструкция пользователя МИС «ОртоERP»
            </Typography>
            <Chip
              label="v1.3.0"
              size="small"
              sx={{ bgcolor: '#EBF8FF', color: '#0F3C64', fontWeight: 800, border: '1px solid #BEE3F8' }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
            Интерактивный технологический регламент клиники: архитектура сущностей, параметры расчетов, сквозной поток (flow) и печатные формы
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
            placeholder="Полнотекстовый поиск по руководству (например: маржинальная база, 1.15, Cap, сторно, Soft Lock, ЭМК, BOM, SQLite)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#0F3C64' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: { borderRadius: 2, bgcolor: '#F8FAFC' }
              }
            }}
          />

          {/* Quick Filter Categories */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mr: 0.5 }}>
              Разделы:
            </Typography>
            <Chip
              label="Все разделы"
              size="small"
              onClick={() => setSelectedCategory('all')}
              sx={{
                fontWeight: 700,
                cursor: 'pointer',
                bgcolor: selectedCategory === 'all' ? '#0F3C64' : '#F1F5F9',
                color: selectedCategory === 'all' ? '#FFFFFF' : '#475569'
              }}
            />
            <Chip
              label="Сущности и ER"
              size="small"
              onClick={() => setSelectedCategory('architecture')}
              sx={{
                fontWeight: 700,
                cursor: 'pointer',
                bgcolor: selectedCategory === 'architecture' ? '#0F3C64' : '#F1F5F9',
                color: selectedCategory === 'architecture' ? '#FFFFFF' : '#475569'
              }}
            />
            <Chip
              label="Формулы и расчеты"
              size="small"
              onClick={() => setSelectedCategory('formulas')}
              sx={{
                fontWeight: 700,
                cursor: 'pointer',
                bgcolor: selectedCategory === 'formulas' ? '#0F3C64' : '#F1F5F9',
                color: selectedCategory === 'formulas' ? '#FFFFFF' : '#475569'
              }}
            />
            <Chip
              label="Бизнес-процессы (Flow)"
              size="small"
              onClick={() => setSelectedCategory('flow')}
              sx={{
                fontWeight: 700,
                cursor: 'pointer',
                bgcolor: selectedCategory === 'flow' ? '#0F3C64' : '#F1F5F9',
                color: selectedCategory === 'flow' ? '#FFFFFF' : '#475569'
              }}
            />
            <Chip
              label="Ввод данных"
              size="small"
              onClick={() => setSelectedCategory('workflow')}
              sx={{
                fontWeight: 700,
                cursor: 'pointer',
                bgcolor: selectedCategory === 'workflow' ? '#0F3C64' : '#F1F5F9',
                color: selectedCategory === 'workflow' ? '#FFFFFF' : '#475569'
              }}
            />
            <Chip
              label="Рабочие экраны"
              size="small"
              onClick={() => setSelectedCategory('screens')}
              sx={{
                fontWeight: 700,
                cursor: 'pointer',
                bgcolor: selectedCategory === 'screens' ? '#0F3C64' : '#F1F5F9',
                color: selectedCategory === 'screens' ? '#FFFFFF' : '#475569'
              }}
            />
            <Chip
              label="Фискализация и ККТ"
              size="small"
              onClick={() => setSelectedCategory('fiscal')}
              sx={{
                fontWeight: 700,
                cursor: 'pointer',
                bgcolor: selectedCategory === 'fiscal' ? '#0F3C64' : '#F1F5F9',
                color: selectedCategory === 'fiscal' ? '#FFFFFF' : '#475569'
              }}
            />
            <Chip
              label="Печать и экспорт"
              size="small"
              onClick={() => setSelectedCategory('print')}
              sx={{
                fontWeight: 700,
                cursor: 'pointer',
                bgcolor: selectedCategory === 'print' ? '#0F3C64' : '#F1F5F9',
                color: selectedCategory === 'print' ? '#FFFFFF' : '#475569'
              }}
            />
            <Chip
              label="FAQ и диагностика"
              size="small"
              onClick={() => setSelectedCategory('faq')}
              sx={{
                fontWeight: 700,
                cursor: 'pointer',
                bgcolor: selectedCategory === 'faq' ? '#0F3C64' : '#F1F5F9',
                color: selectedCategory === 'faq' ? '#FFFFFF' : '#475569'
              }}
            />

            <Box sx={{ flexGrow: 1 }} />
            <Chip
              label={`Показано глав: ${filteredSections.length} из ${sections.length}`}
              size="small"
              sx={{ bgcolor: '#F0F6FA', color: '#0F3C64', fontWeight: 600, border: '1px solid #D6E4F0' }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Accordion Sections List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredSections.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px dashed #CBD5E1', borderRadius: 2 }}>
            <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 600 }}>
              По вашему запросу «{searchQuery}» ничего не найдено
            </Typography>
            <Button
              variant="text"
              size="small"
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              sx={{ mt: 1, textTransform: 'none', fontWeight: 700 }}
            >
              Сбросить фильтры поиска
            </Button>
          </Paper>
        ) : (
          filteredSections.map((sec) => (
            <Accordion
              key={sec.id}
              expanded={Boolean(expandedSections[sec.id])}
              onChange={() => handleToggleSection(sec.id)}
              elevation={0}
              sx={{
                border: '1px solid #E2E8F0',
                borderRadius: '12px !important',
                overflow: 'hidden',
                '&:before': { display: 'none' },
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 4px 12px 0 rgba(15, 60, 100, 0.06)' }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#0F3C64' }} />}
                sx={{
                  bgcolor: expandedSections[sec.id] ? '#F8FAFC' : '#FFFFFF',
                  borderBottom: expandedSections[sec.id] ? '1px solid #E2E8F0' : 'none',
                  px: 2.5,
                  py: 1.5
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Box sx={{ p: 1, bgcolor: '#F0F6FA', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sec.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.3 }}>
                      {sec.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.85rem', mt: 0.2 }}>
                      {sec.subtitle}
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3, bgcolor: '#FFFFFF' }}>
                {sec.content}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>
    </Box>
  );
}

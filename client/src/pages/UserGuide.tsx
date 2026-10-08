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
      tags: ['сущности', 'er', 'база данных', 'foreign keys', 'пациенты', 'персонал', 'операции', 'bom', 'склад', 'начисления'],
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
            Система МИС «ОртоERP» построена на единой реляционной СУБД SQLite с включенным контролем внешних ключей (<code>PRAGMA foreign_keys = ON</code>). Это гарантирует, что ни одна операция, визит или начисление не могут существовать без родительских записей пациента и врача.
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
                  <TableCell sx={{ fontWeight: 600 }}>Персонал клиники</TableCell>
                  <TableCell><code>staff</code></TableCell>
                  <TableCell><code>id</code>, <code>full_name</code>, <code>role</code>, <code>department</code>, <code>is_active</code></TableCell>
                  <TableCell>Связан со схемами выплат, ставками и ролями в операциях</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Каталог операций</TableCell>
                  <TableCell><code>operations</code></TableCell>
                  <TableCell><code>id</code>, <code>name</code>, <code>price</code></TableCell>
                  <TableCell>Содержит спецификацию расхода материалов (BOM) в <code>operation_materials</code></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Склад материалов</TableCell>
                  <TableCell><code>materials_catalog</code></TableCell>
                  <TableCell><code>id</code>, <code>material_name</code>, <code>current_unit_cost</code>, <code>package_cost</code></TableCell>
                  <TableCell>Списывается в операциях и транзакциях (<code>transaction_actual_materials</code>)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Схемы выплат</TableCell>
                  <TableCell><code>staff_payout_schemes</code></TableCell>
                  <TableCell><code>id</code>, <code>scheme_name</code>, <code>default_rate_percent</code>, <code>max_team_cap_percent</code></TableCell>
                  <TableCell>Определяет правила расчета для категорий: Хирургия (35%), Консультации (25%), Сестринское (10%)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Записи процедур</TableCell>
                  <TableCell><code>procedure_records</code></TableCell>
                  <TableCell><code>id</code>, <code>source_type</code>, <code>source_id</code>, <code>margin_base</code>, <code>dedup_hash</code></TableCell>
                  <TableCell>Фиксирует факт расчета услуги; защищает от повторного включения в оплату</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Начисления выплат</TableCell>
                  <TableCell><code>staff_payout_accruals</code></TableCell>
                  <TableCell><code>id</code>, <code>sheet_id</code>, <code>staff_id</code>, <code>final_payout</code>, <code>status</code></TableCell>
                  <TableCell>Строки выплат персоналу; группируются в ведомость (<code>staff_payout_sheets</code>)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Мягкие блокировки</TableCell>
                  <TableCell><code>service_calculation_locks</code></TableCell>
                  <TableCell><code>source_type</code>, <code>source_id</code>, <code>lock_token</code>, <code>expires_at</code></TableCell>
                  <TableCell>Защищают услуги от параллельного расчета несколькими операторами (таймаут 30 мин)</TableCell>
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
              Маржинальная база — это очищенный финансовый остаток стоимости услуги после покрытия всех прямых расходов на медикаменты. База ограничена снизу нулем:
            </Typography>
            <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: '0.88rem' }}>
              Маржинальная база = max(0, Цена услуги для пациента − Себестоимость материалов)
            </Paper>
            <Alert severity="info" sx={{ mt: 1.5, borderRadius: 1.5 }}>
              Если стоимость расходников превышает цену услуги (высокозатратная процедура), маржинальная база равна 0 ₽, но врач гарантированно получает оплату по своему минимальному тарифу.
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
      subtitle: 'Жизненный цикл оказания услуг: регистрация, мягкая блокировка, предварительный расчет, ACID коммит, сторно',
      icon: <TimelineIcon sx={{ color: '#0F3C64' }} />,
      tags: ['flow', 'бизнес-процесс', 'жизненный цикл', 'блокировка', 'коммит', 'сторно', 'корректировка', 'ведомость'],
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
            Весь процесс начисления сдельной оплаты труда медицинского персонала регламентирован строгой последовательностью фаз:
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon fontSize="small" sx={{ color: '#16A34A' }} /> Шаг 1: Фиксация приема и процедур
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
                Бухгалтер в модуле «Выплаты сотрудникам» выбирает услуги месяца. Сервер блокирует выбранные строки на 30 минут, генерируя <code>lockToken</code>. Другой бухгалтер не сможет взять те же услуги в параллельный расчет.
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
            <strong>Защита от дублей (Dedup Guard):</strong> Каждая процедура получает уникальный хэш <code>dedup_hash</code>. Повторный запуск коммита тех же услуг не создаст дублирующих начислений — система просто пропустит уже рассчитанные записи.
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
      tags: ['ввод данных', 'инструкция', 'номенклатура', 'bom', 'пациенты', 'персонал', 'порядок'],
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
              <strong>Каталог операций и услуг (`/operations`):</strong> создание позиций процедур, задание цены для пациента, привязка нормативного комплекта расходных материалов через кнопку <strong>«Расходники (BOM)»</strong> с указанием количества.
            </li>
            <li>
              <strong>Персонал и врачи (`/staff`):</strong> ввод сотрудников, распределение по должностям, выбор базовой тарифной схемы (Хирургия 35%, Консультации 25%, Сестринское 10%), назначение персональных фикс-минимумов.
            </li>
            <li>
              <strong>Картотека пациентов (`/patients`):</strong> создание электронной медицинской карты (ЭМК), заполнение ФИО, даты рождения, телефона и полиса ДМС.
            </li>
            <li>
              <strong>Оформление визита (`/checkout`):</strong> выбор пациента, лечащего врача, процедур и фактических расходников с фиксацией способа оплаты.
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
                • Вкладка 1: Мастер расчета с очередью нерассчитанных услуг.<br />
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
          </Box>
        </Box>
      )
    },
    {
      id: 'section-print',
      category: 'print',
      title: '6. Печатные регламентные формы и экспорт данных',
      subtitle: 'Стандарты вывода на печать бланков формата А4, сохранение в PDF и экспорт в MS Excel',
      icon: <DescriptionIcon sx={{ color: '#0F3C64' }} />,
      tags: ['печать', 'pdf', 'а4', 'ведомость', 'экспорт', 'excel', 'csv', 'react-to-print'],
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
              2. Экспорт данных в CSV (Microsoft Excel)
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.88rem' }}>
              • Файлы выгружаются с кодировкой UTF-8 и байтовым маркером <code>\uFEFF</code>.<br />
              • Русскоязычные заголовки колонок, разделитель точка с запятой.<br />
              • Полная совместимость с 1С:ЗУП, клиент-банками и локальными версиями Excel.
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'section-faq',
      category: 'faq',
      title: '7. Частые вопросы и диагностика неисправностей (FAQ)',
      subtitle: 'Решение типовых ситуаций, снятие зависших блокировок и регламент резервного копирования',
      icon: <HelpOutlineIcon sx={{ color: '#0F3C64' }} />,
      tags: ['faq', 'ошибки', 'блокировка', 'backup', 'база данных', 'вопросы'],
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
              Вопрос: Что делать, если услуга заблокирована другим пользователем?
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontSize: '0.88rem' }}>
              Мягкая блокировка действует ровно 30 минут. По истечении этого времени система автоматически снимет блокировку при следующем обращении к серверу. Также блокировку можно снять вручную через интерфейс мастера.
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
              В разделе <strong>«Администратор → Демо-данные»</strong> доступен автономный контур тестирования. Он создает полностью изолированные карточки пациентов, врачей, операции и ведомости с префиксом <code>[TEST_DAEMON]</code>. Они не влияют на базовую отчетность клиники и удаляются одной кнопкой.
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

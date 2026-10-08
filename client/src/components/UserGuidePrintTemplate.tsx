import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

interface UserGuidePrintProps {
  version?: string;
  date?: string;
}

export const UserGuidePrintTemplate = React.forwardRef<HTMLDivElement, UserGuidePrintProps>(
  ({ version = '1.3.0', date = new Date().toLocaleDateString('ru-RU') }, ref) => {
    return (
      <Box 
        ref={ref} 
        sx={{ 
          p: 4, 
          width: '100%', 
          bgcolor: '#FFFFFF', 
          color: '#1A202C',
          fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
          fontSize: '11pt',
          lineHeight: 1.5
        }}
      >
        {/* HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #0F3C64', pb: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img 
              src="/MainLogoTransparent.png" 
              alt="Центр Ортопедии и Травматологии" 
              style={{ width: 72, height: 72, objectFit: 'contain' }} 
            />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.15, fontSize: '15pt' }}>
                Центр Ортопедии и Травматологии доктора Добрушкина
              </Typography>
              <Typography variant="body2" sx={{ color: '#4A5568', fontSize: '9pt', mt: 0.3 }}>
                г. Сочи, ул. Транспортная 65, 3 этаж • Тел: +7 (862) 267-00-00 • МИС «ОртоERP»
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F3C64', display: 'block', fontSize: '9pt' }}>
              РЕГЛАМЕНТ И СТАНДАРТЫ
            </Typography>
            <Typography variant="caption" sx={{ color: '#718096', fontSize: '8.5pt' }}>
              Версия: v{version} • {date}
            </Typography>
          </Box>
        </Box>

        {/* TITLE */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14pt' }}>
            Руководство пользователя и технологический регламент
          </Typography>
          <Typography variant="subtitle2" sx={{ color: '#4A5568', mt: 0.5, fontSize: '10pt', fontStyle: 'italic' }}>
            Порядок работы с картотекой ЭМК, складом, технологическими картами BOM и модулем расчета выплат персоналу
          </Typography>
        </Box>

        {/* SECTION 1: АРХИТЕКТУРА И СУЩНОСТИ */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', borderBottom: '1.5px solid #CBD5E1', pb: 0.5, mb: 1, fontSize: '11pt' }}>
            1. Концептуальная модель данных и взаимосвязь сущностей
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '9.5pt', color: '#2D3748', mb: 1.5 }}>
            Система ОртоERP функционирует на базе реляционной СУБД SQLite с гарантией ссылочной целостности (Foreign Keys). Вся цепочка учета строго изолирована от коллизий и дублирования:
          </Typography>
          <Table size="small" sx={{ mb: 2, border: '1px solid #E2E8F0' }}>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '8.5pt', py: 0.8 }}>Сущность</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '8.5pt', py: 0.8 }}>Таблица БД</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '8.5pt', py: 0.8 }}>Назначение и функциональная роль</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Пациенты (ЭМК)</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>patients</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>Картотека из 61 000+ пациентов, номер карты (ЭМК), ДМС, история визитов</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Персонал клиники</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>staff</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>Реестр врачей-хирургов, консультантов и операционных сестер</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Каталог операций</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>operations</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>Номенклатура процедур, базовая цена для пациента и нормативная спецификация</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Склад материалов</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>materials_catalog</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>Расходные материалы, препараты, учетная стоимость единицы и упаковки</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Спецификация BOM</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>operation_materials</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>Нормы списания расходников на манипуляцию (Bill of Materials)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Начисления выплат</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>staff_payout_accruals</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>Строки сдельного вознаграждения врачам с историей и аудитом сторно</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Ведомости периодов</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>staff_payout_sheets</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>Сводные расчетные листы за месяц (черновик, утверждена, выплачена)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        {/* SECTION 2: ПАРАМЕТРЫ РАСЧЕТОВ И МАТЕМАТИЧЕСКИЙ ДВИЖОК */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', borderBottom: '1.5px solid #CBD5E1', pb: 0.5, mb: 1, fontSize: '11pt' }}>
            2. Параметры настройки и формулы расчетов
          </Typography>
          <Box sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', p: 1.5, borderRadius: 1.5, mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontSize: '9pt', color: '#1A202C', mb: 0.5 }}>
              <strong>1. Себестоимость расходных материалов (с коэффициентом 1.15):</strong><br />
              <code>Себестоимость = (Расход_1 × Цена_ед_1 + ... + Расход_n × Цена_ед_n) × material_cost_factor (1.15)</code>
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '9pt', color: '#1A202C', mb: 0.5 }}>
              <strong>2. Маржинальная база клиники:</strong><br />
              <code>Маржинальная база = max(0, Стоимость процедуры − Себестоимость расходников)</code>
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '9pt', color: '#1A202C', mb: 0.5 }}>
              <strong>3. Выплата специалисту:</strong><br />
              <code>Вознаграждение = max(Маржинальная база × (Ставка % / 100), Гарантированный минимум)</code>
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '9pt', color: '#1A202C' }}>
              <strong>4. Лимит вознаграждения бригады (Team Cap = 60%):</strong><br />
              Сумма долей врача, ассистента и сестры контролируется схемой. При превышении 60% система предупреждает экономиста об отклонении.
            </Typography>
          </Box>
        </Box>

        {/* SECTION 3: БИЗНЕС-ПРОЦЕСС (FLOW) */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', borderBottom: '1.5px solid #CBD5E1', pb: 0.5, mb: 1, fontSize: '11pt' }}>
            3. Регламентный поток бизнес-процесса (Flow)
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '9.5pt', color: '#2D3748', mb: 1 }}>
            Порядок обработки процедур и начисления заработной платы состоит из 6 последовательных шагов:
          </Typography>
          <Box component="ol" sx={{ pl: 2.5, m: 0, fontSize: '9pt', color: '#2D3748', '& li': { mb: 0.5 } }}>
            <li><strong>Оказание услуги и фиксация визита:</strong> врач или администратор через Мастер оформления визита регистрирует факт оказания процедуры. Услуга попадает в статус «Нерассчитано».</li>
            <li><strong>Захват в расчет и мягкая блокировка (Soft Lock):</strong> экономист в модуле «Выплаты сотрудникам» выбирает процедуры расчетного месяца. Система захватывает блокировку на 30 минут, исключая двойную оплату.</li>
            <li><strong>Предварительный расчет (Preview):</strong> система производит мгновенный аудит маржинальности, проверяет фикс-минимумы и лимит бригады (Cap).</li>
            <li><strong>Атомарный коммит начислений (Commit):</strong> фиксация записей в таблицах <code>procedure_records</code> и <code>staff_payout_accruals</code> с освобождением блокировок.</li>
            <li><strong>Ручные корректировки и сторно:</strong> возможность внесения премий/удержаний или полного реверсирования ошибочных строк со статусом <code>storno_reversal</code>.</li>
            <li><strong>Утверждение ведомости и печать А4:</strong> подписание ведомости главным врачом и вывод регламентного бланка на печать.</li>
          </Box>
        </Box>

        {/* SECTION 4: ПОЛНОТЕКСТОВЫЙ ПОИСК */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', borderBottom: '1.5px solid #CBD5E1', pb: 0.5, mb: 1, fontSize: '11pt' }}>
            4. Сквозной полнотекстовый поиск в реестрах
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '9.5pt', color: '#2D3748' }}>
            Все ключевые реестры системы (Картотека пациентов, Склад медикаментов, Параметры расчетов) оснащены полнотекстовым серверным поиском. Ввод любого значения (ФИО, номер ЭМК, телефон, название препарата или маркер <code>TEST_DAEMON</code>) моментально фильтрует данные по всей 61 000+ базе с нормализацией регистра и спецсимволов.
          </Typography>
        </Box>

        {/* FOOTER & APPROVAL BLOCK (UNBREAKABLE CONTAINER) */}
        <Box 
          sx={{ 
            mt: 4, 
            pt: 2.5, 
            borderTop: '2px solid #0F3C64',
            pageBreakInside: 'avoid',
            breakInside: 'avoid'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 2, fontSize: '10pt', textTransform: 'uppercase' }}>
            Лист согласования и утверждения регламента
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#4A5568', display: 'block', fontSize: '8.5pt' }}>
                Главный врач Центра ортопедии:
              </Typography>
              <Box sx={{ borderBottom: '1px solid #718096', height: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: '#718096', fontSize: '8pt' }}>
                Добрушкин В.А. / «___» ________ 2026 г.
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#4A5568', display: 'block', fontSize: '8.5pt' }}>
                Главный бухгалтер / Экономист:
              </Typography>
              <Box sx={{ borderBottom: '1px solid #718096', height: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: '#718096', fontSize: '8pt' }}>
                (Подпись) / «___» ________ 2026 г.
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#4A5568', display: 'block', fontSize: '8.5pt' }}>
                Ответственный за внедрение МИС:
              </Typography>
              <Box sx={{ borderBottom: '1px solid #718096', height: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: '#718096', fontSize: '8pt' }}>
                (Подпись) / «___» ________ 2026 г.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 2.5, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#A0AEC0', fontSize: '7.5pt' }}>
              Документ сформирован автоматически в МИС «ОртоERP» v{version} • Конфиденциально • Внутренний регламент клиники
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }
);

import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

interface UserGuidePrintProps {
  version?: string;
  date?: string;
}

export const UserGuidePrintTemplate = React.forwardRef<HTMLDivElement, UserGuidePrintProps>(
  ({ version = '2.0.1', date = new Date().toLocaleDateString('ru-RU') }, ref) => {
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
            Порядок работы с картотекой ЭМК, складом, технологическими картами BOM и модулем расчета выплат сотрудникам
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
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>Картотека из 61 298 пациентов (32 882 протокола, 37 538 визитов, 63 010 услуг, 14 631 диагноз)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Сотрудники клиники</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>staff</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>Реестр врачей-хирургов, консультантов и операционных сестер (5 специалистов, 3 схемы выплат)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Каталог сервисов</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>operations</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>Номенклатура 321 операции и 382 позиций прейскуранта с нормативной спецификацией</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Склад материалов</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>materials_catalog</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>427 расходных материалов и медикаментов, учетная стоимость единицы и упаковки</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Спецификация BOM</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>operation_materials</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>862 технологические нормы списания расходников (Bill of Materials) для 321 вмешательства</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Шаблоны приемов</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>ortho_templates</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>180 клинических ортопедических протоколов в 11 кластерах патологий опорно-двигательного аппарата</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Реестр тестов</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>ortho_test_catalog</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>1 377 клинических тестов с биомеханикой SFTR, Se/Sp доказательностью и анатомическими ориентирами</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Методы диагностики</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>diagnostic_methods_catalog</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>381 метод лучевой, ультразвуковой, лабораторной и функциональной диагностики</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Восстановительное лечение</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>ortho_*_catalog</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>102 протокола реабилитации: 26 манипуляций, 21 физиотерапия, 26 ортезирование, 29 ЛФК</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Начисления выплат</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>staff_payout_accruals</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>Строки сдельного вознаграждения врачам с историей и аудитом сторно (4 118 операций)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Ведомости периодов</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>staff_payout_sheets</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>Сводные расчетные листы за месяц (черновик, утверждена, выплачена)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>ККТ «АТОЛ 91Ф» (Профили)</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>fiscal_profiles</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>Параметры связи (COM3, 115200), Mock-режим, реквизиты клиники, СНО, ставка НДС, кассир</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8.5pt', py: 0.6 }}>Фискальные чеки (54-ФЗ)</TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}><code>fiscal_receipts</code></TableCell>
                <TableCell sx={{ fontSize: '8.5pt', py: 0.6 }}>Реестр чеков: приход/возврат, суммы, ФД №, ФПД, ФН, тег 1008, статус фискализации и печати</TableCell>
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
              <code>Маржинальная база = max(0, Стоимость сервиса − Себестоимость расходников)</code>
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

        {/* SECTION 3: БИЗНЕС-ПРОЦЕСС (FLOW) И КОМБИНАЦИИ ВИЗИТОВ */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', borderBottom: '1.5px solid #CBD5E1', pb: 0.5, mb: 1, fontSize: '11pt' }}>
            3. Регламентный поток бизнес-процесса (Flow) и комбинации визитов
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '9.5pt', color: '#2D3748', mb: 1 }}>
            Система поддерживает все варианты оказания услуг и назначений персонала клиники:
          </Typography>
          <Box component="ul" sx={{ pl: 2.5, m: 0, fontSize: '8.5pt', color: '#2D3748', mb: 1.5, '& li': { mb: 0.4 } }}>
            <li><strong>FL-V01 (Single / Solo Doctor):</strong> 1 консультация (5 000 ₽), назначен только врач. Сестре строго 0 ₽, врачу 30% (1 500 ₽). Коммит: 1 процедура, 1 начисление.</li>
            <li><strong>FL-V02 (Single / Brigade):</strong> 1 операция (PRP 18 000 ₽, расходники 3 500 ₽), бригада (хирург 35% + сестра 10%). Маржа 14 500 ₽. Коммит: 1 процедура, 2 начисления.</li>
            <li><strong>FL-V03 (Multi / Solo Doctor):</strong> Пакет из 2+ услуг визита (Консультация 5k + Блокада 8k), соло-врач. Сестре 0 ₽ по обеим. Коммит: 2 процедуры, 2 начисления врачу.</li>
            <li><strong>FL-V04 (Multi / Brigade):</strong> Пакет операций (Артроскопия 35k + PRP 18k = 53k), бригада. Раздельный учет маржи. Коммит: 2 процедуры, 4 начисления.</li>
            <li><strong>FL-V05 (Appointment Flow):</strong> Прием из расписания (<code>status = 'completed'</code>), прямая привязка к <code>appointment_id</code>.</li>
            <li><strong>Блокировки и гарантии:</strong> Мягкая блокировка (Soft Lock, 30 мин), защита от дублей (уникальный <code>dedup_hash</code>), ручные надбавки (+500 ₽) и сторно (-1 750 ₽).</li>
          </Box>
        </Box>

        {/* SECTION 4: ЕДИНЫЙ КАССОВЫЙ УЗЕЛ: ЭКВАЙРИНГ + ФИСКАЛИЗАЦИЯ */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', borderBottom: '1.5px solid #CBD5E1', pb: 0.5, mb: 1, fontSize: '11pt' }}>
            4. Единый кассовый узел клиники: Эквайринг «Альфа-Банк» (Arcus-2) + Фискализация «АТОЛ 91Ф» (54-ФЗ)
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '9pt', color: '#2D3748', mb: 1 }}>
            Кассовый узел клиники обеспечивает синхронную работу банковского терминала и онлайн-кассы по принципу полного паритета режимов и двухфазной финансовой транзакции:
          </Typography>
          <Box component="ul" sx={{ pl: 2.5, m: 0, fontSize: '8.5pt', color: '#2D3748', '& li': { mb: 0.5 } }}>
            <li><strong>4.1. Defining (Конфигурация и профили):</strong> Банковский POS-терминал (протокол Arcus-2/INPAS, COM4, 115200 бод, TID: ALFA_770192, MID: MERCH_884102, настраиваемый путь к <code>pos.exe</code> с онлайн-проверкой наличия на диске) и ККТ АТОЛ 91Ф (ДТО 10, COM3). Таблицы <code>pos_terminal_settings</code> и <code>fiscal_profiles</code>. Режимы работы: Физическое оборудование $\leftrightarrow$ Эмуляция (Mock Mode). Гарантия идемпотентности через <code>transaction_uuid</code>, RRN и код авторизации.</li>
            <li><strong>4.2. Using (Регламент кассира и двухфазная оплата):</strong> В мастере <code>/checkout</code> выполняется двухфазная транзакция (Two-Phase Commit). <em>Фаза 1:</em> авторизация на POS-терминале (Команда 00) по карте или СБП (QR), печать 2 слипов (клиенту и кассе). <em>Фаза 2:</em> автоматическая фискализация чека на ККТ АТОЛ 91Ф (Тег 1081 — безналичные, Тег 1008 — телефон/email ОФД, регистрация ФД и ФПД в ФН). Отмена внутри смены (Reversal / Void) без комиссии банка. Вечерняя сверка итогов эквайринга (Команда 26) и закрытие смены ККТ (Z-отчет до 24 ч, калькулятор наличности, акт А4).</li>
            <li><strong>4.3. Testing (Диагностика и тестирование):</strong> Сервисная панель <code>PosDeviceCard</code> с запуском Команды 05 (Host Ping — 5 уровней: шлюз API, файл <code>pos.exe</code>, порт COM4, пинг хоста Альфа-Банка, криптографические ключи; прямой переход в параметры эквайринга при ошибке). Мастер тестирования <code>/admin/pos-test-wizard</code> (тестовые транзакции 1.00 ₽, сценарная симуляция отказов 51/68/99 в Mock, печать банковского слипа по стандарту <code>react-to-print</code>).</li>
          </Box>
        </Box>

        {/* SECTION 5: СЛУЖБЫ БЭКЕНДА И ТЕСТОВЫЙ КОНТУР */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', borderBottom: '1.5px solid #CBD5E1', pb: 0.5, mb: 1, fontSize: '11pt' }}>
            5. Мониторинг служб бэкенда и тестовый контур [TEST_DAEMON]
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '9pt', color: '#2D3748', mb: 1 }}>
            В версию 2.0.1 включены административные инструменты мониторинга инфраструктуры и валидации:
          </Typography>
          <Box component="ul" sx={{ pl: 2.5, m: 0, fontSize: '8.5pt', color: '#2D3748', '& li': { mb: 0.4 } }}>
            <li><strong>Службы бэкенда (`/admin/server-health`):</strong> Сквозной мониторинг 6 компонентов (Express порт 5000, SQLite integrity ok, Fiscal Daemon 5050, Firebird МИС 3050, Swagger /api-docs, Hot Backup). Запуск теста всех служб в 1 клик с терминальным логом.</li>
            <li><strong>Демо-данные [TEST_DAEMON] (`/admin/daemon-data`):</strong> 45 автоматизированных тестов потока (FL-V01 — FL-V05 и FL-01 — FL-14), безопасный сидинг изолированных данных и мгновенная каскадная очистка (Purge).</li>
            <li><strong>Полнотекстовый поиск:</strong> Мгновенный поиск по всем разделам и сущностям с авто-раскрытием аккордеонов и мульти-токенным фильтром.</li>
          </Box>
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
                Добрушкин А.М. / «___» ________ 2026 г.
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

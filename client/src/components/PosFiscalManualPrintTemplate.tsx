import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

interface PosFiscalManualPrintProps {
  version?: string;
  date?: string;
}

export const PosFiscalManualPrintTemplate = React.forwardRef<HTMLDivElement, PosFiscalManualPrintProps>(
  ({ version = '2.1', date = new Date().toLocaleDateString('ru-RU') }, ref) => {
    return (
      <Box 
        ref={ref} 
        sx={{ 
          p: 3.5, 
          width: '100%', 
          bgcolor: '#FFFFFF', 
          color: '#1A202C',
          fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
          fontSize: '10pt',
          lineHeight: 1.45
        }}
      >
        {/* HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #0F3C64', pb: 1.5, mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img 
              src="/MainLogoTransparent.png" 
              alt="Центр Ортопедии и Травматологии" 
              style={{ width: 68, height: 68, objectFit: 'contain' }} 
            />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.15, fontSize: '14pt' }}>
                Центр Ортопедии и Травматологии доктора Добрушкина
              </Typography>
              <Typography variant="body2" sx={{ color: '#4A5568', fontSize: '8.5pt', mt: 0.3 }}>
                г. Сочи, ул. Транспортная 65, 3 этаж • Тел: +7 (862) 267-00-00 • ИНН: 450107060083 • ОГРНИП: 323237500208220
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F3C64', display: 'block', fontSize: '8.5pt', textTransform: 'uppercase' }}>
              РЕГЛАМЕНТ КАССОВОГО УЗЛА
            </Typography>
            <Typography variant="caption" sx={{ color: '#718096', fontSize: '8pt' }}>
              Ред. v{version} • {date}
            </Typography>
          </Box>
        </Box>

        {/* TITLE */}
        <Box sx={{ mb: 2.5, textAlign: 'center', bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '12.5pt' }}>
            Технологическая инструкция кассира: Эквайринг и Фискализация
          </Typography>
          <Typography variant="subtitle2" sx={{ color: '#4A5568', mt: 0.3, fontSize: '9pt', fontWeight: 500 }}>
            Порядок работы с POS-терминалами АО «АЛЬФА-БАНК» (Arcus-2 / INPAS DualConnector 2.x) и ККТ «АТОЛ 91Ф» (ФФД 1.2, 54-ФЗ) в МИС «ОртоERP»
          </Typography>
        </Box>

        {/* SECTION 1: ОПРЕДЕЛЕНИЕ И НАСТРОЙКИ (DEFINING) */}
        <Box sx={{ mb: 2.5, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', borderBottom: '1.5px solid #CBD5E1', pb: 0.4, mb: 1, fontSize: '10.5pt' }}>
            1. Определение и архитектура кассового узла (Defining)
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '9pt', color: '#2D3748', mb: 1 }}>
            Кассовый узел клиники функционирует по принципу двухконтурной обработки платежа с аппаратным разделением эквайринга и фискализации:
          </Typography>
          
          <Table size="small" sx={{ mb: 1.5, border: '1px solid #E2E8F0' }}>
            <TableHead sx={{ bgcolor: '#F1F5F9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '8pt', py: 0.5 }}>Компонент</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '8pt', py: 0.5 }}>Оборудование и Протокол</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '8pt', py: 0.5 }}>Параметры связи и порты</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '8pt', py: 0.5 }}>Назначение и стандарты</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8pt', py: 0.5 }}>Банковский терминал</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.5 }}>Ingenico / Verifone / PAX (Arcus-2 <code>pos.exe</code> или INPAS DualConnector 2.x)</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.5 }}>COM4 (USB-VCP 115200) или TCP 127.0.0.1:8888 (служба DualConnector), таймаут 60 с</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.5 }}>Очный прием карт МИР/Visa/MC, СБП QR, авторизация в Альфа-Банке</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8pt', py: 0.5 }}>Фискальный регистратор</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.5 }}>АТОЛ 91Ф (ДТО 10 / <code>fptr10.dll</code>)</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.5 }}>COM3 (USB-VCP), 115200 бод</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.5 }}>54-ФЗ, ФФД 1.2, регистрация ФД в ФН, печать QR-чека, отправка в ОФД</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8pt', py: 0.5 }}>Шлюз МИС Сервер</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.5 }}>Node.js Express + SQLite</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.5 }}>Порт 5000 (API) / 5050 (Fiscal Daemon)</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.5 }}>Идемпотентная двухфазная фиксация (<code>transaction_uuid</code>)</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Box sx={{ bgcolor: '#F8FAFC', p: 1, borderRadius: 1, border: '1px dashed #CBD5E1', fontSize: '8.5pt', color: '#334155' }}>
            <strong>Административные ссылки в МИС:</strong> Настройки POS: <code>/admin/pos-settings</code> • Фискальные профили: <code>/admin/fiscal-profiles</code> • Мониторинг служб: <code>/admin/server-health</code>.
          </Box>
        </Box>

        {/* SECTION 2: ОБЯЗАТЕЛЬНЫЕ ТЕСТОВЫЕ ОПЕРАЦИИ ПЕРЕД НАЧАЛОМ РАБОТЫ (BEFORE START) */}
        <Box sx={{ mb: 2.5, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#B45309', borderBottom: '1.5px solid #FDE68A', pb: 0.4, mb: 1, fontSize: '10.5pt' }}>
            2. Обязательные тестовые операции перед началом рабочего дня (Before Start Checklist)
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '8.5pt', color: '#92400E', fontWeight: 600, mb: 1 }}>
            ВНИМАНИЕ! Администратор-кассир обязан выполнить данный регламент ежедневно строго до 08:45 утра перед приемом первого пациента:
          </Typography>

          <Box component="ol" sx={{ pl: 2.5, m: 0, fontSize: '8.5pt', color: '#1F2937', '& li': { mb: 0.6 } }}>
            <li>
              <strong>Шаг 1. Включение и внешний осмотр:</strong> Включить ККТ АТОЛ 91Ф (дождаться одиночного звукового сигнала готовности) и POS-терминал Ingenico/Verifone/PAX. Убедиться в отсутствии повреждений кабелей.
            </li>
            <li>
              <strong>Шаг 2. Контроль чековой ленты:</strong> Проверить наличие рулона термобумаги 57 мм в ККТ и терминале. При диаметре рулона менее 2 см установить новый рулон (термослоем наружу).
            </li>
            <li>
              <strong>Шаг 3. Тест связи с процессингом Альфа-Банка (Команда 05/09):</strong> Открыть сервисную панель <code>PosDeviceCard</code> в правом верхнем углу МИС и запустить <em>«Тест связи с процессингом»</em>. Убедиться в успешном прохождении всех фаз диагностики:
              <Box component="div" sx={{ pl: 1.5, my: 0.3, fontSize: '8pt', color: '#4B5563' }}>
                • 1. Шлюз МИС (OK) • 2. Драйвер / Служба Windows <code>DualConnectorService</code> (OK) • 3. Порт связи (OK) • 4. Пинг хоста Альфа-Банка (Код 00, RTT &lt; 500ms) • 5. Ключи криптографии (OK).
              </Box>
              <em>При использовании INPAS:</em> в <code>/admin/pos-settings</code> на вкладке 2 доступен перезапуск службы Windows и запуск утилиты <code>DCControl.exe</code>.
            </li>
            <li>
              <strong>Шаг 4. Контроль фискальной смены (&lt; 24 часов):</strong> Проверить статус смены в <code>/admin/fiscal-shifts</code>. Если смена была открыта накануне и длится &gt; 22 часов, выполнить закрытие смены (Z-отчет) во избежание блокировки ККТ налогами.
            </li>
            <li>
              <strong>Шаг 5. Контрольный X-отчет (без гашения):</strong> Нажать <em>«Снять X-отчет»</em> на кассе: проверить четкость печати шапки чека, реквизитов клиники (ИНН 450107060083) и нулевые утренние итоги.
            </li>
          </Box>
        </Box>

        {/* SECTION 3: ЭКСПЛУАТАЦИЯ И ПРОВЕДЕНИЕ ОПЕРАЦИЙ (USING) */}
        <Box sx={{ mb: 2.5, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', borderBottom: '1.5px solid #CBD5E1', pb: 0.4, mb: 1, fontSize: '10.5pt' }}>
            3. Регламент проведения кассовых операций (Using)
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 1.5 }}>
            <Box sx={{ p: 1.2, border: '1px solid #E2E8F0', borderRadius: 1, bgcolor: '#F8FAFC' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '8.5pt', mb: 0.5 }}>
                ДВУХФАЗНАЯ ОПЛАТА КАРТОЙ / СБП (ЧЕК-АУТ)
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '8pt', color: '#334155' }}>
                1. В мастере <code>/checkout</code> выбрать пациента и оказанные услуги.<br />
                2. Указать контакт пациента (Тег 1008: телефон/email).<br />
                3. Нажать <strong>«Оплатить через терминал»</strong> (Фаза 1: Команда 00).<br />
                4. Пациент прикладывает карту/QR. При одобрении (Код 00) терминал печатает 2 слипа.<br />
                5. <strong>Фаза 2 запускается автоматически:</strong> АТОЛ 91Ф пробивает чек прихода с QR-кодом (Тег 1081 — безналичные).
              </Typography>
            </Box>

            <Box sx={{ p: 1.2, border: '1px solid #E2E8F0', borderRadius: 1, bgcolor: '#F8FAFC' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '8.5pt', mb: 0.5 }}>
                ОТМЕНА (VOID) И ВОЗВРАТ (REFUND)
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '8pt', color: '#334155' }}>
                • <strong>Отмена внутри смены (Void):</strong> До вечерней сверки итогов. Деньги мгновенно возвращаются на карту пациента без комиссии эквайринга. ККТ регистрирует чек отмены.<br />
                • <strong>Возврат после закрытия смены (Refund):</strong> Выполняется по RRN первичной транзакции с приложением карты пациента. На ККТ пробивается чек <em>«Возврат прихода» (sell_return)</em>.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ p: 1.2, border: '1px solid #CBD5E1', borderRadius: 1, bgcolor: '#EFF6FF' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E40AF', fontSize: '8.5pt', mb: 0.4 }}>
              ВЕЧЕРНЕЕ ЗАКРЫТИЕ КАССОВОГО ДНЯ (СТРОГИЙ ПОРЯДОК ДЕЙСТВИЙ):
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '8pt', color: '#1E3A8A' }}>
              <strong>1. Сверка итогов эквайринга (Команда 26):</strong> в карточке терминала запустить <em>«Сверка итогов»</em>. Распечатывается банковский Z-отчет с общей суммой безнала. Сверить сумму со строкой «Безналичные» в МИС.<br />
              <strong>2. Закрытие фискальной смены (Команда 04 / Z-отчет):</strong> в <code>/admin/fiscal-shifts</code> нажать <em>«Закрыть фискальную смену»</em>. ККТ печатает Z-отчет с гашением.<br />
              <strong>3. Калькулятор наличности и Акт А4:</strong> пересчитать наличность в кассе, внести купюры в форму и распечатать официальный <em>«Акт закрытия кассовой смены»</em>.
            </Typography>
          </Box>
        </Box>

        {/* SECTION 4: ДИАГНОСТИКА И НЕШТАТНЫЕ СИТУАЦИИ (TESTING) */}
        <Box sx={{ mb: 2.5, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', borderBottom: '1.5px solid #CBD5E1', pb: 0.4, mb: 1, fontSize: '10.5pt' }}>
            4. Диагностика, тестирование и устранение сбоев (Testing & Troubleshooting)
          </Typography>

          <Table size="small" sx={{ mb: 1.5, border: '1px solid #E2E8F0' }}>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '8pt', py: 0.5 }}>Сбой / Код ошибки</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '8pt', py: 0.5 }}>Причина сбоя</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '8pt', py: 0.5 }}>Оперативный регламент устранения</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8pt', py: 0.4, color: '#DC2626' }}>Файл не найден pos.exe</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.4 }}>Неверный путь в настройках</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.4 }}>В окне ошибки нажать «Изменить путь к файлу драйвера» -&gt; вкладка «Оборудование» -&gt; пресет C:\Arcus2\pos.exe -&gt; «Проверить файл».</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8pt', py: 0.4, color: '#DC2626' }}>Код 68 / Таймаут</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.4 }}>Карта не приложена или завис пин-пад</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.4 }}>Перезагрузить терминал: удерживать 3 сек [Желтая клавиша Clear] + [Точка .]. Дождаться перезагрузки и повторить.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8pt', py: 0.4, color: '#D97706' }}>Код 51 / Отказ карты</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.4 }}>Недостаточно средств у клиента</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.4 }}>Предложить оплатить другой картой, через QR СБП или наличными денежными средствами.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8pt', py: 0.4, color: '#DC2626' }}>Смена &gt; 24 часов</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.4 }}>ККТ заблокирована по 54-ФЗ</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.4 }}>Перейти в /admin/fiscal-shifts, нажать «Закрыть фискальную смену». После печати Z-отчета пробить чек снова.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '8pt', py: 0.4, color: '#DC2626' }}>Рассинхронизация POS/ККТ</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.4 }}>Деньги списаны, в ККТ кончилась бумага</TableCell>
                <TableCell sx={{ fontSize: '8pt', py: 0.4 }}>Карту повторно НЕ прикладывать! Заправить ленту и нажать «Допечатать фискальный чек» в журнале транзакций.</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Typography variant="body2" sx={{ fontSize: '8pt', color: '#4A5568' }}>
            <strong>Инструменты лабораторных испытаний:</strong> <code>/admin/pos-test-wizard</code> (тестовая оплата 1.00 ₽, эмуляция отказов 51/68/99 в Mock-режиме, тестовые слипы) и <code>/admin/fiscal-test-wizard</code> (проверка связи ДТО 10, X-отчет, статус ОФД).
          </Typography>
        </Box>

        {/* SIGNATURES BLOCK (CRITICAL: UNIFIED UNBREAKABLE CONTAINER) */}
        <Box 
          sx={{ 
            mt: 3, 
            pt: 2, 
            borderTop: '2px solid #0F3C64',
            pageBreakInside: 'avoid',
            breakInside: 'avoid'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5, fontSize: '9pt', textTransform: 'uppercase' }}>
            Лист согласования и ввода технологической инструкции в действие
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2.5 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#4A5568', display: 'block', fontSize: '8pt' }}>
                Главный врач клиники:
              </Typography>
              <Box sx={{ borderBottom: '1px solid #718096', height: 24, mb: 0.3 }} />
              <Typography variant="caption" sx={{ color: '#718096', fontSize: '7.5pt' }}>
                Добрушкин А.М. / «___» ________ 2026 г.
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#4A5568', display: 'block', fontSize: '8pt' }}>
                Главный бухгалтер:
              </Typography>
              <Box sx={{ borderBottom: '1px solid #718096', height: 24, mb: 0.3 }} />
              <Typography variant="caption" sx={{ color: '#718096', fontSize: '7.5pt' }}>
                (Подпись) / «___» ________ 2026 г.
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#4A5568', display: 'block', fontSize: '8pt' }}>
                Старший администратор кассы:
              </Typography>
              <Box sx={{ borderBottom: '1px solid #718096', height: 24, mb: 0.3 }} />
              <Typography variant="caption" sx={{ color: '#718096', fontSize: '7.5pt' }}>
                (Подпись) / «___» ________ 2026 г.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#A0AEC0', fontSize: '7pt' }}>
              Официальный документ МИС «ОртоERP» v1.4.2 • Экземпляр кассира • Центр Ортопедии и Травматологии доктора Добрушкина
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }
);

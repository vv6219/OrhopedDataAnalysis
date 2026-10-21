/**
 * MedFlex Root Cause Analysis (RCA) & Problem Classification Engine.
 * Classifies sync failures into actionable categories with human-readable explanations,
 * timeline root-cause analysis, and recommended 1-click remediation actions.
 */

const crypto = require('crypto');
function uuidv4() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}
const db = require('../database');
const { logMedflexAudit, LogLevels, MedflexEventTypes } = require('../medflexAuditLogger');

const ProblemCodes = {
  COLLISION_DOUBLE_BOOKING: 'ERR_COLLISION_DOUBLE_BOOKING',
  DOCTOR_UNMAPPED: 'ERR_DOCTOR_UNMAPPED',
  HTTP_AUTH_INVALID: 'ERR_HTTP_AUTH_INVALID',
  PATIENT_MATCH_AMBIGUITY: 'ERR_PATIENT_MATCH_AMBIGUITY',
  NETWORK_TIMEOUT: 'ERR_NETWORK_TIMEOUT',
  INBOUND_PING_MISSED: 'ERR_INBOUND_PING_MISSED',
  PAYLOAD_VALIDATION: 'ERR_PAYLOAD_VALIDATION',
  ORPHAN_CANCELLATION: 'ERR_ORPHAN_CANCELLATION',
  SLOT_DESYNCHRONIZATION: 'ERR_SLOT_DESYNCHRONIZATION',
  QUEUE_MAX_ATTEMPTS: 'ERR_QUEUE_MAX_ATTEMPTS'
};

const ProblemDefinitions = {
  [ProblemCodes.COLLISION_DOUBLE_BOOKING]: {
    severity: 'critical',
    title: 'Попытка двойной записи (Коллизия слота)',
    explanation: 'Пациент с портала «ПроДокторов» попытался забронировать интервал, который уже был занят администратором клиники.',
    rootCause: 'Запись в клинике была оформлена администратором по телефону непосредственно перед поступлением внешнего вебхука до того, как завершилась сетевая блокировка слота в агрегаторе.',
    remediation: '1. Связаться с пациентом по телефону. 2. Перенести приём на соседний свободный интервал. 3. Подтвердить изменение в календаре.',
    actionType: 'resolve_conflict'
  },
  [ProblemCodes.DOCTOR_UNMAPPED]: {
    severity: 'critical',
    title: 'Врач MedFlex не привязан к сотруднику МИС',
    explanation: 'Поступила онлайн-запись к доктору, чей внешний ID в MedFlex не сопоставлен ни с одним врачом в штатном расписании МИС.',
    rootCause: 'В личном кабинете MedFlex зарегистрирован доктор или изменён идентификатор врача, однако в настройках МИС не указан его medflex_doctor_id.',
    remediation: 'Перейдите в раздел сопоставления врачей и привяжите доктора клиники к его внешнему идентификатору MedFlex.',
    actionType: 'remap_doctor'
  },
  [ProblemCodes.HTTP_AUTH_INVALID]: {
    severity: 'critical',
    title: 'Ошибка авторизации API токена (401/403)',
    explanation: 'Сервер MedFlex отклонил токен клиники. Обмен данными и онлайн-запись полностью приостановлены.',
    rootCause: 'Истёк срок действия Clinic Token или токен был перевыпущен в личном кабинете партнёра MedFlex.',
    remediation: 'Скопируйте актуальный Clinic Token из личного кабинета MedFlex и обновите его в настройках параметров клиники.',
    actionType: 'update_token'
  },
  [ProblemCodes.PATIENT_MATCH_AMBIGUITY]: {
    severity: 'high',
    title: 'Неоднозначность идентификации пациента',
    explanation: 'По указанному номеру телефона найдено несколько карточек пациентов с несовпадающими ФИО или датами рождения.',
    rootCause: 'Один номер телефона используется несколькими членами семьи (например, родителем и ребёнком), либо допущена опечатка в профиле.',
    remediation: 'Проверьте найденные профили пациентов, выберите нужную медицинскую карту или создайте новую для данного пациента.',
    actionType: 'manual_match'
  },
  [ProblemCodes.NETWORK_TIMEOUT]: {
    severity: 'high',
    title: 'Сетевой таймаут к серверам MedFlex (> 3000 мс)',
    explanation: 'Сервер MedFlex не ответил в течение установленного таймаута при попытке занять или освободить интервал.',
    rootCause: 'Временные задержки у интернет-провайдера, перегрузка внешнего API или кратковременные технические работы на стороне облака MedFlex.',
    remediation: 'Операция автоматически сохранена в оффлайн-очередь повторов и будет отправлена сразу после стабилизации канала.',
    actionType: 'retry'
  },
  [ProblemCodes.INBOUND_PING_MISSED]: {
    severity: 'high',
    title: 'Пропущен 15-минутный контрольный Healthcheck',
    explanation: 'Более 20 минут от MedFlex не поступало регулярных контрольных пингов доступности сервера МИС.',
    rootCause: 'Возможная смена внешнего IP клиники, блокировка порта внешним файрволом провайдера или некорректная маршрутизация URL вебхука.',
    remediation: 'Проверьте доступность внешнего HTTPS-шлюза клиники и корректность URL вебхука в личном кабинете MedFlex.',
    actionType: 'check_gateway'
  },
  [ProblemCodes.PAYLOAD_VALIDATION]: {
    severity: 'medium',
    title: 'Некорректный формат данных в вебхуке',
    explanation: 'Получен вебхук онлайн-записи с отсутствующими обязательными полями (не указан телефон, некорректная дата или отрицательная цена).',
    rootCause: 'Нестандартный запрос от внешнего агрегатора либо несоответствие версий схем API.',
    remediation: 'Изучите сырой JSON-запрос инцидента. При повторении обратитесь в службу технической поддержки MedFlex.',
    actionType: 'inspect_payload'
  },
  [ProblemCodes.ORPHAN_CANCELLATION]: {
    severity: 'low',
    title: 'Запрос на отмену несуществующей брони',
    explanation: 'Получен запрос на отмену онлайн-записи по UUID, который не найден в базе данных МИС.',
    rootCause: 'Запись была ранее удалена администратором клиники вручную, либо бронь относится к другому филиалу.',
    remediation: 'Отметьте инцидент как разрешённый, дополнительных действий в календаре не требуется.',
    actionType: 'ignore'
  },
  [ProblemCodes.SLOT_DESYNCHRONIZATION]: {
    severity: 'high',
    title: 'Рассинхронизация сетки расписания',
    explanation: 'Занятость слотов в базе МИС отличается от отображаемой на портале «ПроДокторов».',
    rootCause: 'Сбой интернет-связи в момент локального переноса приёма в регистратуре, когда запрос не смог дойти до MedFlex.',
    remediation: 'Нажмите кнопку «Полная выгрузка расписания» в панели MedFlex для синхронизации сетки на 30 дней вперёд.',
    actionType: 'full_schedule_sync'
  },
  [ProblemCodes.QUEUE_MAX_ATTEMPTS]: {
    severity: 'critical',
    title: 'Превышен лимит попыток отправки в очереди',
    explanation: 'Операция не смогла отправиться в MedFlex после 10 автоматических повторных попыток.',
    rootCause: 'Длительное отсутствие сетевого соединения либо постоянный отказ API MedFlex на данный конкретный запрос.',
    remediation: 'Проверьте интернет-соединение и нажмите кнопку «Повторить отправку задачи» вручную.',
    actionType: 'retry'
  }
};

class MedflexDiagnosticEngine {
  /**
   * Create and register a structured sync incident with RCA analysis
   */
  async registerIncident({
    problemCode,
    claimId = null,
    appointmentId = null,
    doctorId = null,
    patientPhone = null,
    patientName = null,
    technicalContext = {},
    customDetails = null
  }) {
    const def = ProblemDefinitions[problemCode] || {
      severity: 'high',
      title: 'Неизвестный инцидент синхронизации',
      explanation: 'Произошла непредвиденная ошибка при синхронизации данных с MedFlex.',
      rootCause: 'Требуется детальный анализ журналов аудита Serilog.',
      remediation: 'Проверьте лог аудита и технический контекст инцидента.',
      actionType: 'manual'
    };

    const incidentUuid = uuidv4();
    const technicalJson = JSON.stringify({
      ...technicalContext,
      capturedAt: new Date().toISOString(),
      problemCode
    });

    const explanation = customDetails ? `${def.explanation} (${customDetails})` : def.explanation;

    return new Promise((resolve, reject) => {
      const insertSql = `
        INSERT INTO medflex_sync_incidents (
          incident_uuid, problem_code, severity, title, explanation_human,
          root_cause_analysis, remediation_steps, action_type, claim_id,
          appointment_id, doctor_id, patient_phone, patient_name,
          technical_context_json, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
      `;

      db.run(
        insertSql,
        [
          incidentUuid,
          problemCode,
          def.severity,
          def.title,
          explanation,
          def.rootCause,
          def.remediation,
          def.actionType,
          claimId,
          appointmentId,
          doctorId,
          patientPhone,
          patientName,
          technicalJson
        ],
        function (err) {
          if (err) {
            console.error('[MedflexDiagnosticEngine] Failed to save incident:', err.message);
            return reject(err);
          }

          const incidentId = this.lastID;

          // Emit Serilog Audit log
          logMedflexAudit({
            level: def.severity === 'critical' ? LogLevels.ERROR : LogLevels.WARN,
            message: `[RCA Incident #${incidentId}] ${def.title}: ${explanation}`,
            eventType: MedflexEventTypes.RCA_INCIDENT_CREATED,
            direction: 'Internal',
            claimId,
            appointmentId,
            doctorId,
            properties: {
              IncidentId: incidentId,
              IncidentUuid: incidentUuid,
              ProblemCode: problemCode,
              Severity: def.severity,
              ActionType: def.actionType,
              PatientPhone: patientPhone
            }
          });

          resolve({
            id: incidentId,
            incidentUuid,
            problemCode,
            severity: def.severity,
            title: def.title,
            explanation,
            rootCause: def.rootCause,
            remediation: def.remediation,
            actionType: def.actionType
          });
        }
      );
    });
  }

  getProblemDefinitions() {
    return ProblemDefinitions;
  }
}

module.exports = {
  ProblemCodes,
  ProblemDefinitions,
  diagnosticEngine: new MedflexDiagnosticEngine()
};

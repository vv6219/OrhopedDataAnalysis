/**
 * MedFlex Outbound HTTP Client with Sandbox Directional Routing and Serilog Telemetry.
 * Uses native Node.js fetch with AbortSignal.timeout.
 * Supported modes:
 *  - Sandbox 'dual': Outbound requests routed to internal MedflexMockServer.
 *  - Sandbox 'request_only': Outbound requests routed to internal MedflexMockServer.
 *  - Sandbox 'response_only': Outbound requests sent to REAL MedFlex servers.
 *  - Production: Outbound requests sent to REAL MedFlex servers.
 */

const db = require('../database');
const mockServer = require('./medflexMockServer');
const { circuitBreaker } = require('./medflexCircuitBreaker');
const { logMedflexAudit, LogLevels, MedflexEventTypes } = require('../medflexAuditLogger');

class MedflexClient {
  constructor() {
    this.defaultTimeoutMs = 5000;
  }

  /**
   * Helper to fetch current MedFlex configuration from calculation_parameters
   */
  async getConfig() {
    return new Promise((resolve) => {
      db.all(
        "SELECT param_name, param_value FROM calculation_parameters WHERE param_name LIKE 'medflex_%'",
        [],
        (err, rows) => {
          const config = {
            enabled: true,
            mode: 'sandbox', // 'production', 'sandbox', 'disabled'
            sandbox_direction: 'dual', // 'dual', 'request_only', 'response_only'
            clinic_token: 'DEMO_MEDFLEX_TOKEN_770192',
            webhook_secret: 'DEMO_WEBHOOK_SECRET_8821',
            filial_id: 1,
            api_url: 'https://mis-api.medflex.ru',
            partner_api_url: 'https://api.medflex.ru',
            ping_interval_sec: 60,
            schedule_sync_interval_min: 30
          };

          if (rows) {
            rows.forEach((r) => {
              const key = r.param_name.replace('medflex_', '');
              if (key === 'enabled') config.enabled = r.param_value === 'true';
              else if (key === 'filial_id') config.filial_id = Number(r.param_value) || 1;
              else if (key === 'ping_interval_sec') config.ping_interval_sec = Number(r.param_value) || 60;
              else if (key === 'schedule_sync_interval_min') config.schedule_sync_interval_min = Number(r.param_value) || 30;
              else config[key] = r.param_value;
            });
          }
          resolve(config);
        }
      );
    });
  }

  /**
   * Determine if outbound request should be mocked
   */
  isOutboundMocked(config) {
    if (config.mode === 'sandbox') {
      // In sandbox: 'dual' and 'request_only' mock outbound calls
      return config.sandbox_direction === 'dual' || config.sandbox_direction === 'request_only';
    }
    return false;
  }

  /**
   * 1. Ping / Healthcheck probe to MedFlex
   */
  async ping() {
    const config = await this.getConfig();
    const startTime = Date.now();
    const isMock = this.isOutboundMocked(config);

    try {
      if (isMock) {
        const mockRes = await mockServer.mockGetDoctors({ limit: 1 });
        const latency = Date.now() - startTime;
        circuitBreaker.recordSuccess(latency);

        logMedflexAudit({
          level: LogLevels.INFO,
          message: `MedFlex Sandbox Heartbeat Ping OK. RTT: ${latency}ms`,
          eventType: MedflexEventTypes.HEARTBEAT_OK,
          direction: 'Outbound',
          httpStatus: 200,
          durationMs: latency,
          endpoint: '/models/doctor/?limit=1',
          isSimulation: 1,
          sandboxDirection: config.sandbox_direction
        });

        return { success: true, latencyMs: latency, isMock: true, state: circuitBreaker.getState() };
      }

      // Real HTTP call to api.medflex.ru using native fetch
      const url = `${config.partner_api_url}/models/doctor/?limit=1`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Token ${config.clinic_token}`,
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs)
      });

      const latency = Date.now() - startTime;
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      circuitBreaker.recordSuccess(latency);

      logMedflexAudit({
        level: LogLevels.INFO,
        message: `MedFlex Live Heartbeat Ping OK. RTT: ${latency}ms`,
        eventType: MedflexEventTypes.HEARTBEAT_OK,
        direction: 'Outbound',
        httpStatus: response.status,
        durationMs: latency,
        endpoint: url,
        isSimulation: 0,
        sandboxDirection: 'none'
      });

      return { success: true, latencyMs: latency, isMock: false, state: circuitBreaker.getState() };
    } catch (err) {
      const latency = Date.now() - startTime;
      circuitBreaker.recordFailure(err, latency);

      logMedflexAudit({
        level: LogLevels.WARN,
        message: `MedFlex Heartbeat Ping failed: ${err.message}`,
        eventType: MedflexEventTypes.HEARTBEAT_FAIL,
        direction: 'Outbound',
        httpStatus: err.status || 0,
        durationMs: latency,
        endpoint: '/models/doctor/?limit=1',
        isSimulation: isMock ? 1 : 0,
        sandboxDirection: config.sandbox_direction,
        exception: err
      });

      return { success: false, latencyMs: latency, isMock, error: err.message, state: circuitBreaker.getState() };
    }
  }

  /**
   * 2. GET /models/doctor/ (get_doctors)
   */
  async getDoctors(params = {}) {
    const config = await this.getConfig();
    const startTime = Date.now();
    const isMock = this.isOutboundMocked(config);

    if (isMock) {
      const res = await mockServer.mockGetDoctors(params);
      circuitBreaker.recordSuccess(res.latencyMs);
      return res.data;
    }

    try {
      const queryStr = new URLSearchParams(params).toString();
      const url = `${config.partner_api_url}/models/doctor/${queryStr ? '?' + queryStr : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Token ${config.clinic_token}`,
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs)
      });

      const latency = Date.now() - startTime;
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      circuitBreaker.recordSuccess(latency);
      return data;
    } catch (err) {
      const latency = Date.now() - startTime;
      circuitBreaker.recordFailure(err, latency);
      throw err;
    }
  }

  /**
   * 3. POST /v2/occupied_doctor_schedule_slot/
   */
  async pushOccupiedSlot({ filialId, doctorId, date, timeStart, timeEnd, isFree = false }) {
    const config = await this.getConfig();
    const startTime = Date.now();
    const isMock = this.isOutboundMocked(config);

    const payload = {
      filial_id: filialId || config.filial_id,
      doctor_id: doctorId,
      date,
      cells: [
        {
          time_start: timeStart,
          time_end: timeEnd,
          free: Boolean(isFree)
        }
      ]
    };

    if (isMock) {
      const res = await mockServer.mockOccupySlot(payload);
      circuitBreaker.recordSuccess(res.latencyMs);

      logMedflexAudit({
        level: LogLevels.INFO,
        message: `[Mock] Pushed slot ${date} ${timeStart}-${timeEnd} (free=${isFree}) for doctor ${doctorId}`,
        eventType: MedflexEventTypes.SLOT_PUSHED,
        direction: 'Outbound',
        doctorId,
        httpStatus: 200,
        durationMs: res.latencyMs,
        endpoint: '/v2/occupied_doctor_schedule_slot/',
        properties: { Payload: payload },
        isSimulation: 1,
        sandboxDirection: config.sandbox_direction
      });

      return res;
    }

    try {
      const url = `${config.api_url}/v2/occupied_doctor_schedule_slot/`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Token ${config.clinic_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.defaultTimeoutMs)
      });

      const latency = Date.now() - startTime;
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const resData = await response.json().catch(() => ({}));
      circuitBreaker.recordSuccess(latency);

      logMedflexAudit({
        level: LogLevels.INFO,
        message: `Pushed slot ${date} ${timeStart}-${timeEnd} (free=${isFree}) for doctor ${doctorId} to MedFlex`,
        eventType: MedflexEventTypes.SLOT_PUSHED,
        direction: 'Outbound',
        doctorId,
        httpStatus: response.status,
        durationMs: latency,
        endpoint: url,
        properties: { Payload: payload },
        isSimulation: 0
      });

      return { success: true, statusCode: response.status, data: resData, latencyMs: latency };
    } catch (err) {
      const latency = Date.now() - startTime;
      circuitBreaker.recordFailure(err, latency);
      throw err;
    }
  }

  /**
   * 4. POST /v2/doctors/send_schedule/
   */
  async sendSchedule(schedulePayload) {
    const config = await this.getConfig();
    const startTime = Date.now();
    const isMock = this.isOutboundMocked(config);

    if (isMock) {
      const res = await mockServer.mockSendSchedule(schedulePayload);
      circuitBreaker.recordSuccess(res.latencyMs);

      logMedflexAudit({
        level: LogLevels.INFO,
        message: `[Mock] Full doctor schedule successfully uploaded to Sandbox MedFlex`,
        eventType: MedflexEventTypes.SCHEDULE_SENT,
        direction: 'Outbound',
        httpStatus: 200,
        durationMs: res.latencyMs,
        endpoint: '/v2/doctors/send_schedule/',
        isSimulation: 1,
        sandboxDirection: config.sandbox_direction
      });

      return res;
    }

    try {
      const url = `${config.api_url}/v2/doctors/send_schedule/`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Token ${config.clinic_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(schedulePayload),
        signal: AbortSignal.timeout(15000)
      });

      const latency = Date.now() - startTime;
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const resData = await response.json().catch(() => ({}));
      circuitBreaker.recordSuccess(latency);

      logMedflexAudit({
        level: LogLevels.INFO,
        message: `Full doctor schedule successfully uploaded to MedFlex cloud`,
        eventType: MedflexEventTypes.SCHEDULE_SENT,
        direction: 'Outbound',
        httpStatus: response.status,
        durationMs: latency,
        endpoint: url,
        isSimulation: 0
      });

      return { success: true, statusCode: response.status, data: resData, latencyMs: latency };
    } catch (err) {
      const latency = Date.now() - startTime;
      circuitBreaker.recordFailure(err, latency);
      throw err;
    }
  }

  /**
   * 5. POST /direct_appointment/doctor/cancel/ (cancel_online_appointment)
   */
  async cancelOnlineAppointment(uuid) {
    const config = await this.getConfig();
    const startTime = Date.now();
    const isMock = this.isOutboundMocked(config);

    if (isMock) {
      const res = await mockServer.mockCancelAppointment(uuid);
      circuitBreaker.recordSuccess(res.latencyMs);

      logMedflexAudit({
        level: LogLevels.INFO,
        message: `[Mock] Cancelled online appointment claim ${uuid} on Sandbox MedFlex`,
        eventType: MedflexEventTypes.BOOKING_CANCELLED,
        direction: 'Outbound',
        claimId: uuid,
        httpStatus: 204,
        durationMs: res.latencyMs,
        endpoint: '/direct_appointment/doctor/cancel/',
        isSimulation: 1,
        sandboxDirection: config.sandbox_direction
      });

      return res;
    }

    try {
      const url = `${config.partner_api_url}/direct_appointment/doctor/cancel/`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Token ${config.clinic_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uuid }),
        signal: AbortSignal.timeout(this.defaultTimeoutMs)
      });

      const latency = Date.now() - startTime;
      circuitBreaker.recordSuccess(latency);

      logMedflexAudit({
        level: LogLevels.INFO,
        message: `Cancelled online appointment claim ${uuid} on MedFlex`,
        eventType: MedflexEventTypes.BOOKING_CANCELLED,
        direction: 'Outbound',
        claimId: uuid,
        httpStatus: response.status,
        durationMs: latency,
        endpoint: url,
        isSimulation: 0
      });

      return { success: true, statusCode: response.status, latencyMs: latency };
    } catch (err) {
      const latency = Date.now() - startTime;
      circuitBreaker.recordFailure(err, latency);
      throw err;
    }
  }

  /**
   * 6. GET /models/appointment/ (get_current_appointments)
   */
  async getCurrentAppointments(params = {}) {
    const config = await this.getConfig();
    const startTime = Date.now();
    const isMock = this.isOutboundMocked(config);

    if (isMock) {
      const res = await mockServer.mockGetCurrentAppointments(params);
      circuitBreaker.recordSuccess(res.latencyMs);

      logMedflexAudit({
        level: LogLevels.INFO,
        message: `[Mock] Current appointments successfully queried from MedFlex Sandbox (${res.data?.results?.length || 0} items)`,
        eventType: MedflexEventTypes.PULL_APPOINTMENTS_COMPLETED,
        direction: 'Outbound',
        httpStatus: 200,
        durationMs: res.latencyMs,
        endpoint: '/models/appointment/',
        isSimulation: 1,
        sandboxDirection: config.sandbox_direction
      });

      return res.data;
    }

    try {
      const queryStr = new URLSearchParams(params).toString();
      const url = `${config.partner_api_url}/models/appointment/${queryStr ? '?' + queryStr : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Token ${config.clinic_token}`,
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs)
      });

      const latency = Date.now() - startTime;
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      circuitBreaker.recordSuccess(latency);

      logMedflexAudit({
        level: LogLevels.INFO,
        message: `Current appointments successfully fetched from MedFlex Cloud (${data?.results?.length || 0} items)`,
        eventType: MedflexEventTypes.PULL_APPOINTMENTS_COMPLETED,
        direction: 'Outbound',
        httpStatus: response.status,
        durationMs: latency,
        endpoint: url,
        isSimulation: 0
      });

      return data;
    } catch (err) {
      const latency = Date.now() - startTime;
      circuitBreaker.recordFailure(err, latency);
      throw err;
    }
  }
}

module.exports = new MedflexClient();

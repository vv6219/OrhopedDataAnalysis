/**
 * Virtual MedFlex Cloud Mock Server (Sandbox Engine).
 * Simulates mis-api.medflex.ru and api.medflex.ru with realistic payloads,
 * realistic random RTT network latency (30ms - 90ms), and error injection.
 */

const crypto = require('crypto');
function uuidv4() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

class MedflexMockServer {
  constructor() {
    this.simulatedLatencyMinMs = 25;
    this.simulatedLatencyMaxMs = 75;
    this.forceConnectionFailure = false; // Toggle to test offline queue
  }

  /**
   * Helper to simulate network latency
   */
  async _delay() {
    const ms = Math.floor(
      Math.random() * (this.simulatedLatencyMaxMs - this.simulatedLatencyMinMs) + this.simulatedLatencyMinMs
    );
    await new Promise((resolve) => setTimeout(resolve, ms));
    return ms;
  }

  /**
   * Mock GET /models/doctor/ (get_doctors)
   */
  async mockGetDoctors(params = {}) {
    const latency = await this._delay();
    if (this.forceConnectionFailure) {
      const err = new Error('ECONNREFUSED: Simulated connection refusal to api.medflex.ru');
      err.code = 'ECONNREFUSED';
      err.latencyMs = latency;
      throw err;
    }

    return {
      success: true,
      statusCode: 200,
      latencyMs: latency,
      data: {
        count: 2,
        next: null,
        previous: null,
        results: [
          {
            id: 10452,
            efio: 'Добрушкин Владимир Леонидович',
            description: 'Врач травматолог-ортопед высшей категории',
            specialities: [
              { id: 14, name: 'Травматолог-ортопед' }
            ],
            lpus: [
              { id: 1, name: 'Центр Ортопедии Добрушкина, Сочи' }
            ],
            prices: [
              { id: 501, name: 'Первичный прием травматолога-ортопеда', price: 3500 }
            ]
          },
          {
            id: 10453,
            efio: 'Петров Алексей Сергеевич',
            description: 'Врач травматолог-ортопед, артроскопист',
            specialities: [
              { id: 14, name: 'Травматолог-ортопед' }
            ],
            lpus: [
              { id: 1, name: 'Центр Ортопедии Добрушкина, Сочи' }
            ],
            prices: [
              { id: 502, name: 'Прием травматолога-ортопеда', price: 3000 }
            ]
          }
        ]
      }
    };
  }

  /**
   * Mock GET /models/appointment/ (get_current_appointments)
   */
  async mockGetCurrentAppointments(params = {}) {
    const latency = await this._delay();
    if (this.forceConnectionFailure) {
      const err = new Error('ECONNREFUSED: Simulated connection refusal to api.medflex.ru');
      err.code = 'ECONNREFUSED';
      err.latencyMs = latency;
      throw err;
    }

    const targetDate = params.date || new Date().toISOString().slice(0, 10);
    return {
      success: true,
      statusCode: 200,
      latencyMs: latency,
      data: {
        count: 2,
        results: [
          {
            claim_id: `mf-cur-app-10452-${targetDate}`,
            doctor: { id: 10452, lpu_id: 1, specialty: 'Травматолог-ортопед' },
            appointment: {
              dt_start: `${targetDate}T16:00:00`,
              dt_end: `${targetDate}T16:30:00`,
              comment: 'Консультация ортопеда, боль в коленном суставе',
              price: 3500,
              is_online: false
            },
            client: {
              first_name: 'Анна',
              second_name: 'Сергеевна',
              last_name: 'Кузнецова',
              mobile_phone: '+79181234567',
              birthday: '1988-04-12'
            },
            appointment_source: 'ПроДокторов'
          },
          {
            claim_id: `mf-cur-app-10453-${targetDate}`,
            doctor: { id: 10453, lpu_id: 1, specialty: 'Травматолог-ортопед' },
            appointment: {
              dt_start: `${targetDate}T17:00:00`,
              dt_end: `${targetDate}T17:30:00`,
              comment: 'Первичный приём, направление на стельки',
              price: 3000,
              is_online: false
            },
            client: {
              first_name: 'Михаил',
              second_name: 'Владимирович',
              last_name: 'Орлов',
              mobile_phone: '+79187654321',
              birthday: '1975-09-22'
            },
            appointment_source: 'СберЗдоровье'
          }
        ]
      }
    };
  }

  /**
   * Mock POST /v2/occupied_doctor_schedule_slot/
   */
  async mockOccupySlot(payload) {
    const latency = await this._delay();
    if (this.forceConnectionFailure) {
      const err = new Error('ETIMEDOUT: Simulated network timeout to mis-api.medflex.ru');
      err.code = 'ETIMEDOUT';
      err.latencyMs = latency;
      throw err;
    }

    return {
      success: true,
      statusCode: 200,
      latencyMs: latency,
      data: {
        status: 'ok',
        message: 'Slot state successfully updated on MedFlex mock aggregator',
        receivedCells: payload.cells ? payload.cells.length : 0
      }
    };
  }

  /**
   * Mock POST /v2/doctors/send_schedule/
   */
  async mockSendSchedule(payload) {
    const latency = await this._delay();
    if (this.forceConnectionFailure) {
      const err = new Error('EHOSTUNREACH: Simulated host unreachable to mis-api.medflex.ru');
      err.code = 'EHOSTUNREACH';
      err.latencyMs = latency;
      throw err;
    }

    return {
      success: true,
      statusCode: 200,
      latencyMs: latency,
      data: {
        status: 'ok',
        message: 'Full schedule successfully accepted by MedFlex mock cloud'
      }
    };
  }

  /**
   * Mock POST /direct_appointment/doctor/cancel/ (cancel_online_appointment)
   */
  async mockCancelAppointment(claimId) {
    const latency = await this._delay();
    if (this.forceConnectionFailure) {
      const err = new Error('ECONNRESET: Simulated connection reset to api.medflex.ru');
      err.code = 'ECONNRESET';
      err.latencyMs = latency;
      throw err;
    }

    return {
      success: true,
      statusCode: 204,
      latencyMs: latency,
      data: null
    };
  }

  /**
   * Generate realistic simulated incoming booking webhook from ProDoctorov
   */
  generateSimulatedBookingWebhook({ doctorId = 10452, date, startTime, phone, patientName } = {}) {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const targetStart = startTime || '14:30';
    const [h, m] = targetStart.split(':').map(Number);
    const endMinutes = h * 60 + m + 30;
    const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
    const endM = String(endMinutes % 60).padStart(2, '0');
    const targetEnd = `${endH}:${endM}`;

    const names = [
      { first: 'Алексей', second: 'Михайлович', last: 'Воронов', bdate: '1985-06-14' },
      { first: 'Елена', second: 'Викторовна', last: 'Ковалёва', bdate: '1992-11-20' },
      { first: 'Дмитрий', second: 'Игоревич', last: 'Морозов', bdate: '1978-03-08' },
      { first: 'Ольга', second: 'Николаевна', last: 'Романова', bdate: '1990-09-25' }
    ];
    const picked = names[Math.floor(Math.random() * names.length)];

    return {
      doctor: {
        id: doctorId,
        lpu_id: 1,
        specialty: 'Травматолог-ортопед'
      },
      appointment: {
        dt_start: `${targetDate}T${targetStart}:00`,
        dt_end: `${targetDate}T${targetEnd}:00`,
        comment: 'Боль в коленном суставе при ходьбе, консультация ортопеда',
        price: 3500,
        is_online: false,
        is_club: false
      },
      client: {
        first_name: picked.first,
        second_name: picked.second,
        last_name: picked.last,
        mobile_phone: phone || `+7918${Math.floor(1000000 + Math.random() * 9000000)}`,
        birthday: picked.bdate
      },
      appointment_source: 'ПроДокторов'
    };
  }
}

module.exports = new MedflexMockServer();

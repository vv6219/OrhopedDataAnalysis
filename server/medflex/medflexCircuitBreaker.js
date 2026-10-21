/**
 * Circuit Breaker State Machine for MedFlex Service.
 * States:
 *  - HEALTHY: Normal operation, average ping < 300ms, 0 recent errors.
 *  - DEGRADED: 1-2 consecutive failures or high latency (> 1500ms). Still accepts requests with caution.
 *  - OFFLINE: 3+ consecutive failures or network unreachable. Outbound requests enqueued to offline queue.
 *  - RECOVERING: Link restored, draining offline queue and verifying slot synchronization.
 */

const { logMedflexAudit, LogLevels, MedflexEventTypes } = require('../medflexAuditLogger');

const CircuitStates = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  OFFLINE: 'offline',
  RECOVERING: 'recovering'
};

class MedflexCircuitBreaker {
  constructor() {
    this.state = CircuitStates.HEALTHY;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.lastLatencyMs = 42;
    this.lastPingAt = new Date().toISOString();
    this.lastSuccessAt = new Date().toISOString();
    this.lastFailureAt = null;
    this.lastError = null;
    this.stateChangedAt = new Date().toISOString();

    // Thresholds
    this.failureThreshold = 3; // 3 failures -> OFFLINE
    this.recoveryThreshold = 2; // 2 successes -> HEALTHY from RECOVERING
    this.highLatencyThresholdMs = 1500;
  }

  getState() {
    return {
      state: this.state,
      isAvailable: this.state === CircuitStates.HEALTHY || this.state === CircuitStates.DEGRADED,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      lastLatencyMs: this.lastLatencyMs,
      lastPingAt: this.lastPingAt,
      lastSuccessAt: this.lastSuccessAt,
      lastFailureAt: this.lastFailureAt,
      lastError: this.lastError,
      stateChangedAt: this.stateChangedAt
    };
  }

  isOnline() {
    return this.state !== CircuitStates.OFFLINE;
  }

  recordSuccess(latencyMs = 35) {
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses += 1;
    this.lastLatencyMs = latencyMs;
    this.lastPingAt = new Date().toISOString();
    this.lastSuccessAt = new Date().toISOString();

    const previousState = this.state;

    if (this.state === CircuitStates.OFFLINE) {
      this.state = CircuitStates.RECOVERING;
      this.stateChangedAt = new Date().toISOString();
      logMedflexAudit({
        level: LogLevels.INFO,
        message: 'MedFlex connection restored. Circuit Breaker switched to RECOVERING state.',
        eventType: MedflexEventTypes.CONNECTION_RESTORED,
        direction: 'Internal',
        durationMs: latencyMs,
        properties: { PreviousState: previousState, NewState: this.state }
      });
    } else if (this.state === CircuitStates.RECOVERING) {
      if (this.consecutiveSuccesses >= this.recoveryThreshold) {
        this.state = CircuitStates.HEALTHY;
        this.stateChangedAt = new Date().toISOString();
        logMedflexAudit({
          level: LogLevels.INFO,
          message: 'MedFlex connection fully stabilized. Circuit Breaker switched to HEALTHY state.',
          eventType: MedflexEventTypes.HEARTBEAT_OK,
          direction: 'Internal',
          durationMs: latencyMs,
          properties: { PreviousState: previousState, NewState: this.state }
        });
      }
    } else if (this.state === CircuitStates.DEGRADED) {
      if (latencyMs < this.highLatencyThresholdMs) {
        this.state = CircuitStates.HEALTHY;
        this.stateChangedAt = new Date().toISOString();
      }
    }
  }

  recordFailure(err, latencyMs = 0) {
    this.consecutiveSuccesses = 0;
    this.consecutiveFailures += 1;
    this.lastLatencyMs = latencyMs;
    this.lastPingAt = new Date().toISOString();
    this.lastFailureAt = new Date().toISOString();
    this.lastError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);

    const previousState = this.state;

    if (this.consecutiveFailures >= this.failureThreshold) {
      if (this.state !== CircuitStates.OFFLINE) {
        this.state = CircuitStates.OFFLINE;
        this.stateChangedAt = new Date().toISOString();
        logMedflexAudit({
          level: LogLevels.ERROR,
          message: `MedFlex connection lost after ${this.consecutiveFailures} consecutive failures: ${this.lastError}`,
          eventType: MedflexEventTypes.CONNECTION_LOST,
          direction: 'Internal',
          durationMs: latencyMs,
          properties: {
            PreviousState: previousState,
            NewState: this.state,
            ConsecutiveFailures: this.consecutiveFailures,
            LastError: this.lastError
          },
          exception: err
        });
      }
    } else {
      if (this.state === CircuitStates.HEALTHY) {
        this.state = CircuitStates.DEGRADED;
        this.stateChangedAt = new Date().toISOString();
        logMedflexAudit({
          level: LogLevels.WARN,
          message: `MedFlex connection degraded (failure ${this.consecutiveFailures}/${this.failureThreshold}): ${this.lastError}`,
          eventType: MedflexEventTypes.CONNECTION_DEGRADED,
          direction: 'Internal',
          durationMs: latencyMs,
          properties: {
            PreviousState: previousState,
            NewState: this.state,
            ConsecutiveFailures: this.consecutiveFailures
          }
        });
      }
    }
  }
}

module.exports = {
  CircuitStates,
  circuitBreaker: new MedflexCircuitBreaker()
};

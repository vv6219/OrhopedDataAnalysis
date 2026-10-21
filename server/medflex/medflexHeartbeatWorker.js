/**
 * Background Heartbeat & Sync Worker for MedFlex Integration.
 * Periodically probes connection latency, monitors SLA, triggers
 * queue drainage upon reconnection, and executes scheduled doctor schedule window sync.
 * All frequencies and intervals are configurable parameters in calculation_parameters.
 */

const medflexClient = require('./medflexClient');
const { circuitBreaker, CircuitStates } = require('./medflexCircuitBreaker');

class MedflexHeartbeatWorker {
  constructor() {
    this.timer = null;
    this.scheduleTimer = null;
    this.intervalMs = 60000; // 60s default ping/telemetry interval
    this.scheduleSyncIntervalMs = 30 * 60 * 1000; // 30 min default schedule push interval
    this.isRunning = false;
    this.lastProbeResult = null;
    this.queueService = null; // Injected to avoid circular dependency
  }

  setQueueService(queueService) {
    this.queueService = queueService;
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const config = await medflexClient.getConfig();
      if (config.ping_interval_sec && Number(config.ping_interval_sec) > 0) {
        this.intervalMs = Math.max(5000, Number(config.ping_interval_sec) * 1000);
      }
      if (config.schedule_sync_interval_min && Number(config.schedule_sync_interval_min) > 0) {
        this.scheduleSyncIntervalMs = Math.max(60000, Number(config.schedule_sync_interval_min) * 60000);
      }
    } catch (e) {
      // Use defaults
    }

    // Run initial probe after 3 seconds
    setTimeout(() => {
      this.probe();
    }, 3000);

    // Arm watchdog timers
    this.armPingTimer();
    this.armScheduleTimer();

    console.log(
      `[MedflexHeartbeatWorker] Background heartbeat watchdog started (Ping: ${this.intervalMs / 1000}s, Schedule Sync: ${this.scheduleSyncIntervalMs / 60000}m)`
    );
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
      this.scheduleTimer = null;
    }
    this.isRunning = false;
    console.log('[MedflexHeartbeatWorker] Heartbeat watchdog stopped');
  }

  /**
   * Dynamically update intervals without full process restart
   */
  updateIntervals({ pingIntervalSec, scheduleSyncIntervalMin }) {
    if (pingIntervalSec !== undefined && Number(pingIntervalSec) > 0) {
      this.intervalMs = Math.max(5000, Number(pingIntervalSec) * 1000);
      this.armPingTimer();
      console.log(`[MedflexHeartbeatWorker] Ping interval dynamically updated to ${this.intervalMs / 1000}s`);
    }

    if (scheduleSyncIntervalMin !== undefined && Number(scheduleSyncIntervalMin) > 0) {
      this.scheduleSyncIntervalMs = Math.max(60000, Number(scheduleSyncIntervalMin) * 60000);
      this.armScheduleTimer();
      console.log(`[MedflexHeartbeatWorker] Schedule sync interval dynamically updated to ${this.scheduleSyncIntervalMs / 60000}m`);
    }
  }

  armPingTimer() {
    if (this.timer) clearInterval(this.timer);
    if (!this.isRunning) return;

    this.timer = setInterval(() => {
      this.probe();
    }, this.intervalMs);
  }

  armScheduleTimer() {
    if (this.scheduleTimer) clearInterval(this.scheduleTimer);
    if (!this.isRunning) return;

    this.scheduleTimer = setInterval(async () => {
      try {
        const syncService = require('./medflexSyncService');
        const config = await medflexClient.getConfig();
        if (config.enabled) {
          console.log('[MedflexHeartbeatWorker] Triggering scheduled periodic sync of doctor schedule...');
          await syncService.syncFullSchedule(config.sync_days_ahead || 30);
        }
      } catch (err) {
        console.warn('[MedflexHeartbeatWorker] Periodic schedule sync error:', err.message);
      }
    }, this.scheduleSyncIntervalMs);
  }

  async probe() {
    try {
      const prevState = circuitBreaker.state;
      const res = await medflexClient.ping();
      this.lastProbeResult = res;

      // Check if connection just recovered from OFFLINE
      if (prevState === CircuitStates.OFFLINE && circuitBreaker.isOnline()) {
        console.log('[MedflexHeartbeatWorker] Connection recovered! Triggering offline queue drain...');
        if (this.queueService && typeof this.queueService.drainQueue === 'function') {
          this.queueService.drainQueue();
        }
      }

      return res;
    } catch (err) {
      console.warn('[MedflexHeartbeatWorker] Heartbeat probe error:', err.message);
      return { success: false, error: err.message, state: circuitBreaker.getState() };
    }
  }

  getLastProbe() {
    return {
      lastProbe: this.lastProbeResult,
      circuitState: circuitBreaker.getState(),
      watchdogRunning: this.isRunning,
      pingIntervalSec: this.intervalMs / 1000,
      scheduleSyncIntervalMin: this.scheduleSyncIntervalMs / 60000
    };
  }
}

module.exports = new MedflexHeartbeatWorker();

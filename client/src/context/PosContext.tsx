import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { API_BASE_URL } from '../config/apiConfig';

export interface PosTerminalStatus {
  status: 'Ready' | 'Busy' | 'Error';
  isMockMode: boolean;
  terminalId: string;
  merchantId: string;
  bankName: string;
  driverType: string;
  connectionType: string;
  port: string;
  baudRate: number;
  ipAddress?: string;
  ipPort?: number;
  executionTimeoutSeconds: number;
  enableSbpQr: boolean;
  driverExecutablePath?: string;
  serviceName?: string;
  exchangePath?: string;
  serviceStatus?: {
    found: boolean;
    status: string;
    displayName: string;
    startType: string;
    error?: string;
  } | null;
  hardware?: {
    found: boolean;
    isHardwareReady: boolean;
    deviceName: string;
    manufacturer?: string;
    error?: string;
  };
  isLocked: boolean;
  activeProfileId?: number;
  profileName?: string;
}

export interface PosSettingsProfile {
  id: number;
  profile_name: string;
  is_mock_mode: number;
  driver_type: string;
  connection_type: string;
  port: string;
  baud_rate: number;
  ip_address: string;
  ip_port: number;
  terminal_id: string;
  merchant_id: string;
  bank_name: string;
  currency_code: string;
  execution_timeout_seconds: number;
  driver_executable_path: string;
  service_name?: string;
  exchange_path?: string;
  enable_sbp_qr: number;
  mock_scenario: string;
  mock_delay_seconds: number;
  is_active: number;
  notes: string;
  updated_at: string;
  updated_by: string;
}

export interface PosDiagnosticStep {
  id: string;
  name: string;
  status: 'success' | 'warning' | 'error' | 'skipped';
  details: string;
}

export interface PosHostTestResult {
  success: boolean;
  responseCode?: string;
  message?: string;
  error?: string;
  rttMs?: number;
  timestamp?: string;
  terminalId?: string;
  merchantId?: string;
  bankName?: string;
  driverType?: string;
  isMockMode?: boolean;
  connectionType?: string;
  port?: string;
  baudRate?: number;
  driverExecutablePath?: string;
  diagnosticSteps?: PosDiagnosticStep[];
  remediation?: string;
  rawResponse?: string;
}

interface PosContextType {
  posStatus: PosTerminalStatus | null;
  profiles: PosSettingsProfile[];
  activeProfile: PosSettingsProfile | null;
  loading: boolean;
  refreshPosStatus: () => Promise<void>;
  setMockMode: (isMockMode: boolean, profileId?: number, updatedBy?: string) => Promise<any>;
  activateProfile: (profileId: number, updatedBy?: string) => Promise<any>;
  testHost: () => Promise<PosHostTestResult>;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export function PosProvider({ children }: { children: ReactNode }) {
  const [posStatus, setPosStatus] = useState<PosTerminalStatus | null>(null);
  const [profiles, setProfiles] = useState<PosSettingsProfile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<PosSettingsProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshPosStatus = async () => {
    setLoading(true);
    try {
      const [resStatus, resSettings] = await Promise.all([
        fetch(`${API_BASE_URL}/api/pos/status`),
        fetch(`${API_BASE_URL}/api/pos/settings`)
      ]);

      if (resStatus.ok) {
        const contentType = resStatus.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await resStatus.json();
          setPosStatus(data);
        }
      }

      if (resSettings.ok) {
        const contentType = resSettings.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const profs: PosSettingsProfile[] = await resSettings.json();
          setProfiles(profs);
          const active = profs.find(p => p.is_active === 1) || null;
          setActiveProfileState(active);
        }
      }
    } catch (err) {
      console.error('Error refreshing POS context:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPosStatus();
    const interval = setInterval(refreshPosStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const setMockMode = async (isMockMode: boolean, profileId?: number, updatedBy: string = 'Администратор') => {
    const res = await fetch(`${API_BASE_URL}/api/pos/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_mock_mode: isMockMode,
        profile_id: profileId,
        updated_by: updatedBy
      })
    });
    if (!res.ok) {
      const contentType = res.headers.get('content-type') || '';
      let errMsg = 'Ошибка переключения режима эквайринга';
      if (contentType.includes('application/json')) {
        const err = await res.json();
        errMsg = err.error || errMsg;
      }
      throw new Error(errMsg);
    }
    const data = await res.json();
    await refreshPosStatus();
    return data;
  };

  const activateProfile = async (profileId: number, updatedBy: string = 'Администратор') => {
    const res = await fetch(`${API_BASE_URL}/api/pos/settings/${profileId}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updated_by: updatedBy })
    });
    const data = await res.json();
    await refreshPosStatus();
    return data;
  };

  const testHost = async (): Promise<PosHostTestResult> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/test-host`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        return {
          success: false,
          responseCode: '99',
          error: `Сервер вернул ответ без JSON (HTTP ${res.status}): ${text.slice(0, 120)}...`,
          message: 'Шлюз Express вернул неожиданный формат (HTML вместо JSON). Проверьте запуск сервера.',
          rttMs: 0,
          timestamp: new Date().toISOString(),
          diagnosticSteps: [
            { id: 'gateway', name: 'Сетевой шлюз МИС (Node.js API)', status: 'error', details: `HTTP ${res.status} (Получен HTML/Text вместо JSON)` },
            { id: 'routing', name: 'Маршрутизация Express', status: 'error', details: 'Маршрут /api/pos/test-host не распознан сервером' }
          ],
          remediation: 'Перезапустите фоновый процесс сервера Node.js на порту 5000'
        };
      }
      const data: PosHostTestResult = await res.json();
      await refreshPosStatus();
      return data;
    } catch (err: any) {
      return {
        success: false,
        responseCode: '99',
        error: err.message || 'Ошибка связи с сервером',
        message: 'Не удалось отправить сетевой запрос к локальному сервису эквайринга',
        rttMs: 0,
        timestamp: new Date().toISOString(),
        diagnosticSteps: [
          { id: 'network', name: 'Сетевой вызов клиента (Fetch)', status: 'error', details: err.message || 'Network error' },
          { id: 'gateway', name: 'Сервер МИС (порт 5000)', status: 'error', details: 'Соединение недоступно' }
        ],
        remediation: 'Убедитесь, что сервер Node.js запущен на порту 5000'
      };
    }
  };

  return (
    <PosContext.Provider
      value={{
        posStatus,
        profiles,
        activeProfile,
        loading,
        refreshPosStatus,
        setMockMode,
        activateProfile,
        testHost
      }}
    >
      {children}
    </PosContext.Provider>
  );
}

export function usePos() {
  const context = useContext(PosContext);
  if (!context) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
}

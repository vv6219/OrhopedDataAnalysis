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
  enable_sbp_qr: number;
  mock_scenario: string;
  mock_delay_seconds: number;
  is_active: number;
  notes: string;
  updated_at: string;
  updated_by: string;
}

interface PosContextType {
  posStatus: PosTerminalStatus | null;
  activeProfile: PosSettingsProfile | null;
  loading: boolean;
  refreshPosStatus: () => Promise<void>;
  setMockMode: (isMockMode: boolean, profileId?: number, updatedBy?: string) => Promise<any>;
  activateProfile: (profileId: number, updatedBy?: string) => Promise<any>;
  testHost: () => Promise<any>;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export function PosProvider({ children }: { children: ReactNode }) {
  const [posStatus, setPosStatus] = useState<PosTerminalStatus | null>(null);
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
        const data = await resStatus.json();
        setPosStatus(data);
      }

      if (resSettings.ok) {
        const profiles: PosSettingsProfile[] = await resSettings.json();
        const active = profiles.find(p => p.is_active === 1) || null;
        setActiveProfileState(active);
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
      const err = await res.json();
      throw new Error(err.error || 'Ошибка переключения режима эквайринга');
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

  const testHost = async () => {
    const res = await fetch(`${API_BASE_URL}/api/pos/test-host`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    await refreshPosStatus();
    return data;
  };

  return (
    <PosContext.Provider
      value={{
        posStatus,
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

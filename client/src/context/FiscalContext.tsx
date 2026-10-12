import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { API_BASE_URL } from '../config/apiConfig';
import type { FiscalDeviceStatus, ConnectionTestResult } from '../components/FiscalDeviceCard';
import type { FiscalSettingsProfile } from '../pages/FiscalSettings';

interface FiscalContextType {
  fiscalStatus: FiscalDeviceStatus | null;
  activeProfile: FiscalSettingsProfile | null;
  loading: boolean;
  refreshFiscalStatus: () => Promise<void>;
  setMockMode: (isMockMode: boolean, profileId?: number, updatedBy?: string) => Promise<any>;
  activateProfile: (profileId: number, updatedBy?: string) => Promise<any>;
  testConnection: (profileId?: number) => Promise<ConnectionTestResult>;
}

const FiscalContext = createContext<FiscalContextType | undefined>(undefined);

export function FiscalProvider({ children }: { children: ReactNode }) {
  const [fiscalStatus, setFiscalStatus] = useState<FiscalDeviceStatus | null>(null);
  const [activeProfile, setActiveProfileState] = useState<FiscalSettingsProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshFiscalStatus = async () => {
    setLoading(true);
    try {
      const [resStatus, resSettings] = await Promise.all([
        fetch(`${API_BASE_URL}/api/fiscal/status`),
        fetch(`${API_BASE_URL}/api/fiscal/settings`)
      ]);

      if (resStatus.ok) {
        const data = await resStatus.json();
        setFiscalStatus(data);
      }

      if (resSettings.ok) {
        const profiles: FiscalSettingsProfile[] = await resSettings.json();
        const active = profiles.find(p => p.is_active === 1) || null;
        setActiveProfileState(active);
      }
    } catch (err) {
      console.error('Error refreshing fiscal context:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFiscalStatus();
  }, []);

  const setMockMode = async (isMockMode: boolean, profileId?: number, updatedBy: string = 'Администратор') => {
    const res = await fetch(`${API_BASE_URL}/api/fiscal/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_mock_mode: isMockMode,
        profile_id: profileId,
        updated_by: updatedBy
      })
    });
    const data = await res.json();
    await refreshFiscalStatus();
    return data;
  };

  const activateProfile = async (profileId: number, updatedBy: string = 'Администратор') => {
    const res = await fetch(`${API_BASE_URL}/api/fiscal/settings/${profileId}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updated_by: updatedBy })
    });
    const data = await res.json();
    await refreshFiscalStatus();
    return data;
  };

  const testConnection = async (profileId?: number): Promise<ConnectionTestResult> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fiscal/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId })
      });
      const data = await res.json();
      await refreshFiscalStatus();
      return data;
    } catch (err: any) {
      return {
        success: false,
        isMockMode: fiscalStatus?.isMockMode ?? true,
        modeLabel: fiscalStatus?.isMockMode ? 'Эмулятор ККТ (Mock)' : 'Реальное оборудование (COM-порт)',
        deviceModel: fiscalStatus?.deviceModel || 'АТОЛ 91Ф',
        port: fiscalStatus?.port || 'COM3',
        baudRate: fiscalStatus?.baudRate || 115200,
        latencyMs: 0,
        message: `Ошибка сетевого запроса: ${err.message}`,
        error: err.message
      };
    }
  };

  return (
    <FiscalContext.Provider
      value={{
        fiscalStatus,
        activeProfile,
        loading,
        refreshFiscalStatus,
        setMockMode,
        activateProfile,
        testConnection
      }}
    >
      {children}
    </FiscalContext.Provider>
  );
}

export function useFiscal() {
  const context = useContext(FiscalContext);
  if (!context) {
    throw new Error('useFiscal must be used within a FiscalProvider');
  }
  return context;
}

'use client';

import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useDriveSync, DriveSyncStatus } from '@/hooks/useDriveSync';
import { useBaseDriveSync, BaseDriveSyncStatus } from '@/hooks/useBaseDriveSync';

interface DriveSyncContextValue {
  folderSyncStatus: DriveSyncStatus;
  connectFolder: () => void;
  changeDriveFolder: () => void;
  driveFolderName: string | null;

  baseSyncStatus: BaseDriveSyncStatus;
  connectBaseFolder: () => void;
  changeBaseFolder: () => void;
  baseFolderName: string | null;
}

const DriveSyncContext = createContext<DriveSyncContextValue | null>(null);

export function DriveSyncProvider({ children }: { children: ReactNode }) {
  const { status: folderSyncStatus, connect: connectFolder, changeFolder: changeDriveFolder, folderName: driveFolderName } = useDriveSync();
  const { status: baseSyncStatus, connect: connectBaseFolder, changeFolder: changeBaseFolder, folderName: baseFolderName } = useBaseDriveSync();

  // Pasta reunião só conecta após a pasta base estar conectada.
  // Evita race condition de dois token clients simultâneos e garante a ordem.
  const connectFolderRef = useRef(connectFolder);
  useEffect(() => { connectFolderRef.current = connectFolder; }, [connectFolder]);
  const reuniaoTriggeredRef = useRef(false);

  useEffect(() => {
    if (baseSyncStatus !== 'connected') return;
    if (reuniaoTriggeredRef.current) return;
    reuniaoTriggeredRef.current = true;
    void connectFolderRef.current();
  }, [baseSyncStatus]);

  // Se a pasta base for desconectada/reconectada, permite tentar a reunião novamente
  useEffect(() => {
    if (baseSyncStatus === 'idle' || baseSyncStatus === 'error') {
      reuniaoTriggeredRef.current = false;
    }
  }, [baseSyncStatus]);

  return (
    <DriveSyncContext.Provider value={{
      folderSyncStatus,
      connectFolder,
      changeDriveFolder,
      driveFolderName,
      baseSyncStatus,
      connectBaseFolder,
      changeBaseFolder,
      baseFolderName,
    }}>
      {children}
    </DriveSyncContext.Provider>
  );
}

export function useDriveSyncContext(): DriveSyncContextValue {
  const ctx = useContext(DriveSyncContext);
  if (!ctx) throw new Error('useDriveSyncContext must be used inside DriveSyncProvider');
  return ctx;
}

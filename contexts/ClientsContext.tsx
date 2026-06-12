'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ClientAdmin } from '@/lib/client-types';
import { apiAvailable, listClients, archiveClient } from '@/lib/api';

interface ClientsContextValue {
  clients: ClientAdmin[];
  createClient: (data: Omit<ClientAdmin, 'id' | 'createdAt' | 'updatedAt'>) => ClientAdmin;
  updateClient: (id: string, data: Partial<ClientAdmin>) => void;
  deleteClient: (id: string) => Promise<void>;
}

const ClientsContext = createContext<ClientsContextValue | null>(null);

export function ClientsProvider({ children }: { children: ReactNode }) {
  // Lista 100% do banco — nunca exibe clientes mocados. Sem API, fica vazia.
  const [clients, setClients] = useState<ClientAdmin[]>([]);

  useEffect(() => {
    if (!apiAvailable()) return;
    listClients().then((rows) => {
      if (rows) setClients(rows);
    });
  }, []);

  function createClient(data: Omit<ClientAdmin, 'id' | 'createdAt' | 'updatedAt'>): ClientAdmin {
    const id = `client-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const newClient: ClientAdmin = { ...data, id, createdAt: now, updatedAt: now };
    setClients((prev) => [newClient, ...prev]);
    return newClient;
  }

  function updateClient(id: string, data: Partial<ClientAdmin>) {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c))
    );
  }

  async function deleteClient(id: string) {
    const target = clients.find((c) => c.id === id);
    // Arquiva no backend (soft-delete). Só remove da UI após sucesso, para não
    // dar a falsa impressão de exclusão se o servidor recusar (aí reaparece no
    // refresh, que foi o bug original). Em mock-mode (sem API) remove direto.
    if (target && apiAvailable()) {
      const ok = await archiveClient(target.slug);
      if (!ok) return;
    }
    setClients((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <ClientsContext.Provider value={{ clients, createClient, updateClient, deleteClient }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error('useClients must be used within ClientsProvider');
  return ctx;
}

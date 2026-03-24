'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ClientAdmin } from '@/lib/client-types';
import { initialClients } from '@/data/clients-admin';

interface ClientsContextValue {
  clients: ClientAdmin[];
  createClient: (data: Omit<ClientAdmin, 'id' | 'createdAt' | 'updatedAt'>) => ClientAdmin;
  updateClient: (id: string, data: Partial<ClientAdmin>) => void;
  deleteClient: (id: string) => void;
}

const ClientsContext = createContext<ClientsContextValue | null>(null);

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<ClientAdmin[]>(initialClients);

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

  function deleteClient(id: string) {
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

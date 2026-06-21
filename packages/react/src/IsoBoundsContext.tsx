'use client';

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type BoundsRegistration = {
  type: 'service' | 'cylinder';
  u: number;
  v: number;
  z?: number;
  height?: number;
  label?: string;
};

type RegistrationContextValue = {
  register: (id: string, node: BoundsRegistration) => void;
  unregister: (id: string) => void;
};

const RegistrationContext = createContext<RegistrationContextValue | null>(null);
const NodesContext = createContext<BoundsRegistration[]>([]);

export function IsoBoundsProvider({ children }: { children: ReactNode }) {
  const [registry, setRegistry] = useState<Map<string, BoundsRegistration>>(
    () => new Map(),
  );

  const register = useCallback((id: string, node: BoundsRegistration) => {
    setRegistry((prev) => {
      const next = new Map(prev);
      next.set(id, node);
      return next;
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setRegistry((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const registrationValue = useMemo(
    () => ({ register, unregister }),
    [register, unregister],
  );

  const nodes = useMemo(() => Array.from(registry.values()), [registry]);

  return (
    <RegistrationContext.Provider value={registrationValue}>
      <NodesContext.Provider value={nodes}>{children}</NodesContext.Provider>
    </RegistrationContext.Provider>
  );
}

export function useIsoBoundsRegistration(node: BoundsRegistration) {
  const registration = useContext(RegistrationContext);
  const id = useId();

  useLayoutEffect(() => {
    if (!registration) return;
    registration.register(id, node);
    return () => registration.unregister(id);
  }, [
    registration,
    id,
    node.type,
    node.u,
    node.v,
    node.z,
    node.height,
    node.label,
  ]);
}

export function useRegisteredNodes() {
  return useContext(NodesContext);
}

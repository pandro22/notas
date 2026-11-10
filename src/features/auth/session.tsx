import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type SessionState = { session: Session | null; loading: boolean };

// Contexto: una "pizarra" que cualquier pantalla puede leer sin que se la pasen por props.
const SessionContext = createContext<SessionState>({ session: null, loading: true });

// Antes esta lógica vivía en App.tsx. Ahora la usan el layout raíz (para proteger rutas)
// y las pantallas (para saber el id del usuario).
export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sesión guardada en el móvil (así no hay que hacer login cada vez).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Escucha login, logout y caducidad del token.
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      // SEGURIDAD: al cerrar sesión se vacía la caché, para que el siguiente usuario
      // de este móvil no pueda ver ni un instante las notas del anterior.
      if (event === 'SIGNED_OUT') queryClient.clear();
    });

    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  // useMemo evita crear un objeto nuevo en cada repintado (y repintar a todos los consumidores).
  const value = useMemo(() => ({ session, loading }), [session, loading]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// Hook para leer la sesión desde cualquier pantalla.
export function useSession() {
  return useContext(SessionContext);
}

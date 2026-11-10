import { QueryClient } from '@tanstack/react-query';

// Cliente único de TanStack Query: guarda en caché lo que pedimos al servidor.
// Está fuera de cualquier componente para que exista una sola caché en toda la app.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // durante 30 s consideramos los datos "frescos" y no se vuelven a pedir
      retry: 1, // si una petición falla, se reintenta una vez
    },
  },
});

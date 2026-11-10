import { useEffect, useState } from 'react';

// Devuelve el valor recibido, pero con retraso: solo cambia cuando el original lleva
// "delayMs" milisegundos sin cambiar. Es el mismo debounce de antes, ahora reutilizable.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    // Si el valor cambia antes de que acabe el tiempo, se cancela el temporizador anterior.
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

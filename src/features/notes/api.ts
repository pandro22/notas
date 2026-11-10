// Capa de datos de las notas: toda la comunicación con Supabase vive aquí.
// Las pantallas solo usan estos hooks y no saben nada de tablas ni consultas.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { sanitizeTerm } from '@/lib/search';
import { useSession } from '@/features/auth/session';

// Forma de una nota tal y como viene de la base de datos. body puede ser null (nota sin contenido).
export type Note = { id: string; title: string; body: string | null; created_at: string };
// Lo que el usuario puede escribir. Nunca incluye user_id: lo pone la base de datos.
export type NoteValues = { title: string; body: string | null };

// "term" es el término (ya limpio) con el que se obtuvieron estas notas. Así la pantalla
// resalta siempre lo que de verdad se buscó, aunque el usuario ya haya escrito otra letra.
type NotesResult = { term: string; notes: Note[] };

async function fetchNotes(safeTerm: string): Promise<NotesResult> {
  let request = supabase.from('notes').select('id, title, body, created_at');
  if (safeTerm) {
    // ilike = comparar sin distinguir mayúsculas; % = "cualquier texto". Título O contenido.
    request = request.or(`title.ilike.%${safeTerm}%,body.ilike.%${safeTerm}%`);
  }
  // Los filtros van antes de order(). Más nueva primero.
  // Gracias a RLS, la base de datos solo devuelve las notas del usuario con sesión iniciada.
  const { data, error } = await request.order('created_at', { ascending: false });
  if (error) throw error; // TanStack Query convierte el throw en el estado "error"
  return { term: safeTerm, notes: data ?? [] };
}

// Lista de notas, todas o filtradas por un término.
// TanStack Query se encarga de: caché, estado de carga/error, reintentos y de descartar
// respuestas antiguas (lo que antes hacíamos a mano con requestId).
export function useNotes(term = '', enabled = true) {
  const { session } = useSession();
  const userId = session?.user.id;
  const safe = sanitizeTerm(term);

  return useQuery({
    // La clave identifica la caché. Incluye el usuario: otra cuenta = otra caché.
    queryKey: ['notes', userId, safe],
    queryFn: () => fetchNotes(safe),
    enabled: enabled && !!userId,
    // Mientras llegan los resultados nuevos, se siguen mostrando los anteriores (sin parpadeo).
    placeholderData: keepPreviousData,
  });
}

// Crear o editar: si hay id actualiza esa nota; si no, crea una nueva.
export function useSaveNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string | null; values: NoteValues }) => {
      if (id) {
        // UPDATE: solo título y contenido. Nunca user_id: una nota no puede cambiar de dueño.
        // .select('id') devuelve las filas modificadas para poder comprobarlo.
        const { data, error } = await supabase.from('notes').update(values).eq('id', id).select('id');
        if (error) throw error;
        // Si RLS bloquea la fila (o ya no existe) NO hay error: se actualizan 0 filas.
        if (!data || data.length === 0) {
          throw new Error('La nota ya no existe o no tienes permiso para cambiarla.');
        }
      } else {
        // INSERT: user_id lo rellena la base de datos con auth.uid().
        const { error } = await supabase.from('notes').insert(values);
        if (error) throw error;
      }
    },
    // Al terminar, se marcan como caducadas todas las listas de notas (la de Notas y la de
    // Buscar) y se vuelven a pedir. Así las dos pestañas siempre muestran lo mismo.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });
}

// Borrar una nota. RLS impide borrar notas de otros usuarios.
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id); // eq = "igual a"
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });
}

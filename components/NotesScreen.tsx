// useCallback: memoriza una función. useRef: caja que guarda un valor SIN provocar repintado.
import { useCallback, useEffect, useRef, useState } from 'react';
// FlatList: lista eficiente que solo pinta lo que cabe en pantalla.
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { sanitizeTerm } from '../lib/search';
import Field from './Field';
import Highlight from './Highlight';
import { colors, fonts } from '../theme';

// Forma de una nota tal y como viene de la base de datos. body puede ser null (nota sin contenido).
type Note = { id: string; title: string; body: string | null; created_at: string };

// Milisegundos que esperamos tras la última tecla antes de buscar.
const SEARCH_DELAY_MS = 300;

// "2026-11-08T12:51:22Z" -> "8 nov"
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// Recibe la sesión como "prop" desde App.tsx; el tipo { session: Session } la describe.
export default function NotesScreen({ session }: { session: Session }) {
  const [notes, setNotes] = useState<Note[]>([]); // lista de notas mostradas
  const [title, setTitle] = useState(''); // lo que se escribe en "Título"
  const [body, setBody] = useState(''); // lo que se escribe en "Contenido"
  const [query, setQuery] = useState(''); // lo que se escribe en "Buscar"
  // Término con el que se obtuvieron las notas que se ven ahora. Se resalta ESTE y no "query",
  // para que el marcatextos siempre coincida con los resultados mostrados (query va 300 ms por delante).
  const [activeTerm, setActiveTerm] = useState('');
  // id de la nota que se está editando, o null si estamos creando una nueva.
  // Este único dato decide si el formulario CREA o EDITA.
  const [editingId, setEditingId] = useState<string | null>(null);

  // Contador de peticiones. Cada petición apunta su número; si al volver ya hay una más nueva,
  // se descarta. Así una respuesta lenta y antigua nunca pisa a una más reciente.
  const requestId = useRef(0);

  // Pide las notas a Supabase (todas, o las que coincidan con el término de búsqueda).
  // Gracias a RLS, la base de datos solo devuelve las del usuario que ha iniciado sesión.
  const fetchNotes = useCallback(async (term: string) => {
    const id = ++requestId.current; // número de ESTA petición

    // Misma limpieza que usará el resaltado (ver lib/search.ts).
    const safe = sanitizeTerm(term);

    let request = supabase.from('notes').select('id, title, body, created_at');
    if (safe) {
      // ilike = comparar sin distinguir mayúsculas; % = "cualquier texto". Título O contenido.
      request = request.or(`title.ilike.%${safe}%,body.ilike.%${safe}%`);
    }
    // Los filtros van antes de order(). Más nueva primero.
    const { data, error } = await request.order('created_at', { ascending: false });

    if (id !== requestId.current) return; // mientras esperábamos salió una petición más nueva: ignorar
    if (error) {
      Alert.alert('No se pudieron cargar las notas', error.message);
      return;
    }
    setNotes(data ?? []); // "?? []" = si data es null, usa una lista vacía
    setActiveTerm(safe);
  }, []);

  // DEBOUNCE: cada vez que cambia el texto de búsqueda, programamos la búsqueda para dentro de
  // 300 ms. Si el usuario escribe otra letra antes, la función de limpieza cancela el temporizador
  // anterior y se programa uno nuevo. Solo se busca cuando el usuario deja de escribir.
  useEffect(() => {
    // Con el buscador vacío (por ejemplo al abrir la pantalla) no hace falta esperar.
    const delay = query ? SEARCH_DELAY_MS : 0;
    const timer = setTimeout(() => fetchNotes(query), delay);
    return () => clearTimeout(timer); // limpieza: cancela el temporizador pendiente
  }, [query, fetchNotes]);

  // Vacía el formulario y sale del modo edición.
  function resetForm() {
    setTitle('');
    setBody('');
    setEditingId(null);
  }

  // Pasa una nota al formulario para editarla.
  function startEdit(note: Note) {
    setEditingId(note.id);
    setTitle(note.title);
    setBody(note.body ?? ''); // si no tiene contenido (null), la caja queda vacía
  }

  // Un solo botón para dos acciones: si hay editingId actualiza esa nota; si no, crea una nueva.
  async function save() {
    if (!title.trim()) return; // el título es obligatorio
    // body vacío se guarda como null ("" || null da null).
    const values = { title: title.trim(), body: body.trim() || null };

    if (editingId) {
      // UPDATE: solo enviamos título y contenido. Nunca user_id: una nota no puede cambiar de dueño.
      // .select('id') hace que Supabase devuelva las filas modificadas, para poder comprobarlo.
      const { data, error } = await supabase.from('notes').update(values).eq('id', editingId).select('id');
      if (error) {
        Alert.alert('No se pudo guardar', error.message);
        return;
      }
      // Si RLS bloquea la fila (o ya no existe) NO hay error: simplemente se actualizan 0 filas.
      if (!data || data.length === 0) {
        Alert.alert('No se pudo guardar', 'La nota ya no existe o no tienes permiso para cambiarla.');
        return;
      }
    } else {
      // INSERT: user_id lo rellena la base de datos con auth.uid(); no se envía desde el cliente.
      const { error } = await supabase.from('notes').insert(values);
      if (error) {
        Alert.alert('No se pudo guardar', error.message);
        return;
      }
    }
    resetForm();
    fetchNotes(query); // recargamos respetando la búsqueda que haya escrita
  }

  // Borra la nota con ese id. RLS impide borrar notas de otros usuarios.
  async function remove(id: string) {
    const { error } = await supabase.from('notes').delete().eq('id', id); // eq = "igual a"
    if (error) {
      Alert.alert('No se pudo borrar', error.message);
      return;
    }
    if (id === editingId) resetForm(); // si borramos la nota que estábamos editando, salimos del modo edición
    fetchNotes(query); // recargamos respetando la búsqueda que haya escrita
  }

  return (
    <View style={styles.container}>
      {/* Cabecera: nombre de la app, email del usuario y botón para salir */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.wordmark}>Notas</Text>
          <Text style={styles.email} numberOfLines={1}>
            {session.user.email}
          </Text>
        </View>
        {/* signOut cierra la sesión; App.tsx lo detecta y vuelve al login solo. */}
        <Pressable onPress={() => supabase.auth.signOut()} hitSlop={12} accessibilityRole="button">
          <Text style={styles.link}>Salir</Text>
        </Pressable>
      </View>

      {/* Buscador: guarda lo escrito en el estado "query"; el efecto de arriba hace el resto. */}
      <Field placeholder="Buscar" accessibilityLabel="Buscar notas" value={query} onChangeText={setQuery} />

      {/* Formulario: sirve para crear y para editar. */}
      <View style={styles.form}>
        <Field
          style={styles.titleInput}
          placeholder="Título"
          accessibilityLabel="Título de la nota"
          value={title}
          onChangeText={setTitle}
        />
        <Field
          style={styles.bodyInput}
          placeholder="Contenido"
          accessibilityLabel="Contenido de la nota"
          multiline // permite varias líneas
          value={body}
          onChangeText={setBody}
        />
        <View style={styles.formActions}>
          {/* El texto del botón depende de si estamos editando o creando. */}
          <Pressable style={[styles.btn, { flex: 1 }]} onPress={save} accessibilityRole="button">
            <Text style={styles.btnText}>{editingId ? 'Guardar cambios' : 'Añadir nota'}</Text>
          </Pressable>
          {/* El botón Cancelar solo existe mientras editamos. */}
          {editingId ? (
            <Pressable style={[styles.btn, styles.btnOutline]} onPress={resetForm} accessibilityRole="button">
              <Text style={[styles.btnText, styles.btnOutlineText]}>Cancelar</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Lista de notas como entradas de cuaderno. keyExtractor da a React un id único por fila. */}
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        // Si no hay ninguna: distinguimos "sin resultados" de "aún no hay notas" y damos una pista.
        ListEmptyComponent={
          <Text style={styles.empty}>
            {query.trim() ? `Sin resultados para «${query.trim()}».` : 'Aún no hay notas. Escribe la primera arriba.'}
          </Text>
        }
        renderItem={({ item }) => (
          // renderItem se ejecuta una vez por cada nota (item).
          // La nota que se está editando se resalta con un estilo extra.
          <View style={[styles.entry, item.id === editingId && styles.entryEditing]}>
            <View style={{ flex: 1 }}>
              {/* Highlight subraya las coincidencias de la búsqueda con marcatextos. */}
              <Highlight text={item.title} term={activeTerm} style={styles.entryTitle} />
              {/* El contenido solo se pinta si existe */}
              {item.body ? <Highlight text={item.body} term={activeTerm} style={styles.entryBody} /> : null}
              <Text style={styles.entryDate}>{formatDate(item.created_at)}</Text>
            </View>
            <View style={styles.entryActions}>
              <Pressable onPress={() => startEdit(item)} hitSlop={8} accessibilityRole="button">
                <Text style={styles.link}>Editar</Text>
              </Pressable>
              <Pressable onPress={() => remove(item.id)} hitSlop={8} accessibilityRole="button">
                <Text style={styles.delete}>Borrar</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 64, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  wordmark: { fontFamily: fonts.serifBold, fontSize: 32, lineHeight: 38, color: colors.ink },
  email: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkMuted },
  link: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink, textDecorationLine: 'underline' },

  form: { marginTop: 20, gap: 4 },
  // Título y contenido en la serif de las notas, para escribir como se leerá después.
  titleInput: { fontFamily: fonts.serifSemi, fontSize: 18 },
  bodyInput: { fontFamily: fonts.serif, fontSize: 16, minHeight: 72, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  // Botones casi rectos (radio 4): nada de píldoras redondeadas.
  btn: { backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.ink, borderRadius: 4, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' },
  btnText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.paper },
  btnOutline: { backgroundColor: 'transparent' },
  btnOutlineText: { color: colors.ink },

  // Cada nota es una entrada separada por una línea fina, sin tarjeta ni sombra.
  entry: { flexDirection: 'row', gap: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.rule },
  // Nota en edición: fondo de marcatextos suave que sobresale un poco a los lados.
  entryEditing: { backgroundColor: colors.highlighterSoft, marginHorizontal: -8, paddingHorizontal: 8 },
  entryTitle: { fontFamily: fonts.serifSemi, fontSize: 18, lineHeight: 25, color: colors.ink },
  entryBody: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 24, color: colors.ink, marginTop: 4 },
  entryDate: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, marginTop: 8 },
  entryActions: { gap: 14, alignItems: 'flex-end' },
  delete: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.stamp, textDecorationLine: 'underline' },
  empty: { fontFamily: fonts.sans, fontSize: 15, color: colors.inkMuted, marginTop: 24 },
});

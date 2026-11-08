// useCallback: memoriza una función. useRef: caja que guarda un valor SIN provocar repintado.
import { useCallback, useEffect, useRef, useState } from 'react';
// FlatList: lista eficiente que solo pinta lo que cabe en pantalla.
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Forma de una nota tal y como viene de la base de datos. body puede ser null (nota sin contenido).
type Note = { id: string; title: string; body: string | null; created_at: string };

// Milisegundos que esperamos tras la última tecla antes de buscar.
const SEARCH_DELAY_MS = 300;

// Recibe la sesión como "prop" desde App.tsx; el tipo { session: Session } la describe.
export default function NotesScreen({ session }: { session: Session }) {
  const [notes, setNotes] = useState<Note[]>([]); // lista de notas mostradas
  const [title, setTitle] = useState(''); // lo que se escribe en "Título"
  const [body, setBody] = useState(''); // lo que se escribe en "Contenido"
  const [query, setQuery] = useState(''); // lo que se escribe en "Buscar..."
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

    // Quita los caracteres con significado en la sintaxis de filtros de PostgREST
    // (coma, paréntesis, comillas, comodines...) para que el texto no pueda
    // alterar la consulta. La seguridad real la da RLS; esto evita filtros manipulados.
    const safe = term.replace(/[%_*,()"'\\.:]/g, ' ').trim();

    let request = supabase.from('notes').select('id, title, body, created_at');
    if (safe) {
      // ilike = comparar sin distinguir mayúsculas; % = "cualquier texto". Título O contenido.
      request = request.or(`title.ilike.%${safe}%,body.ilike.%${safe}%`);
    }
    // Los filtros van antes de order(). Más nueva primero.
    const { data, error } = await request.order('created_at', { ascending: false });

    if (id !== requestId.current) return; // mientras esperábamos salió una petición más nueva: ignorar
    if (error) Alert.alert('Error', error.message);
    else setNotes(data ?? []); // "?? []" = si data es null, usa una lista vacía
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
        Alert.alert('Error', error.message);
        return;
      }
      // Si RLS bloquea la fila (o ya no existe) NO hay error: simplemente se actualizan 0 filas.
      if (!data || data.length === 0) {
        Alert.alert('No se pudo actualizar', 'La nota ya no existe o no tienes permiso.');
        return;
      }
    } else {
      // INSERT: user_id lo rellena la base de datos con auth.uid(); no se envía desde el cliente.
      const { error } = await supabase.from('notes').insert(values);
      if (error) {
        Alert.alert('Error', error.message);
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
      Alert.alert('Error', error.message);
      return;
    }
    if (id === editingId) resetForm(); // si borramos la nota que estábamos editando, salimos del modo edición
    fetchNotes(query); // recargamos respetando la búsqueda que haya escrita
  }

  return (
    <View style={styles.container}>
      {/* Cabecera: email del usuario y botón para salir */}
      <View style={styles.header}>
        <Text style={styles.email} numberOfLines={1}>
          {session.user.email}
        </Text>
        {/* signOut cierra la sesión; App.tsx lo detecta y vuelve al login solo. */}
        <Pressable onPress={() => supabase.auth.signOut()}>
          <Text style={styles.link}>Salir</Text>
        </Pressable>
      </View>

      {/* Buscador: guarda lo escrito en el estado "query"; el efecto de arriba hace el resto. */}
      <TextInput style={styles.input} placeholder="Buscar..." value={query} onChangeText={setQuery} />
      <TextInput style={styles.input} placeholder="Título" value={title} onChangeText={setTitle} />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Contenido"
        multiline // permite varias líneas
        value={body}
        onChangeText={setBody}
      />
      {/* El texto del botón depende de si estamos editando o creando. */}
      <Pressable style={styles.btn} onPress={save}>
        <Text style={styles.btnText}>{editingId ? 'Guardar cambios' : 'Añadir nota'}</Text>
      </Pressable>
      {/* El botón Cancelar solo existe mientras editamos. */}
      {editingId ? (
        <Pressable style={[styles.btn, styles.secondary]} onPress={resetForm}>
          <Text style={[styles.btnText, styles.secondaryText]}>Cancelar</Text>
        </Pressable>
      ) : null}

      {/* Lista de notas. keyExtractor da a React un identificador único por fila. */}
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        style={{ marginTop: 16 }}
        // Si no hay ninguna: distinguimos "sin resultados de búsqueda" de "aún no hay notas".
        ListEmptyComponent={<Text style={styles.empty}>{query ? 'Sin resultados' : 'Aún no hay notas'}</Text>}
        renderItem={({ item }) => (
          // renderItem se ejecuta una vez por cada nota (item).
          // La nota que se está editando se resalta con un estilo extra.
          <View style={[styles.note, item.id === editingId && styles.noteEditing]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.noteTitle}>{item.title}</Text>
              {/* El contenido solo se pinta si existe */}
              {item.body ? <Text>{item.body}</Text> : null}
            </View>
            <View style={styles.actions}>
              <Pressable onPress={() => startEdit(item)}>
                <Text style={styles.link}>Editar</Text>
              </Pressable>
              <Pressable onPress={() => remove(item.id)}>
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
  container: { flex: 1, padding: 24, paddingTop: 64, backgroundColor: '#fff', gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  email: { color: '#555', flex: 1 },
  link: { color: '#2563eb', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  btn: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#2563eb' },
  secondaryText: { color: '#2563eb' },
  empty: { textAlign: 'center', color: '#888', marginTop: 24 },
  note: { flexDirection: 'row', gap: 12, padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 8 },
  noteEditing: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  actions: { gap: 8, alignItems: 'flex-end' },
  noteTitle: { fontWeight: '700', fontSize: 16 },
  delete: { color: '#dc2626', fontWeight: '600' },
});

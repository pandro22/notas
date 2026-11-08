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

  // Crea una nota nueva.
  async function add() {
    if (!title.trim()) return; // el título es obligatorio
    // user_id lo rellena la base de datos con auth.uid(); no se envía desde el cliente.
    // body vacío se guarda como null ("" || null da null).
    const { error } = await supabase.from('notes').insert({ title: title.trim(), body: body.trim() || null });
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setTitle(''); // vaciamos los campos
    setBody('');
    fetchNotes(query); // recargamos respetando la búsqueda que haya escrita
  }

  // Borra la nota con ese id. RLS impide borrar notas de otros usuarios.
  async function remove(id: string) {
    const { error } = await supabase.from('notes').delete().eq('id', id); // eq = "igual a"
    if (error) Alert.alert('Error', error.message);
    else fetchNotes(query); // recargamos respetando la búsqueda que haya escrita
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

      {/* Buscador: ahora guarda lo escrito en el estado "query"; el efecto de arriba hace el resto. */}
      <TextInput style={styles.input} placeholder="Buscar..." value={query} onChangeText={setQuery} />
      <TextInput style={styles.input} placeholder="Título" value={title} onChangeText={setTitle} />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Contenido"
        multiline // permite varias líneas
        value={body}
        onChangeText={setBody}
      />
      <Pressable style={styles.btn} onPress={add}>
        <Text style={styles.btnText}>Añadir nota</Text>
      </Pressable>

      {/* Lista de notas. keyExtractor da a React un identificador único por fila. */}
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        style={{ marginTop: 16 }}
        // Si no hay ninguna: distinguimos "sin resultados de búsqueda" de "aún no hay notas".
        ListEmptyComponent={<Text style={styles.empty}>{query ? 'Sin resultados' : 'Aún no hay notas'}</Text>}
        renderItem={({ item }) => (
          // renderItem se ejecuta una vez por cada nota (item).
          <View style={styles.note}>
            <View style={{ flex: 1 }}>
              <Text style={styles.noteTitle}>{item.title}</Text>
              {/* El contenido solo se pinta si existe */}
              {item.body ? <Text>{item.body}</Text> : null}
            </View>
            <Pressable onPress={() => remove(item.id)}>
              <Text style={styles.delete}>Borrar</Text>
            </Pressable>
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
  empty: { textAlign: 'center', color: '#888', marginTop: 24 },
  note: { flexDirection: 'row', gap: 12, padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 8 },
  noteTitle: { fontWeight: '700', fontSize: 16 },
  delete: { color: '#dc2626', fontWeight: '600' },
});

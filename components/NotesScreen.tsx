// useCallback: memoriza una función para que no se recree en cada repintado.
import { useCallback, useEffect, useState } from 'react';
// FlatList: lista eficiente que solo pinta lo que cabe en pantalla.
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Forma de una nota tal y como viene de la base de datos. body puede ser null (nota sin contenido).
type Note = { id: string; title: string; body: string | null; created_at: string };

// Recibe la sesión como "prop" desde App.tsx; el tipo { session: Session } la describe.
export default function NotesScreen({ session }: { session: Session }) {
  const [notes, setNotes] = useState<Note[]>([]); // lista de notas mostradas
  const [title, setTitle] = useState(''); // lo que se escribe en "Título"
  const [body, setBody] = useState(''); // lo que se escribe en "Contenido"

  // Pide las notas a Supabase, de la más nueva a la más antigua.
  // Gracias a RLS, la base de datos solo devuelve las del usuario que ha iniciado sesión.
  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('notes') // tabla
      .select('id, title, body, created_at') // columnas que queremos
      .order('created_at', { ascending: false });
    if (error) Alert.alert('Error', error.message);
    else setNotes(data ?? []); // "?? []" = si data es null, usa una lista vacía
  }, []);

  // Al abrir la pantalla, carga las notas.
  useEffect(() => {
    load();
  }, [load]);

  // Se ejecuta con cada letra escrita en "Buscar...".
  async function search(term: string) {
    // Quita los caracteres con significado en la sintaxis de filtros de PostgREST
    // (coma, paréntesis, comillas, comodines...) para que el texto no pueda
    // alterar la consulta. La seguridad real la da RLS; esto evita filtros manipulados.
    const safe = term.replace(/[%_*,()"'\\.:]/g, ' ').trim();
    // Si el buscador queda vacío, volvemos a mostrar todas las notas.
    if (!safe) {
      load();
      return;
    }
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, body, created_at')
      // ilike = comparar sin distinguir mayúsculas; % = "cualquier texto". Título O contenido.
      .or(`title.ilike.%${safe}%,body.ilike.%${safe}%`)
      .order('created_at', { ascending: false });
    if (error) Alert.alert('Error', error.message);
    else setNotes(data ?? []);
  }

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
    load(); // recargamos la lista para ver la nota nueva
  }

  // Borra la nota con ese id. RLS impide borrar notas de otros usuarios.
  async function remove(id: string) {
    const { error } = await supabase.from('notes').delete().eq('id', id); // eq = "igual a"
    if (error) Alert.alert('Error', error.message);
    else load();
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

      {/* Buscador: sin value, porque no necesitamos guardar lo escrito en el estado. */}
      <TextInput style={styles.input} placeholder="Buscar..." onChangeText={search} />
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
        ListEmptyComponent={<Text style={styles.empty}>Aún no hay notas</Text>} // si no hay ninguna
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

import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Note = { id: string; title: string; body: string | null; created_at: string };

export default function NotesScreen({ session }: { session: Session }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, body, created_at')
      .order('created_at', { ascending: false });
    if (error) Alert.alert('Error', error.message);
    else setNotes(data ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function search(term: string) {
    // Quita los caracteres con significado en la sintaxis de filtros de PostgREST
    // (coma, paréntesis, comillas, comodines...) para que el texto no pueda
    // alterar la consulta. La seguridad real la da RLS; esto evita filtros manipulados.
    const safe = term.replace(/[%_*,()"'\\.:]/g, ' ').trim();
    if (!safe) {
      load();
      return;
    }
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, body, created_at')
      .or(`title.ilike.%${safe}%,body.ilike.%${safe}%`)
      .order('created_at', { ascending: false });
    if (error) Alert.alert('Error', error.message);
    else setNotes(data ?? []);
  }

  async function add() {
    if (!title.trim()) return;
    // user_id lo rellena la base de datos con auth.uid(); no se envía desde el cliente.
    const { error } = await supabase.from('notes').insert({ title: title.trim(), body: body.trim() || null });
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setTitle('');
    setBody('');
    load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) Alert.alert('Error', error.message);
    else load();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.email} numberOfLines={1}>
          {session.user.email}
        </Text>
        <Pressable onPress={() => supabase.auth.signOut()}>
          <Text style={styles.link}>Salir</Text>
        </Pressable>
      </View>

      <TextInput style={styles.input} placeholder="Buscar..." onChangeText={search} />
      <TextInput style={styles.input} placeholder="Título" value={title} onChangeText={setTitle} />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Contenido"
        multiline
        value={body}
        onChangeText={setBody}
      />
      <Pressable style={styles.btn} onPress={add}>
        <Text style={styles.btnText}>Añadir nota</Text>
      </Pressable>

      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        style={{ marginTop: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>Aún no hay notas</Text>}
        renderItem={({ item }) => (
          <View style={styles.note}>
            <View style={{ flex: 1 }}>
              <Text style={styles.noteTitle}>{item.title}</Text>
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

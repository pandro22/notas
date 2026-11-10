import { useState } from 'react';
// FlatList: lista eficiente que solo pinta lo que cabe en pantalla.
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Field from '@/components/Field';
import Screen from '@/components/Screen';
import { colors, fonts } from '@/theme';
import { useDeleteNote, useNotes, useSaveNote, type Note } from './api';
import NoteEntry from './NoteEntry';

// Pestaña "Notas": formulario para crear o editar y la lista de todas las notas.
// Ya no sabe nada de Supabase: los datos llegan por los hooks de api.ts.
export default function NotesScreen() {
  const [title, setTitle] = useState(''); // lo que se escribe en "Título"
  const [body, setBody] = useState(''); // lo que se escribe en "Contenido"
  // id de la nota que se está editando, o null si estamos creando una nueva.
  // Este único dato decide si el formulario CREA o EDITA.
  const [editingId, setEditingId] = useState<string | null>(null);

  // Antes: fetchNotes + requestId + efectos. Ahora una línea. La lista se actualiza sola
  // cuando una mutación (guardar, borrar) invalida la caché.
  const { data, isPending, isError, error, refetch, isRefetching } = useNotes();
  const save = useSaveNote();
  const remove = useDeleteNote();

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

  // Un solo botón para dos acciones: crear o guardar cambios.
  function onSave() {
    if (!title.trim()) return; // el título es obligatorio
    save.mutate(
      // body vacío se guarda como null ("" || null da null).
      { id: editingId, values: { title: title.trim(), body: body.trim() || null } },
      {
        onSuccess: resetForm,
        onError: (e) => Alert.alert('No se pudo guardar', e.message),
      },
    );
  }

  function onDelete(id: string) {
    remove.mutate(id, {
      // Si borramos la nota que estábamos editando, salimos del modo edición.
      onSuccess: () => {
        if (id === editingId) resetForm();
      },
      onError: (e) => Alert.alert('No se pudo borrar', e.message),
    });
  }

  return (
    <Screen>
      <Text style={styles.heading}>Notas</Text>

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
          {/* Mientras se guarda se desactiva el botón: evita notas duplicadas por doble pulsación. */}
          <Pressable
            style={[styles.btn, { flex: 1 }, save.isPending && styles.disabled]}
            disabled={save.isPending}
            onPress={onSave}
            accessibilityRole="button"
          >
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

      <FlatList
        data={data?.notes ?? []}
        keyExtractor={(n) => n.id}
        // Arrastrar hacia abajo para recargar.
        refreshing={isRefetching}
        onRefresh={refetch}
        // Cada estado tiene su mensaje: cargando, error (con salida) o vacío (con una pista).
        ListEmptyComponent={
          isPending ? (
            <Text style={styles.empty}>Cargando notas…</Text>
          ) : isError ? (
            <View>
              <Text style={styles.empty}>No se pudieron cargar las notas. {error.message}</Text>
              <Pressable onPress={() => refetch()} hitSlop={8} accessibilityRole="button">
                <Text style={styles.retry}>Reintentar</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.empty}>Aún no hay notas. Escribe la primera arriba.</Text>
          )
        }
        renderItem={({ item }) => (
          <NoteEntry
            note={item}
            editing={item.id === editingId}
            onEdit={() => startEdit(item)}
            onDelete={() => onDelete(item.id)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: fonts.serifBold, fontSize: 32, lineHeight: 38, color: colors.ink },
  form: { marginTop: 16, marginBottom: 8, gap: 4 },
  // Título y contenido en la serif de las notas, para escribir como se leerá después.
  titleInput: { fontFamily: fonts.serifSemi, fontSize: 18 },
  bodyInput: { fontFamily: fonts.serif, fontSize: 16, minHeight: 72, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  // Botones casi rectos (radio 4): nada de píldoras redondeadas.
  btn: { backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.ink, borderRadius: 4, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' },
  btnText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.paper },
  btnOutline: { backgroundColor: 'transparent' },
  btnOutlineText: { color: colors.ink },
  disabled: { opacity: 0.5 },
  empty: { fontFamily: fonts.sans, fontSize: 15, color: colors.inkMuted, marginTop: 24 },
  retry: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink, textDecorationLine: 'underline', marginTop: 12 },
});

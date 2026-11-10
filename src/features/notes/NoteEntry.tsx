import { Pressable, StyleSheet, Text, View } from 'react-native';
import Highlight from '@/components/Highlight';
import { colors, fonts } from '@/theme';
import type { Note } from './api';

// "2026-11-08T12:51:22Z" -> "8 nov"
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

type Props = {
  note: Note;
  term?: string; // término buscado, para resaltarlo
  editing?: boolean; // true si es la nota que se está editando
  onEdit?: () => void; // si no se pasa, no aparece el botón
  onDelete?: () => void;
};

// Una entrada del cuaderno. La usan las pestañas Notas (con acciones) y Buscar (solo lectura).
export default function NoteEntry({ note, term = '', editing, onEdit, onDelete }: Props) {
  return (
    <View style={[styles.entry, editing && styles.entryEditing]}>
      <View style={{ flex: 1 }}>
        {/* Highlight subraya las coincidencias de la búsqueda con marcatextos. */}
        <Highlight text={note.title} term={term} style={styles.title} />
        {/* El contenido solo se pinta si existe */}
        {note.body ? <Highlight text={note.body} term={term} style={styles.body} /> : null}
        <Text style={styles.date}>{formatDate(note.created_at)}</Text>
      </View>
      {onEdit || onDelete ? (
        <View style={styles.actions}>
          {onEdit ? (
            <Pressable onPress={onEdit} hitSlop={8} accessibilityRole="button">
              <Text style={styles.link}>Editar</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button">
              <Text style={styles.delete}>Borrar</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Cada nota es una entrada separada por una línea fina, sin tarjeta ni sombra.
  entry: { flexDirection: 'row', gap: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.rule },
  // Nota en edición: fondo de marcatextos suave que sobresale un poco a los lados.
  entryEditing: { backgroundColor: colors.highlighterSoft, marginHorizontal: -8, paddingHorizontal: 8 },
  title: { fontFamily: fonts.serifSemi, fontSize: 18, lineHeight: 25, color: colors.ink },
  body: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 24, color: colors.ink, marginTop: 4 },
  date: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, marginTop: 8 },
  actions: { gap: 14, alignItems: 'flex-end' },
  link: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink, textDecorationLine: 'underline' },
  delete: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.stamp, textDecorationLine: 'underline' },
});

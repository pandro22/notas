import { useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import Field from '@/components/Field';
import Screen from '@/components/Screen';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { colors, fonts } from '@/theme';
import { useNotes } from './api';
import NoteEntry from './NoteEntry';

// Milisegundos que esperamos tras la última tecla antes de buscar.
const SEARCH_DELAY_MS = 300;

// Pestaña "Buscar": busca en título y contenido y subraya las coincidencias con marcatextos.
export default function SearchScreen() {
  const [query, setQuery] = useState(''); // lo que se escribe, letra a letra
  // Versión "con retraso" del texto: solo cambia cuando el usuario deja de escribir 300 ms.
  const debounced = useDebouncedValue(query, SEARCH_DELAY_MS);
  const hasTerm = debounced.trim().length > 0;

  // Sin término no se consulta nada (tercer argumento: enabled).
  const { data, isError, error } = useNotes(debounced, hasTerm);
  const results = data?.notes ?? [];

  return (
    <Screen>
      <Text style={styles.heading}>Buscar</Text>
      <Field
        placeholder="Buscar en título y contenido"
        accessibilityLabel="Buscar notas"
        autoCapitalize="none"
        value={query}
        onChangeText={setQuery}
      />

      {/* Mensaje de estado: una sola línea, siempre en el mismo sitio. */}
      <Text style={styles.status}>
        {!hasTerm
          ? 'Escribe para buscar en tus notas.'
          : isError
            ? `No se pudo buscar. ${error.message}`
            : data
              ? `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`
              : 'Buscando…'}
      </Text>

      <FlatList
        // Si se vació el buscador, no se muestran resultados antiguos.
        data={hasTerm ? results : []}
        keyExtractor={(n) => n.id}
        keyboardShouldPersistTaps="handled"
        // data.term es el término con el que se obtuvieron ESTOS resultados.
        renderItem={({ item }) => <NoteEntry note={item} term={data?.term} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: fonts.serifBold, fontSize: 32, lineHeight: 38, color: colors.ink, marginBottom: 8 },
  status: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkMuted, marginTop: 12, marginBottom: 4 },
});

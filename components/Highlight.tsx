import type { ReactNode } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { colors } from '../theme';

type Props = { text: string; term: string; style?: TextProps['style'] };

// Pinta un texto subrayando con "marcatextos" cada aparición del término buscado.
// Ejemplo: text="Apuntes de RLS", term="rls"  ->  Apuntes de [RLS]
export default function Highlight({ text, term, style }: Props) {
  // Sin término de búsqueda: texto normal.
  if (!term) return <Text style={style}>{text}</Text>;

  const haystack = text.toLowerCase(); // se compara sin distinguir mayúsculas...
  const needle = term.toLowerCase();
  // ...pero se recorta del texto ORIGINAL. Algunos caracteres raros cambian de longitud al
  // pasar a minúsculas y desajustarían las posiciones: en ese caso, mejor no resaltar.
  if (haystack.length !== text.length) return <Text style={style}>{text}</Text>;

  const parts: ReactNode[] = [];
  let from = 0; // desde dónde seguimos buscando
  let key = 0; // React necesita una clave única por cada trozo de la lista

  while (true) {
    const i = haystack.indexOf(needle, from); // posición de la siguiente coincidencia
    if (i === -1) break; // no quedan más
    if (i > from) parts.push(text.slice(from, i)); // texto normal antes de la coincidencia
    parts.push(
      <Text key={key++} style={styles.mark}>
        {text.slice(i, i + needle.length)}
      </Text>,
    );
    from = i + needle.length;
  }
  parts.push(text.slice(from)); // lo que quede tras la última coincidencia

  // Un Text puede contener trozos de texto y otros Text anidados, que heredan su estilo.
  return <Text style={style}>{parts}</Text>;
}

const styles = StyleSheet.create({
  mark: { backgroundColor: colors.highlighter },
});

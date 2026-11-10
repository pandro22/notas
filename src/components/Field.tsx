import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { colors, fonts } from '../theme';

// Caja de texto con estilo de cuaderno: solo una línea inferior, que se oscurece al enfocarla.
// Recibe las mismas props que un TextInput normal (placeholder, value, onChangeText...).
export default function Field({ style, onFocus, onBlur, ...props }: TextInputProps) {
  // true mientras la caja tiene el cursor. Hace visible el foco, también con teclado externo.
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.placeholder}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e); // si quien nos usa pasó su propio onFocus, también se ejecuta
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      // Lista de estilos: base, luego el de foco (si aplica) y por último el que pase el padre.
      style={[styles.field, focused && styles.focused, style]}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: 10,
    paddingHorizontal: 0,
    // Siempre 2 px de grosor: solo cambia el color, así la caja no "salta" al enfocarse.
    borderBottomWidth: 2,
    borderBottomColor: colors.rule,
  },
  focused: { borderBottomColor: colors.ink },
});

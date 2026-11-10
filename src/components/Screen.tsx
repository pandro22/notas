import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';

// Contenedor común de todas las pantallas con pestañas: fondo de papel y margen superior que
// respeta el notch / la barra de estado de cada móvil (antes era un "64" fijo, que no valía para todos).
export default function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets(); // huecos reservados por el sistema (notch, barra de estado...)
  return <View style={[styles.screen, { paddingTop: insets.top + 16 }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, backgroundColor: colors.paper },
});

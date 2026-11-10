import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { colors, fonts } from '@/theme';

// Pantalla "Acerca de". No es una pestaña: se abre encima de las pestañas, con botón de volver.
export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Notas</Text>
      <Text style={styles.text}>Una app de notas para aprender: Expo, Supabase y seguridad.</Text>
      <Text style={styles.version}>Versión {Constants.expoConfig?.version}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.paper },
  heading: { fontFamily: fonts.serifBold, fontSize: 32, lineHeight: 38, color: colors.ink },
  text: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, color: colors.ink, marginTop: 12 },
  version: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, marginTop: 24 },
});

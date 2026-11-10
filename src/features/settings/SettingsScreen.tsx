import { Pressable, StyleSheet, Text, View } from 'react-native';
// Constants da acceso a la configuración de app.json (nombre, versión...).
import Constants from 'expo-constants';
import { Link } from 'expo-router';
import Screen from '@/components/Screen';
import { useSession } from '@/features/auth/session';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

// Pestaña "Ajustes": datos de la cuenta y cierre de sesión (antes estaban en la cabecera de Notas).
export default function SettingsScreen() {
  const { session } = useSession();

  return (
    <Screen>
      <Text style={styles.heading}>Ajustes</Text>

      <View style={styles.block}>
        <Text style={styles.label}>Sesión iniciada como</Text>
        <Text style={styles.value}>{session?.user.email}</Text>
      </View>

      {/* signOut cierra la sesión: la ruta protegida del layout raíz nos devuelve al login sola. */}
      <Pressable style={styles.btn} onPress={() => supabase.auth.signOut()} accessibilityRole="button">
        <Text style={styles.btnText}>Cerrar sesión</Text>
      </Pressable>

      {/* Link navega a otra ruta. href="/about" apunta al archivo src/app/about.tsx. */}
      <Link href="/about" style={styles.link}>
        Acerca de
      </Link>

      <Text style={styles.version}>Versión {Constants.expoConfig?.version}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: fonts.serifBold, fontSize: 32, lineHeight: 38, color: colors.ink },
  block: { marginTop: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.rule },
  label: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkMuted },
  value: { fontFamily: fonts.sansMedium, fontSize: 17, color: colors.ink, marginTop: 4 },
  btn: { marginTop: 24, borderWidth: 2, borderColor: colors.ink, borderRadius: 4, paddingVertical: 12, alignItems: 'center' },
  btnText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  link: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink, textDecorationLine: 'underline', marginTop: 24 },
  version: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, marginTop: 24 },
});

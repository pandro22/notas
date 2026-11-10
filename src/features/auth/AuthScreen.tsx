import { useState } from 'react';
// Alert: ventana emergente. Pressable: botón táctil. StyleSheet: estilos.
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import Field from '@/components/Field';
import { colors, fonts } from '@/theme';

// Pantalla de login y registro.
export default function AuthScreen() {
  // Lo que el usuario escribe en cada caja. Cada tecla pulsada actualiza el estado.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // true mientras esperamos a Supabase: desactiva los botones para evitar dobles envíos.
  const [busy, setBusy] = useState(false);
  // false = contraseña oculta con puntos; true = se ve el texto. Empieza oculta, por seguridad.
  const [showPassword, setShowPassword] = useState(false);

  // Una sola función para las dos acciones. El tipo 'login' | 'signup' solo admite esos dos valores.
  async function submit(mode: 'login' | 'signup') {
    // Validación en el cliente: es una ayuda para el usuario, NO una medida de seguridad.
    // (La política real de contraseñas se configura en Supabase.)
    if (!email.trim() || password.length < 8) {
      Alert.alert('Revisa los datos', 'Escribe un email y una contraseña de al menos 8 caracteres.');
      return; // salimos sin llamar a Supabase
    }
    setBusy(true);
    // trim() quita espacios sobrantes del email. Nunca registramos esto en logs: lleva la contraseña.
    const creds = { email: email.trim(), password };
    // Según el modo, iniciamos sesión o creamos la cuenta. await espera la respuesta.
    const { error } =
      mode === 'login' ? await supabase.auth.signInWithPassword(creds) : await supabase.auth.signUp(creds);
    setBusy(false);
    if (error) {
      Alert.alert('No se pudo continuar', error.message);
    } else if (mode === 'signup') {
      Alert.alert('Cuenta creada', 'Si se pide confirmación, revisa tu email.');
    }
    // Si el login va bien no hay que hacer nada más: App.tsx detecta la sesión nueva
    // con onAuthStateChange y cambia sola a la pantalla de notas.
  }

  return (
    <View style={styles.container}>
      {/* Nombre de la app: lo único grande de la pantalla. */}
      <Text style={styles.wordmark}>Notas</Text>
      <Text style={styles.lead}>Entra para ver tus notas.</Text>

      <Field
        placeholder="Email"
        accessibilityLabel="Email"
        autoCapitalize="none" // no poner la primera letra en mayúscula
        keyboardType="email-address" // teclado con @
        autoComplete="email" // permite autorrelleno del sistema
        value={email} // el valor lo controla el estado...
        onChangeText={setEmail} // ...y cada cambio lo actualiza
      />
      <Field
        placeholder="Contraseña (mínimo 8 caracteres)"
        accessibilityLabel="Contraseña"
        secureTextEntry={!showPassword} // oculta con puntos, salvo que el usuario pida verla
        autoCapitalize="none"
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />
      {/* Alterna el estado: !showPassword invierte true/false. Al cambiar, React repinta la caja. */}
      <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.toggle} hitSlop={8}>
        <Text style={styles.toggleText}>{showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}</Text>
      </Pressable>

      <View style={styles.actions}>
        {/* style como lista: se combinan estilos; busy && styles.disabled solo se aplica si busy es true. */}
        <Pressable
          style={[styles.btn, busy && styles.disabled]}
          disabled={busy}
          onPress={() => submit('login')}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>Entrar</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnOutline, busy && styles.disabled]}
          disabled={busy}
          onPress={() => submit('signup')}
          accessibilityRole="button"
        >
          <Text style={[styles.btnText, styles.btnOutlineText]}>Crear cuenta</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Estilos (parecidos a CSS, pero en JavaScript). flex: 1 = ocupar toda la pantalla;
// gap = separación entre elementos hijos.
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 28, gap: 8, backgroundColor: colors.paper },
  wordmark: { fontFamily: fonts.serifBold, fontSize: 56, lineHeight: 62, color: colors.ink },
  lead: { fontFamily: fonts.sans, fontSize: 16, color: colors.inkMuted, marginBottom: 24 },
  toggle: { alignSelf: 'flex-start', paddingVertical: 4 },
  toggleText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink, textDecorationLine: 'underline' },
  actions: { gap: 12, marginTop: 20 },
  // Botones casi rectos (radio 4): nada de píldoras redondeadas.
  btn: { backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.ink, borderRadius: 4, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.paper },
  btnOutline: { backgroundColor: 'transparent' },
  btnOutlineText: { color: colors.ink },
  disabled: { opacity: 0.5 },
});

import { useState } from 'react';
// Alert: ventana emergente. Pressable: botón táctil. TextInput: caja de texto. StyleSheet: estilos.
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

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
      Alert.alert('Datos no válidos', 'Introduce un email y una contraseña de al menos 8 caracteres.');
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
      Alert.alert('Error', error.message);
    } else if (mode === 'signup') {
      Alert.alert('Cuenta creada', 'Revisa tu email si pide confirmación.');
    }
    // Si el login va bien no hay que hacer nada más: App.tsx detecta la sesión nueva
    // con onAuthStateChange y cambia sola a la pantalla de notas.
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis notas</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none" // no poner la primera letra en mayúscula
        keyboardType="email-address" // teclado con @
        autoComplete="email" // permite autorrelleno del sistema
        value={email} // el valor lo controla el estado...
        onChangeText={setEmail} // ...y cada cambio lo actualiza
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña (mín. 8)"
        secureTextEntry={!showPassword} // oculta con puntos, salvo que el usuario pida verla
        autoCapitalize="none"
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />
      {/* Alterna el estado: !showPassword invierte true/false. Al cambiar, React repinta la caja. */}
      <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.toggle}>
        <Text style={styles.toggleText}>{showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}</Text>
      </Pressable>

      {/* style como lista: se combinan estilos; busy && styles.disabled solo se aplica si busy es true. */}
      <Pressable style={[styles.btn, busy && styles.disabled]} disabled={busy} onPress={() => submit('login')}>
        <Text style={styles.btnText}>Entrar</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, styles.secondary, busy && styles.disabled]}
        disabled={busy}
        onPress={() => submit('signup')}
      >
        <Text style={[styles.btnText, styles.secondaryText]}>Crear cuenta</Text>
      </Pressable>
    </View>
  );
}

// Estilos (parecidos a CSS, pero en JavaScript). flex: 1 = ocupar toda la pantalla;
// gap = separación entre elementos hijos.
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  btn: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center' },
  secondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#2563eb' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondaryText: { color: '#2563eb' },
  toggle: { alignSelf: 'flex-end' }, // lo pega a la derecha, bajo la caja
  toggleText: { color: '#2563eb', fontSize: 14 },
  disabled: { opacity: 0.5 },
});

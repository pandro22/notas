import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(mode: 'login' | 'signup') {
    if (!email.trim() || password.length < 8) {
      Alert.alert('Datos no válidos', 'Introduce un email y una contraseña de al menos 8 caracteres.');
      return;
    }
    setBusy(true);
    const creds = { email: email.trim(), password };    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword(creds)
        : await supabase.auth.signUp(creds);
    setBusy(false);
    if (error) Alert.alert('Error', error.message);
    else if (mode === 'signup') Alert.alert('Cuenta creada', 'Revisa tu email si pide confirmación.');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis notas</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña (mín. 8)"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />
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

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  btn: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center' },
  secondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#2563eb' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondaryText: { color: '#2563eb' },
  disabled: { opacity: 0.5 },
});

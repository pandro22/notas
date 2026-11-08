// Hooks de React: useState guarda datos que cambian; useEffect ejecuta código en momentos concretos.
import { useEffect, useState } from 'react';
// Componentes visuales básicos: View es una caja contenedora, ActivityIndicator es la ruedita de carga.
import { ActivityIndicator, View } from 'react-native';
// Controla la barra superior del móvil (hora, batería...).
import { StatusBar } from 'expo-status-bar';
// "import type": solo trae el TIPO Session para TypeScript; desaparece al compilar.
import type { Session } from '@supabase/supabase-js';
// Nuestra conexión única a Supabase (ver lib/supabase.ts).
import { supabase } from './lib/supabase';
// Las dos pantallas de la app.
import AuthScreen from './components/AuthScreen';
import NotesScreen from './components/NotesScreen';

// Componente raíz: decide qué pantalla mostrar según haya sesión o no.
export default function App() {
  // Sesión actual. Puede ser una Session o null (nadie ha entrado). Al cambiarla, React repinta.
  const [session, setSession] = useState<Session | null>(null);
  // true mientras averiguamos si ya había una sesión guardada en el móvil.
  const [loading, setLoading] = useState(true);

  // El [] del final significa: ejecutar UNA sola vez, al abrir la app.
  useEffect(() => {
    // Pregunta a Supabase si hay una sesión guardada (así no hay que hacer login cada vez).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session); // la sesión, o null si no hay
      setLoading(false); // ya sabemos la respuesta: quitamos la pantalla de carga
    });

    // Se queda escuchando: login, logout o token caducado. Así la pantalla cambia sola.
    // (_event lleva guion bajo porque lo recibimos pero no lo usamos)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));

    // Función de limpieza: React la llama al cerrar el componente para dejar de escuchar.
    return () => sub.subscription.unsubscribe();
  }, []);

  // Mientras comprobamos la sesión, solo se ve la ruedita (evita un parpadeo del login).
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    // <> </> es un fragmento: envoltorio invisible, porque React exige devolver un solo elemento.
    <>
      {/* Si hay sesión -> notas (le pasamos la sesión como prop); si no -> login. */}
      {session ? <NotesScreen session={session} /> : <AuthScreen />}
      <StatusBar style="auto" />
    </>
  );
}

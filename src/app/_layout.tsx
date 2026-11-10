import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, useSession } from '@/features/auth/session';
import { queryClient } from '@/lib/query';
import { colors, fontAssets } from '@/theme';

// Mantiene visible la pantalla de carga nativa hasta que sepamos si hay sesión y estén las fuentes.
SplashScreen.preventAutoHideAsync();

// Este archivo es el LAYOUT RAÍZ: lo primero que se monta. Sustituye a App.tsx.
// Aquí se colocan los "proveedores" que necesita toda la app.
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { session, loading } = useSession();
  // Si las fuentes fallan seguimos con la del sistema: la app es usable igualmente.
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const ready = !loading && (fontsLoaded || !!fontError);

  // Cuando todo está listo, quitamos la pantalla de carga.
  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
        {/* RUTAS PROTEGIDAS. Con sesión solo existe (tabs); sin sesión solo existe sign-in.
            Al iniciar o cerrar sesión el router cambia de pantalla él solo: ya no hace falta
            el "session ? <Notas/> : <Login/>" de App.tsx. Además, un enlace profundo a una
            pantalla privada no funciona sin sesión. */}
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" />
          {/* about también es privada. Aquí sí mostramos cabecera para tener el botón de volver. */}
          <Stack.Screen name="about" options={{ headerShown: true, title: 'Acerca de', headerBackTitle: 'Atrás' }} />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

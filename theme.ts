// Tema visual de la app: "papel de laboratorio".
// Todos los colores y tipografías viven aquí para no repetirlos por las pantallas.
import { Literata_400Regular, Literata_600SemiBold, Literata_700Bold } from '@expo-google-fonts/literata';
import {
  SchibstedGrotesk_400Regular,
  SchibstedGrotesk_500Medium,
  SchibstedGrotesk_600SemiBold,
} from '@expo-google-fonts/schibsted-grotesk';

export const colors = {
  paper: '#EDF1EF', // fondo: gris verdoso frío
  ink: '#1B2540', // texto y botones: azul tinta (en vez de negro)
  inkMuted: '#5B6678', // texto secundario (fechas, email)
  placeholder: '#6B7587', // texto de ayuda dentro de los campos
  rule: '#C9D2CE', // líneas finas de separación
  highlighter: '#F4DA4E', // marcatextos: coincidencias de la búsqueda
  highlighterSoft: '#F5E9A0', // marcatextos suave: nota que se está editando
  stamp: '#B8412F', // sello rojo: solo para borrar
};

// En React Native cada peso de una fuente es una "familia" distinta.
// Con fuentes propias NO se usa fontWeight: se elige directamente la familia.
export const fonts = {
  serif: 'Literata_400Regular', // contenido de las notas
  serifSemi: 'Literata_600SemiBold', // títulos
  serifBold: 'Literata_700Bold', // nombre de la app
  sans: 'SchibstedGrotesk_400Regular', // campos y texto de interfaz
  sansMedium: 'SchibstedGrotesk_500Medium', // enlaces
  sansSemi: 'SchibstedGrotesk_600SemiBold', // botones
};

// Mapa que se entrega a useFonts() en App.tsx para descargar y registrar las fuentes.
export const fontAssets = {
  Literata_400Regular,
  Literata_600SemiBold,
  Literata_700Bold,
  SchibstedGrotesk_400Regular,
  SchibstedGrotesk_500Medium,
  SchibstedGrotesk_600SemiBold,
};

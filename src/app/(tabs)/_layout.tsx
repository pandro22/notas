import { NativeTabs } from 'expo-router/native-tabs';
import { colors, fonts } from '@/theme';

// Menú inferior. Es NATIVO: iOS y Android lo dibujan con sus propios componentes del sistema.
// Cada Trigger enlaza con un archivo de esta carpeta: index.tsx, search.tsx y settings.tsx.
export default function TabsLayout() {
  return (
    <NativeTabs
      backgroundColor={colors.paper}
      indicatorColor={colors.highlighterSoft}
      tintColor={colors.ink}
      labelStyle={{ default: { fontFamily: fonts.sansMedium, color: colors.inkMuted }, selected: { color: colors.ink } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Notas</NativeTabs.Trigger.Label>
        {/* sf = icono de iOS (SF Symbols); md = icono de Android (Material). */}
        <NativeTabs.Trigger.Icon sf="note.text" md="description" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label>Buscar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Ajustes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

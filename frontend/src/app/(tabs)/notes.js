import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { EmptyState, SectionHeading, Surface } from '../../components/UI';
import { colors, radius } from '../../constants/theme';

export default function NotesScreen() {
  return (
    <Screen>
      <Text style={styles.eyebrow}>YOUR KNOWLEDGE LIBRARY</Text>
      <Text style={styles.title}>Notes</Text>
      <Text style={styles.subtitle}>Keep useful thoughts, discoveries, and ideas close.</Text>
      <View style={styles.search}><Text style={styles.searchText}>⌕  Search your notes...</Text></View>
      <SectionHeading title="All notes" action="Newest first" />
      <Surface style={styles.emptyCard}>
        <View style={styles.icon}><Text style={styles.iconText}>▤</Text></View>
        <EmptyState title="Nothing saved yet" description="Your notes will appear here. Capture an idea whenever inspiration strikes." />
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', letterSpacing: -0.8, marginTop: 7 },
  subtitle: { color: colors.secondary, fontSize: 13, lineHeight: 20, marginTop: 6, marginBottom: 22 },
  search: { height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center', paddingHorizontal: 14, marginBottom: 26 },
  searchText: { color: colors.muted, fontSize: 12 },
  emptyCard: { alignItems: 'center', paddingVertical: 24 },
  icon: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: colors.primary, fontSize: 24 },
});
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../components/Screen';
import { EmptyState, Pill, SectionHeading, Surface } from '../../components/UI';
import { colors, radius, spacing } from '../../constants/theme';

const stats = [
  { label: 'Notes', value: '—', detail: 'Ready to connect', tint: colors.primarySoft, accent: colors.primaryDark },
  { label: 'Tasks', value: '—', detail: 'Ready to connect', tint: colors.blueSoft, accent: colors.blue },
  { label: 'Reminders', value: '—', detail: 'Ready to connect', tint: colors.warningSoft, accent: colors.warning },
];

export default function HomeScreen() {
  return (
    <Screen>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>YOUR PERSONAL SPACE</Text>
          <Text style={styles.brand}>BrainCache<Text style={styles.brandDot}>.</Text></Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>B</Text></View>
      </View>

      <View style={styles.greeting}>
        <Text style={styles.greetingTitle}>Good afternoon</Text>
        <Text style={styles.greetingSub}>A little progress adds up. What would you like to focus on?</Text>
      </View>

      <Pressable style={styles.search} onPress={() => router.push('/ai')} accessibilityRole="button">
        <Text style={styles.searchGlyph}>⌕</Text>
        <Text style={styles.searchText}>Search your knowledge or ask AI...</Text>
        <Text style={styles.searchKey}>⌘ K</Text>
      </Pressable>

      <SectionHeading title="Your overview" action="View all" onAction={() => router.push('/tasks')} />
      <View style={styles.statsRow}>
        {stats.map((item) => (
          <View key={item.label} style={[styles.statCard, { backgroundColor: item.tint }]}>
            <Text style={[styles.statValue, { color: item.accent }]}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
            <Text style={styles.statDetail}>{item.detail}</Text>
          </View>
        ))}
      </View>

      <SectionHeading title="Quick capture" />
      <View style={styles.captureRow}>
        <CaptureButton glyph="＋" title="New note" subtitle="Save an idea" onPress={() => router.push('/notes')} />
        <CaptureButton glyph="✓" title="Add task" subtitle="Plan a next step" onPress={() => router.push('/tasks')} />
      </View>

      <SectionHeading title="Today's focus" action="See tasks" onAction={() => router.push('/tasks')} />
      <Surface>
        <View style={styles.focusHeader}>
          <View style={styles.focusIcon}><Text style={styles.focusIconText}>✦</Text></View>
          <Pill label="A gentle reminder" tone="green" />
        </View>
        <Text style={styles.focusTitle}>Make space for what matters.</Text>
        <Text style={styles.focusBody}>Your notes, plans, and ideas live here. Start by capturing one thing you don't want to forget.</Text>
        <Pressable style={styles.focusLink} onPress={() => router.push('/notes')}>
          <Text style={styles.focusLinkText}>Open your notes  →</Text>
        </Pressable>
      </Surface>

      <SectionHeading title="Recently captured" />
      <Surface style={styles.recentCard}>
        <EmptyState title="Your knowledge space starts here" description="New notes and ideas will appear here as you capture them." />
      </Surface>
      <Text style={styles.footer}>A calmer place for a clearer mind.</Text>
    </Screen>
  );
}

function CaptureButton({ glyph, title, subtitle, onPress }) {
  return (
    <Pressable style={styles.captureCard} onPress={onPress} accessibilityRole="button">
      <Text style={styles.captureGlyph}>{glyph}</Text>
      <Text style={styles.captureTitle}>{title}</Text>
      <Text style={styles.captureSub}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: colors.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 1.7, marginBottom: 5 },
  brand: { color: colors.ink, fontSize: 25, fontWeight: '800', letterSpacing: -1.1 },
  brandDot: { color: colors.primary },
  avatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primaryDark, fontWeight: '800', fontSize: 16 },
  greeting: { marginTop: 28, marginBottom: 18 },
  greetingTitle: { color: colors.ink, fontSize: 27, fontWeight: '800', letterSpacing: -0.8 },
  greetingSub: { color: colors.secondary, fontSize: 13, lineHeight: 20, marginTop: 6, maxWidth: 310 },
  search: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, height: 52, flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  searchGlyph: { color: colors.primary, fontSize: 25, marginRight: 10 },
  searchText: { color: colors.muted, fontSize: 12, flex: 1 },
  searchKey: { color: colors.secondary, backgroundColor: colors.surfaceMuted, borderRadius: 6, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 4, fontSize: 10 },
  statsRow: { flexDirection: 'row', gap: 9, marginBottom: 27 },
  statCard: { flex: 1, minHeight: 112, borderRadius: radius.md, padding: 12, justifyContent: 'space-between' },
  statValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.8 },
  statLabel: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  statDetail: { color: colors.secondary, fontSize: 9, marginTop: 2 },
  captureRow: { flexDirection: 'row', gap: 12, marginBottom: 27 },
  captureCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 15, minHeight: 112 },
  captureGlyph: { color: colors.primary, fontSize: 23, marginBottom: 9 },
  captureTitle: { color: colors.ink, fontWeight: '700', fontSize: 13 },
  captureSub: { color: colors.secondary, fontSize: 11, marginTop: 4 },
  focusHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  focusIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  focusIconText: { color: colors.primary, fontSize: 17 },
  focusTitle: { color: colors.ink, fontWeight: '800', fontSize: 17, letterSpacing: -0.3 },
  focusBody: { color: colors.secondary, fontSize: 12, lineHeight: 19, marginTop: 7 },
  focusLink: { marginTop: 15, alignSelf: 'flex-start' },
  focusLinkText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  recentCard: { padding: 0, marginBottom: 10 },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 10, marginTop: 16, marginBottom: 4 },
});